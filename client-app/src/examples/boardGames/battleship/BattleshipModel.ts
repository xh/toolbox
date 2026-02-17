import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {span} from '@xh/hoist/cmp/layout';

//------------------------------------------------------------------
// Types
//------------------------------------------------------------------
type CellState = 'water' | 'ship' | 'hit' | 'miss' | 'sunk';
type Phase = 'placement' | 'playing' | 'gameOver';
type Orientation = 'horizontal' | 'vertical';

interface Ship {
    id: string;
    name: string;
    size: number;
    cells: {r: number; c: number}[];
    hits: Set<string>;
    isSunk: boolean;
}

interface AIState {
    mode: 'hunt' | 'random';
    targets: {r: number; c: number}[];
    lastHit: {r: number; c: number} | null;
}

//------------------------------------------------------------------
// Constants
//------------------------------------------------------------------
const GRID_COLS = 12;
const GRID_ROWS = 8;
const CELL_SIZE = 30;
const ROW_NUM_WIDTH = 30;
const COL_LETTERS = 'ABCDEFGHIJKL'.split('');

/** Grid pixel width: row-number column + game columns + buffer for ag-Grid internal borders. */
export const BOARD_WIDTH = ROW_NUM_WIDTH + GRID_COLS * CELL_SIZE + 5;
/** Grid pixel height: rows + header (24px standard) + buffer for ag-Grid internal borders. */
export const BOARD_HEIGHT = GRID_ROWS * CELL_SIZE + 25;

const SHIP_DEFS = [
    {id: 'carrier', name: 'Carrier', size: 5},
    {id: 'battleship', name: 'Battleship', size: 4},
    {id: 'cruiser', name: 'Cruiser', size: 3},
    {id: 'submarine', name: 'Submarine', size: 3},
    {id: 'destroyer', name: 'Destroyer', size: 2}
];

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
export class BattleshipModel extends HoistModel {
    @observable phase: Phase = 'placement';
    @observable isPlayerTurn: boolean = true;
    @bindable orientation: Orientation = 'horizontal';

    @managed @observable.ref playerGridModel: GridModel = null;
    @managed @observable.ref attackGridModel: GridModel = null;

    // Board state: GRID_ROWS x GRID_COLS arrays
    private playerBoard: CellState[][] = [];
    private attackBoard: CellState[][] = [];
    private aiBoard: CellState[][] = [];

    // Ships
    @observable.ref playerShips: Ship[] = [];
    @observable.ref aiShips: Ship[] = [];
    private shipPlacementIndex: number = 0;

    // AI state
    private aiState: AIState = {mode: 'random', targets: [], lastHit: null};

    // Per-cell border classes for distinguishing adjacent ships on the player board.
    private shipBorderMap: string[][] = [];

    // Placement preview — tracks hovered cell on player board
    @observable.ref hoverCell: {r: number; c: number} | null = null;

    constructor() {
        super();
        makeObservable(this);
        this.newGame();

        // Re-sync player grid when hover changes during placement to show ship preview.
        this.addReaction({
            track: () => [this.hoverCell, this.orientation],
            run: () => {
                if (this.phase === 'placement') {
                    this.syncBoard(this.playerGridModel, this.playerBoard, true);
                }
            }
        });
    }

    get currentShipToPlace(): (typeof SHIP_DEFS)[0] | null {
        return this.phase === 'placement' ? (SHIP_DEFS[this.shipPlacementIndex] ?? null) : null;
    }

    @computed
    get phaseText(): string {
        switch (this.phase) {
            case 'placement': {
                const ship = this.currentShipToPlace;
                return ship ? `Place your ${ship.name} (${ship.size})` : 'All ships placed!';
            }
            case 'playing':
                return this.isPlayerTurn
                    ? 'Your turn — click the Attack Board to fire!'
                    : 'Enemy is firing...';
            case 'gameOver':
                return this.playerShips.every(s => s.isSunk)
                    ? 'Defeat! All your ships have been sunk.'
                    : 'Victory! You sank all enemy ships!';
            default:
                return '';
        }
    }

    //------------------------------------------------------------------
    // Actions
    //------------------------------------------------------------------
    @action
    newGame() {
        this.phase = 'placement';
        this.isPlayerTurn = true;
        this.shipPlacementIndex = 0;
        this.orientation = 'horizontal';
        this.playerShips = [];
        this.aiShips = [];
        this.aiState = {mode: 'random', targets: [], lastHit: null};

        this.playerBoard = this.createEmptyBoard();
        this.attackBoard = this.createEmptyBoard();
        this.aiBoard = this.createEmptyBoard();
        this.shipBorderMap = [];

        // AI places its ships randomly
        this.placeAIShips();

        this.rebuildGrids();
    }

