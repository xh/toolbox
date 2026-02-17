import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {Timer} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {span} from '@xh/hoist/cmp/layout';

//------------------------------------------------------------------
// Types
//------------------------------------------------------------------
interface Cell {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
}

type GameState = 'idle' | 'playing' | 'won' | 'lost';

interface Difficulty {
    label: string;
    rows: number;
    cols: number;
    mines: number;
}

//------------------------------------------------------------------
// Difficulty presets
//------------------------------------------------------------------
export const DIFFICULTIES: Record<string, Difficulty> = {
    easy: {label: 'Easy', rows: 9, cols: 9, mines: 10},
    medium: {label: 'Medium', rows: 16, cols: 16, mines: 40},
    hard: {label: 'Hard', rows: 19, cols: 19, mines: 74}
};

export const DIFFICULTY_OPTIONS = Object.entries(DIFFICULTIES).map(([value, d]) => ({
    value,
    label: `${d.label} (${d.cols}×${d.rows}, ${d.mines} mines)`
}));

//------------------------------------------------------------------
// Number colors matching classic Minesweeper
//------------------------------------------------------------------
const NUMBER_CLASSES: Record<number, string> = {
    1: 'minesweeper-number-1',
    2: 'minesweeper-number-2',
    3: 'minesweeper-number-3',
    4: 'minesweeper-number-4',
    5: 'minesweeper-number-5',
    6: 'minesweeper-number-6',
    7: 'minesweeper-number-7',
    8: 'minesweeper-number-8'
};

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
export class MinesweeperModel extends HoistModel {
    @bindable difficulty: string = 'easy';
    @observable.ref gameState: GameState = 'idle';
    @observable elapsedSeconds: number = 0;

    @managed @observable.ref gridModel: GridModel = null;

    // Internal board state
    private cells: Cell[][] = [];
    private rows: number = 0;
    private cols: number = 0;
    private mineCount: number = 0;
    private firstClick: boolean = true;

    @managed private gameTimer: Timer = null;

    constructor() {
        super();
        makeObservable(this);
        this.newGame();

        // React to difficulty changes — ensures newGame() sees the updated value.
        this.addReaction({
            track: () => this.difficulty,
            run: () => this.newGame()
        });
    }

    @computed get difficultyConfig(): Difficulty {
        return DIFFICULTIES[this.difficulty];
    }

