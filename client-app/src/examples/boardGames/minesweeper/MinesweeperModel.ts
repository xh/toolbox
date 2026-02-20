import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {Timer} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {span} from '@xh/hoist/cmp/layout';
import {times} from 'lodash';

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
    private rowCount: number = 0;
    private colCount: number = 0;
    private mineCount: number = 0;
    private firstClick: boolean = true;

    @managed private gameTimer: Timer = null;

    @computed get difficultyConfig(): Difficulty {
        return DIFFICULTIES[this.difficulty];
    }

    @computed get flagCount(): number {
        return this.cells.flat().filter(c => c.isFlagged).length;
    }

    @computed get minesRemaining(): number {
        return this.mineCount - this.flagCount;
    }

    @computed get formattedTime(): string {
        const seconds = this.elapsedSeconds;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
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

    //------------------------------------------------------------------
    // Actions
    //------------------------------------------------------------------
    @action
    newGame() {
        this.stopTimer();
        const {rows: rowCount, cols: colCount, mines} = this.difficultyConfig;
        this.rowCount = rowCount;
        this.colCount = colCount;
        this.mineCount = mines;
        this.firstClick = true;
        this.gameState = 'idle';
        this.elapsedSeconds = 0;

        // Initialize empty board
        this.cells = times(rowCount, () =>
            times(colCount, () => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0
            }))
        );

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

    @action
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
        const {rowCount, colCount, mineCount} = this;
        let placed = 0;

        while (placed < mineCount) {
            const row = Math.floor(Math.random() * rowCount);
            const col = Math.floor(Math.random() * colCount);

            // Skip safe zone (clicked cell + neighbors)
            if (Math.abs(row - safeRow) <= 1 && Math.abs(col - safeCol) <= 1) continue;
            if (this.cells[row][col].isMine) continue;

            this.cells[row][col].isMine = true;
            placed++;
        }
    }

    private computeAdjacentCounts() {
        const {rowCount, colCount} = this;
        for (let row = 0; row < rowCount; row++) {
            for (let col = 0; col < colCount; col++) {
                if (this.cells[row][col].isMine) continue;
                let count = 0;
                for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
                    for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                        if (deltaRow === 0 && deltaCol === 0) continue;
                        const neighborRow = row + deltaRow,
                            neighborCol = col + deltaCol;
                        if (
                            this.inBounds(neighborRow, neighborCol) &&
                            this.cells[neighborRow][neighborCol].isMine
                        )
                            count++;
                    }
                }
                this.cells[row][col].adjacentMines = count;
            }
        }
    }

    private floodReveal(row: number, col: number) {
        for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
            for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                if (deltaRow === 0 && deltaCol === 0) continue;
                const neighborRow = row + deltaRow,
                    neighborCol = col + deltaCol;
                if (!this.inBounds(neighborRow, neighborCol)) continue;
                const neighbor = this.cells[neighborRow][neighborCol];
                if (neighbor.isRevealed || neighbor.isFlagged || neighbor.isMine) continue;
                neighbor.isRevealed = true;
                if (neighbor.adjacentMines === 0) {
                    this.floodReveal(neighborRow, neighborCol);
                }
            }
        }
    }

    private revealAllMines() {
        this.cells
            .flat()
            .filter(c => c.isMine)
            .forEach(c => (c.isRevealed = true));
    }

    private checkWin() {
        if (!this.cells.every(row => row.every(c => c.isMine || c.isRevealed))) return;
        this.gameState = 'won';
        this.stopTimer();
        XH.successToast(`You win! Cleared in ${this.formattedTime}.`);
        XH.boardGameService.submitScore('minesweeper', this.elapsedSeconds, this.difficulty);
    }

    private inBounds(r: number, c: number): boolean {
        return r >= 0 && r < this.rowCount && c >= 0 && c < this.colCount;
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
        return this.colCount * this.cellSize;
    }

    get boardHeight(): number {
        return this.rowCount * this.cellSize;
    }

    @action
    private rebuildGrid() {
        if (this.gridModel) this.gridModel.destroy();

        const {rowCount, colCount} = this;

        // Compute largest square cell size that keeps the board close to a consistent
        // footprint.  Using Math.ceil ensures colCount * cellSize >= TARGET so the
        // columns always fill the grid — Math.floor can leave a gap when the division
        // doesn't come out even (visible on the Hard 19×19 board).
        const TARGET = 550;
        const cellSize = (this.cellSize = Math.max(
            16,
            Math.min(Math.ceil(TARGET / colCount), Math.ceil(TARGET / rowCount))
        ));

        const columns = [];
        for (let col = 0; col < colCount; col++) {
            columns.push({
                field: `c${col}`,
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
                renderer: (v, {record}) => this.cellRenderer(record.data.row, col),
                cellClass: (v, {record}) => {
                    const row = record?.data?.row;
                    if (row == null) return '';
                    const cell = this.cells[row]?.[col];
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
                        this.toggleFlag(row, col);
                    } else {
                        this.revealCell(row, col);
                    }
                }
            });
        }

        const fields: {name: string; type: 'int' | 'string'}[] = [{name: 'row', type: 'int'}];
        for (let col = 0; col < colCount; col++) {
            fields.push({name: `c${col}`, type: 'string'});
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
        for (let row = 0; row < this.rowCount; row++) {
            const record: any = {id: row, row};
            for (let col = 0; col < this.colCount; col++) {
                const cell = this.cells[row][col];
                record[`c${col}`] = cell.isRevealed
                    ? cell.isMine
                        ? 'mine'
                        : String(cell.adjacentMines)
                    : cell.isFlagged
                      ? 'flag'
                      : 'hidden';
            }
            rowData.push(record);
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