    @action
    toggleOrientation() {
        this.orientation = this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    }

    @action
    setHoverCell(row: number, col: number) {
        this.hoverCell = {r: row, c: col};
    }

    @action
    clearHoverCell() {
        this.hoverCell = null;
    }

    //------------------------------------------------------------------
    // Player ship placement
    //------------------------------------------------------------------
    @action
    handlePlayerBoardClick(row: number, col: number) {
        if (this.phase !== 'placement') return;

        const shipDef = this.currentShipToPlace;
        if (!shipDef) return;

        const cells = this.getShipCells(row, col, shipDef.size, this.orientation);
        if (!this.isValidPlacement(cells, this.playerBoard)) {
            XH.warningToast('Invalid placement — ships cannot overlap or extend off the board.');
            return;
        }

        const ship: Ship = {
            id: shipDef.id,
            name: shipDef.name,
            size: shipDef.size,
            cells,
            hits: new Set(),
            isSunk: false
        };

        cells.forEach(({r, c}) => {
            this.playerBoard[r][c] = 'ship';
        });

        this.playerShips = [...this.playerShips, ship];
        this.shipPlacementIndex++;
        this.hoverCell = null;
        this.computeShipBorders();

        if (this.shipPlacementIndex >= SHIP_DEFS.length) {
            this.phase = 'playing';
            XH.successToast('All ships placed! Your turn to fire.');
        }

        this.syncGrids();
    }

    //------------------------------------------------------------------
    // Player attack
    //------------------------------------------------------------------
    async handleAttackBoardClick(row: number, col: number) {
        if (this.phase !== 'playing' || !this.isPlayerTurn) return;
        if (this.attackBoard[row][col] !== 'water') return;

        // Process player shot
        const hit = this.aiBoard[row][col] === 'ship';
        this.attackBoard[row][col] = hit ? 'hit' : 'miss';

        if (hit) {
            const sunkShip = this.registerHit(this.aiShips, row, col);
            if (sunkShip) {
                this.markSunk(this.attackBoard, sunkShip);
                XH.successToast(`You sank their ${sunkShip.name}!`);
            }
        }

        this.syncGrids();

        // Check win
        if (this.aiShips.every(s => s.isSunk)) {
            this.phase = 'gameOver';
            this.syncGrids();
            XH.alert({
                title: 'Victory!',
                message: 'You sank all enemy ships!',
                icon: Icon.checkCircle()
            });
            return;
        }

        // AI turn
        this.isPlayerTurn = false;
        this.syncGrids();
        await wait(750);
        this.processAITurn();
    }

    //------------------------------------------------------------------
    // AI
    //------------------------------------------------------------------
    @action
    private processAITurn() {
        const {r, c} = this.getAITarget();

        const hit = this.playerBoard[r][c] === 'ship';
        this.playerBoard[r][c] = hit ? 'hit' : 'miss';

        if (hit) {
            this.aiState.lastHit = {r, c};
            this.aiState.mode = 'hunt';

            // Add adjacent cells as targets
            for (const [dr, dc] of [
                [0, 1],
                [0, -1],
                [1, 0],
                [-1, 0]
            ]) {
                const nr = r + dr,
                    nc = c + dc;
                if (
                    this.inBounds(nr, nc) &&
                    (this.playerBoard[nr][nc] === 'water' || this.playerBoard[nr][nc] === 'ship')
                ) {
                    if (!this.aiState.targets.some(t => t.r === nr && t.c === nc)) {
                        this.aiState.targets.push({r: nr, c: nc});
                    }
                }
            }

            const sunkShip = this.registerHit(this.playerShips, r, c);
            if (sunkShip) {
                this.markSunk(this.playerBoard, sunkShip);
                // Clear hunt targets on sink
                this.aiState.targets = [];
                this.aiState.mode = 'random';
                XH.dangerToast(`They sank your ${sunkShip.name}!`);
            }
        }

        // Check loss
        if (this.playerShips.every(s => s.isSunk)) {
            this.phase = 'gameOver';
            this.syncGrids();
            XH.alert({
                title: 'Defeat',
                message: 'All your ships have been sunk!',
                icon: Icon.skull()
            });
            return;
        }

        this.isPlayerTurn = true;
        this.syncGrids();
    }

    private getAITarget(): {r: number; c: number} {
        // Hunt mode: try adjacent cells to previous hits
        while (this.aiState.targets.length > 0) {
            const target = this.aiState.targets.pop();
            if (
                this.inBounds(target.r, target.c) &&
                (this.playerBoard[target.r][target.c] === 'water' ||
                    this.playerBoard[target.r][target.c] === 'ship')
            ) {
                return target;
            }
        }

        // Random mode
        this.aiState.mode = 'random';
        let r, c;
        do {
            r = Math.floor(Math.random() * GRID_ROWS);
            c = Math.floor(Math.random() * GRID_COLS);
        } while (this.playerBoard[r][c] !== 'water' && this.playerBoard[r][c] !== 'ship');

        return {r, c};
    }