    @computed get flagCount(): number {
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c].isFlagged) count++;
            }
        }
        return count;
    }

    @computed get minesRemaining(): number {
        return this.mineCount - this.flagCount;
    }

    @computed get formattedTime(): string {
        const s = this.elapsedSeconds;
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    @computed get statusText(): string {
        switch (this.gameState) {
            case 'idle':
                return 'Click any cell to start.';
            case 'playing':
                return 'Good luck!';
            case 'won':
                return `You win! Cleared in ${this.formattedTime}.`;
            case 'lost':
                return 'BOOM! Game over.';
            default:
                return '';
        }
    }

    //------------------------------------------------------------------
    // Actions
    //------------------------------------------------------------------
    @action
    newGame() {
        this.stopTimer();
        const {rows, cols, mines} = this.difficultyConfig;
        this.rows = rows;
        this.cols = cols;
        this.mineCount = mines;
        this.firstClick = true;
        this.gameState = 'idle';
        this.elapsedSeconds = 0;

        // Initialize empty board
        this.cells = [];
        for (let r = 0; r < rows; r++) {
            this.cells[r] = [];
            for (let c = 0; c < cols; c++) {
                this.cells[r][c] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0
                };
            }
        }

        this.rebuildGrid();
    }

    //------------------------------------------------------------------
    // Cell interactions
    //------------------------------------------------------------------
    @action
    revealCell(row: number, col: number) {
        if (this.gameState === 'won' || this.gameState === 'lost') return;

        const cell = this.cells[row]?.[col];
        if (!cell || cell.isRevealed || cell.isFlagged) return;

        // First click: place mines avoiding this cell and its neighbors
        if (this.firstClick) {
            this.placeMines(row, col);
            this.computeAdjacentCounts();
            this.firstClick = false;
            this.gameState = 'playing';
            this.startTimer();
        }

        cell.isRevealed = true;

        if (cell.isMine) {
            this.gameState = 'lost';
            this.revealAllMines();
            this.stopTimer();
            this.syncGrid();
            XH.dangerToast('BOOM! Game Over.');
            return;
        }

        // Flood-fill for zero-adjacent cells
        if (cell.adjacentMines === 0) {
            this.floodReveal(row, col);
        }

        this.checkWin();
        this.syncGrid();
    }

    toggleFlag(row: number, col: number) {
        if (this.gameState === 'won' || this.gameState === 'lost') return;
        if (this.gameState === 'idle') return;

        const cell = this.cells[row]?.[col];
        if (!cell || cell.isRevealed) return;

        cell.isFlagged = !cell.isFlagged;
        this.syncGrid();
    }

    //------------------------------------------------------------------
    // Implementation
    //------------------------------------------------------------------
    private placeMines(safeRow: number, safeCol: number) {
        const {rows, cols, mineCount} = this;
        let placed = 0;

        while (placed < mineCount) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);

            // Skip safe zone (clicked cell + neighbors)
            if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
            if (this.cells[r][c].isMine) continue;

            this.cells[r][c].isMine = true;
            placed++;
        }
    }

    private computeAdjacentCounts() {
        const {rows, cols} = this;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.cells[r][c].isMine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr,
                            nc = c + dc;
                        if (this.inBounds(nr, nc) && this.cells[nr][nc].isMine) count++;
                    }
                }
                this.cells[r][c].adjacentMines = count;
            }
        }
    }

    private floodReveal(row: number, col: number) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr,
                    nc = col + dc;
                if (!this.inBounds(nr, nc)) continue;
                const neighbor = this.cells[nr][nc];
                if (neighbor.isRevealed || neighbor.isFlagged || neighbor.isMine) continue;
                neighbor.isRevealed = true;
                if (neighbor.adjacentMines === 0) {
                    this.floodReveal(nr, nc);
                }
            }
        }
    }

    private revealAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c].isMine) {
                    this.cells[r][c].isRevealed = true;
                }
            }
        }
    }

    private checkWin() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.cells[r][c];
                if (!cell.isMine && !cell.isRevealed) return;
            }
        }
        this.gameState = 'won';
        this.stopTimer();
        XH.successToast(`You win! Cleared in ${this.formattedTime}.`);
        XH.boardGameService.submitScore('minesweeper', this.elapsedSeconds, this.difficulty);
    }

    private inBounds(r: number, c: number): boolean {
        return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
    }

    //------------------------------------------------------------------
    // Timer
    //------------------------------------------------------------------
    private startTimer() {
        this.gameTimer = Timer.create({
            runFn: action(() => {
                this.elapsedSeconds++;
            }),
            interval: 1,
            intervalUnits: SECONDS,
            delay: true
        });
    }

    private stopTimer() {
        if (this.gameTimer) {
            this.gameTimer.cancel();
            this.gameTimer = null;
        }
    }

    //------------------------------------------------------------------
    // Grid sync
    //------------------------------------------------------------------
    @observable cellSize: number = 30;

    get boardWidth(): number {
        return this.cols * this.cellSize;
    }

    get boardHeight(): number {
        return this.rows * this.cellSize;
    }

    @action
    private rebuildGrid() {
        if (this.gridModel) this.gridModel.destroy();

        const {rows, cols} = this;

        // Compute largest square cell size that fits within a consistent board area.
        // All difficulties target the same footprint — fewer cells = bigger squares.
        const TARGET = 550;
        const cellSize = (this.cellSize = Math.max(
            16,
            Math.min(Math.floor(TARGET / cols), Math.floor(TARGET / rows))
        ));

        const columns = [];
        for (let c = 0; c < cols; c++) {
            const colIdx = c;
            columns.push({
                field: `c${c}`,
                width: cellSize,
                minWidth: cellSize,
                maxWidth: cellSize,
                rowHeight: cellSize,
                sortable: false,
                resizable: false,
                movable: false,
                filterable: false,
                align: 'center' as const,
                hideable: false,
                excludeFromChooser: true,
                rendererIsComplex: true,
                renderer: (v, {record}) => this.cellRenderer(record.data.row, colIdx),
                cellClass: (v, {record}) => {
                    const row = record?.data?.row;
                    if (row == null) return '';
                    const cell = this.cells[row]?.[colIdx];
                    if (!cell) return '';
                    if (!cell.isRevealed)
                        return cell.isFlagged
                            ? 'minesweeper-cell--flagged'
                            : 'minesweeper-cell--hidden';
                    if (cell.isMine) return 'minesweeper-cell--mine';
                    if (cell.adjacentMines > 0)
                        return `minesweeper-cell--revealed ${NUMBER_CLASSES[cell.adjacentMines] ?? ''}`;
                    return 'minesweeper-cell--revealed';
                },
                onCellClicked: ({event, data}) => {
                    if (!data) return;
                    const row = data.data.row;
                    if (event.shiftKey || event.ctrlKey || event.metaKey) {
                        this.toggleFlag(row, colIdx);
                    } else {
                        this.revealCell(row, colIdx);
                    }
                }
            });
        }

        const fields: {name: string; type: 'int' | 'string'}[] = [{name: 'row', type: 'int'}];
        for (let c = 0; c < cols; c++) {
            fields.push({name: `c${c}`, type: 'string'});
        }

        this.gridModel = new GridModel({
            store: {fields},
            columns,
            hideHeaders: true,
            selModel: 'disabled',
            showHover: false,
            rowBorders: false,
            cellBorders: true,
            stripeRows: false,
            enableExport: false,
            showCellFocus: false,
            contextMenu: false
        });

        this.syncGrid();
    }

    private syncGrid() {
        if (!this.gridModel) return;
        const rowData = [];
        for (let r = 0; r < this.rows; r++) {
            const row: any = {id: r, row: r};
            for (let c = 0; c < this.cols; c++) {
                // Store a version string to trigger re-render
                const cell = this.cells[r][c];
                row[`c${c}`] = cell.isRevealed
                    ? cell.isMine
                        ? 'mine'
                        : String(cell.adjacentMines)
                    : cell.isFlagged
                      ? 'flag'
                      : 'hidden';
            }
            rowData.push(row);
        }
        this.gridModel.loadData(rowData);
    }

    private cellRenderer(row: number, col: number) {
        const cell = this.cells[row]?.[col];
        if (!cell) return null;

        if (!cell.isRevealed) {
            if (cell.isFlagged) {
                return Icon.flag({className: 'minesweeper-flag'});
            }
            return null;
        }

        if (cell.isMine) {
            return Icon.skull({className: 'minesweeper-mine'});
        }

        if (cell.adjacentMines > 0) {
            return span({
                className: NUMBER_CLASSES[cell.adjacentMines],
                item: String(cell.adjacentMines),
                style: {fontWeight: 'bold'}
            });
        }

        return null;
    }

    override destroy() {
        this.stopTimer();
        super.destroy();
    }
}