    //------------------------------------------------------------------
    // Ship helpers
    //------------------------------------------------------------------
    private placeAIShips() {
        for (const shipDef of SHIP_DEFS) {
            let placed = false;
            while (!placed) {
                const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical',
                    row = Math.floor(Math.random() * GRID_ROWS),
                    col = Math.floor(Math.random() * GRID_COLS),
                    cells = this.getShipCells(row, col, shipDef.size, orientation);

                if (this.isValidPlacement(cells, this.aiBoard)) {
                    const ship: Ship = {
                        id: shipDef.id,
                        name: shipDef.name,
                        size: shipDef.size,
                        cells,
                        hits: new Set(),
                        isSunk: false
                    };
                    cells.forEach(({r: cr, c: cc}) => {
                        this.aiBoard[cr][cc] = 'ship';
                    });
                    this.aiShips = [...this.aiShips, ship];
                    placed = true;
                }
            }
        }
    }

    private getShipCells(row: number, col: number, size: number, orientation: Orientation) {
        const cells: {r: number; c: number}[] = [];
        for (let i = 0; i < size; i++) {
            const r = orientation === 'vertical' ? row + i : row;
            const c = orientation === 'horizontal' ? col + i : col;
            cells.push({r, c});
        }
        return cells;
    }

    private isValidPlacement(cells: {r: number; c: number}[], board: CellState[][]): boolean {
        return cells.every(({r, c}) => this.inBounds(r, c) && board[r][c] === 'water');
    }

    private computeShipBorders() {
        const ownerMap: (string | null)[][] = Array.from({length: GRID_ROWS}, () =>
            Array(GRID_COLS).fill(null)
        );
        for (const ship of this.playerShips) {
            for (const {r, c} of ship.cells) ownerMap[r][c] = ship.id;
        }

        this.shipBorderMap = Array.from({length: GRID_ROWS}, () => Array(GRID_COLS).fill(''));
        for (const ship of this.playerShips) {
            for (const {r, c} of ship.cells) {
                const id = ship.id,
                    above = r > 0 ? ownerMap[r - 1][c] : null,
                    below = r < GRID_ROWS - 1 ? ownerMap[r + 1][c] : null,
                    left = c > 0 ? ownerMap[r][c - 1] : null,
                    right = c < GRID_COLS - 1 ? ownerMap[r][c + 1] : null,
                    b = [];
                // Top/left: only draw if facing water (not another ship — that
                // neighbor's bottom/right already covers the shared edge).
                if (above === null) b.push('battleship-ship--border-top');
                if (left === null) b.push('battleship-ship--border-left');
                // Bottom/right: draw if facing anything other than same ship.
                if (below !== id) b.push('battleship-ship--border-bottom');
                if (right !== id) b.push('battleship-ship--border-right');
                this.shipBorderMap[r][c] = b.join(' ');
            }
        }
    }

    private registerHit(ships: Ship[], row: number, col: number): Ship | null {
        const key = `${row},${col}`;
        for (const ship of ships) {
            if (ship.cells.some(c => c.r === row && c.c === col)) {
                ship.hits.add(key);
                if (ship.hits.size === ship.size) {
                    ship.isSunk = true;
                    return ship;
                }
                return null;
            }
        }
        return null;
    }

    private markSunk(board: CellState[][], ship: Ship) {
        ship.cells.forEach(({r, c}) => {
            board[r][c] = 'sunk';
        });
    }

    //------------------------------------------------------------------
    // Grid building and sync
    //------------------------------------------------------------------
    @action
    private rebuildGrids() {
        if (this.playerGridModel) this.playerGridModel.destroy();
        if (this.attackGridModel) this.attackGridModel.destroy();

        this.playerGridModel = this.createBoardGrid(
            (row, col) => this.handlePlayerBoardClick(row, col),
            true
        );
        this.attackGridModel = this.createBoardGrid(
            (row, col) => this.handleAttackBoardClick(row, col),
            false
        );

        this.syncGrids();
    }

    private createBoardGrid(
        clickHandler: (row: number, col: number) => void,
        isPlayerBoard: boolean
    ): GridModel {
        const columns = [];

        // Row number column
        columns.push({
            field: 'rowNum',
            headerName: '',
            width: ROW_NUM_WIDTH,
            minWidth: ROW_NUM_WIDTH,
            maxWidth: ROW_NUM_WIDTH,
            rowHeight: CELL_SIZE,
            sortable: false,
            resizable: false,
            movable: false,
            filterable: false,
            align: 'center' as const,
            hideable: false,
            renderer: v => span({item: v, style: {fontWeight: 'bold', fontSize: 12}})
        });

        // Game columns A-L
        for (let c = 0; c < GRID_COLS; c++) {
            const colIdx = c;
            columns.push({
                field: `c${c}`,
                headerName: COL_LETTERS[c],
                headerAlign: 'center' as const,
                width: CELL_SIZE,
                minWidth: CELL_SIZE,
                maxWidth: CELL_SIZE,
                rowHeight: CELL_SIZE,
                sortable: false,
                resizable: false,
                movable: false,
                filterable: false,
                align: 'center' as const,
                hideable: false,
                rendererIsComplex: true,
                renderer: v => this.cellRenderer(v),
                cellClass: (v, {record}) => {
                    const base = this.cellCssClass(v);
                    if (!isPlayerBoard) return base;
                    const row = record?.data?.row;
                    const borders = row != null ? this.shipBorderMap[row]?.[colIdx] : '';
                    return borders ? `${base} ${borders}` : base;
                },
                onCellClicked: ({data}) => {
                    if (data) clickHandler(data.data.row, colIdx);
                }
            });
        }

        const fields = [
            {name: 'row', type: 'int' as const},
            {name: 'rowNum', type: 'string' as const}
        ];
        for (let c = 0; c < GRID_COLS; c++) {
            fields.push({name: `c${c}`, type: 'string' as const});
        }

        return new GridModel({
            store: {fields},
            columns,
            selModel: 'disabled',
            showHover: false,
            rowBorders: false,
            cellBorders: true,
            stripeRows: false,
            enableExport: false,
            showCellFocus: false,
            contextMenu: false
        });
    }

    private syncGrids() {
        this.syncBoard(this.playerGridModel, this.playerBoard, true);
        this.syncBoard(this.attackGridModel, this.attackBoard, false);
    }

    private syncBoard(gridModel: GridModel, board: CellState[][], showShips: boolean) {
        if (!gridModel) return;

        // Compute preview cells during placement phase on the player board.
        let previewSet: Set<string> | null = null;
        let previewValid = false;
        if (showShips && this.phase === 'placement' && this.hoverCell) {
            const shipDef = this.currentShipToPlace;
            if (shipDef) {
                const cells = this.getShipCells(
                    this.hoverCell.r,
                    this.hoverCell.c,
                    shipDef.size,
                    this.orientation
                );
                previewValid = this.isValidPlacement(cells, this.playerBoard);
                previewSet = new Set(cells.map(({r, c}) => `${r},${c}`));
            }
        }

        const rowData = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            const row: any = {id: r, row: r, rowNum: String(r + 1)};
            for (let c = 0; c < GRID_COLS; c++) {
                const state = board[r][c];
                const base = showShips ? state : state === 'ship' ? 'water' : state;

                if (previewSet?.has(`${r},${c}`) && base === 'water') {
                    row[`c${c}`] = previewValid ? 'preview' : 'preview-invalid';
                } else {
                    row[`c${c}`] = base;
                }
            }
            rowData.push(row);
        }
        gridModel.loadData(rowData);
    }

    //------------------------------------------------------------------
    // Renderers
    //------------------------------------------------------------------
    private cellRenderer(state: string) {
        switch (state) {
            case 'hit':
                return Icon.cross({className: 'battleship-hit'});
            case 'miss':
                return Icon.circle({prefix: 'fal', className: 'battleship-miss'});
            case 'sunk':
                return Icon.skull({className: 'battleship-sunk'});
            case 'ship':
            case 'preview':
                return span({className: 'battleship-ship-icon', item: '\u25A0'});
            default:
                return null;
        }
    }

    private cellCssClass(state: string): string {
        switch (state) {
            case 'water':
                return 'battleship-cell--water';
            case 'ship':
                return 'battleship-cell--ship';
            case 'hit':
                return 'battleship-cell--hit';
            case 'miss':
                return 'battleship-cell--miss';
            case 'sunk':
                return 'battleship-cell--sunk';
            case 'preview':
                return 'battleship-cell--preview';
            case 'preview-invalid':
                return 'battleship-cell--preview-invalid';
            default:
                return 'battleship-cell--water';
        }
    }

    //------------------------------------------------------------------
    // Helpers
    //------------------------------------------------------------------
    private createEmptyBoard(): CellState[][] {
        const board: CellState[][] = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            board[r] = [];
            for (let c = 0; c < GRID_COLS; c++) {
                board[r][c] = 'water';
            }
        }
        return board;
    }

    private inBounds(r: number, c: number): boolean {
        return r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS;
    }
}
