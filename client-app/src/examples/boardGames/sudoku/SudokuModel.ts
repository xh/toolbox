import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {action, bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {Timer} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {span} from '@xh/hoist/cmp/layout';
import {times} from 'lodash';

//------------------------------------------------------------------
// Types
//------------------------------------------------------------------
interface Cell {
    value: number; // 0 = empty
    isPreFilled: boolean;
    isConflict: boolean;
}

type GameMode = 'play' | 'create';
type GameState = 'playing' | 'won';
type CreatePhase = 'entering' | 'solving';

interface GridSize {
    n: number;
    boxRows: number;
    boxCols: number;
}

//------------------------------------------------------------------
// Constants
//------------------------------------------------------------------
const GRID_SIZES: Record<string, GridSize> = {
    '4x4': {n: 4, boxRows: 2, boxCols: 2},
    '6x6': {n: 6, boxRows: 2, boxCols: 3},
    '9x9': {n: 9, boxRows: 3, boxCols: 3}
};

export const GRID_SIZE_OPTIONS = Object.entries(GRID_SIZES).map(([value, s]) => ({
    value,
    label: `${s.n}×${s.n}`
}));

// Givens per difficulty per grid size key
const GIVENS: Record<string, Record<string, number>> = {
    easy: {'9x9': 40, '6x6': 24, '4x4': 10},
    medium: {'9x9': 30, '6x6': 18, '4x4': 7},
    hard: {'9x9': 24, '6x6': 14, '4x4': 5}
};

export const DIFFICULTY_OPTIONS = [
    {value: 'easy', label: 'Easy'},
    {value: 'medium', label: 'Medium'},
    {value: 'hard', label: 'Hard'}
];

export const MODE_OPTIONS = [
    {value: 'play', label: 'Play'},
    {value: 'create', label: 'Create'}
];

const TARGET_BOARD_PX = 500;

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
export class SudokuModel extends HoistModel {
    @bindable gridSizeKey: string = '9x9';
    @bindable difficulty: string = 'easy';
    @bindable gameMode: GameMode = 'play';
    @observable.ref gameState: GameState = 'playing';
    @observable.ref createPhase: CreatePhase = 'entering';
    @observable elapsedSeconds: number = 0;
    @observable.ref selectedCell: {row: number; col: number} | null = null;

    @managed @observable.ref gridModel: GridModel = null;

    private cells: Cell[][] = [];
    @managed private gameTimer: Timer = null;

    @computed get gridSize(): GridSize {
        return GRID_SIZES[this.gridSizeKey];
    }

    @computed get n(): number {
        return this.gridSize.n;
    }

    @computed get formattedTime(): string {
        const mins = Math.floor(this.elapsedSeconds / 60),
            secs = this.elapsedSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    @computed get statusText(): string {
        if (this.gameState === 'won') return `Solved in ${this.formattedTime}!`;
        if (this.gameMode === 'create') {
            return this.createPhase === 'entering'
                ? 'Enter your puzzle, then click Lock & Solve.'
                : 'Solve the puzzle!';
        }
        return 'Fill every row, column, and box with 1\u2013' + this.n + '.';
    }

    @computed get inputHint(): string {
        if (this.gameState === 'won') return '';
        return 'Click a cell, then type a number or use the palette.';
    }

    @computed get isEditable(): boolean {
        return this.gameState !== 'won';
    }

    constructor() {
        super();
        makeObservable(this);
        this.newGame();

        this.addReaction({
            track: () => [this.gridSizeKey, this.difficulty, this.gameMode],
            run: () => this.newGame()
        });
    }

    //------------------------------------------------------------------
    // Public actions
    //------------------------------------------------------------------
    @action
    newGame() {
        this.stopTimer();
        this.gameState = 'playing';
        this.elapsedSeconds = 0;
        this.selectedCell = null;

        const {n} = this.gridSize;

        if (this.gameMode === 'play') {
            this.createPhase = null;
            this.cells = this.generatePuzzle();
        } else {
            this.createPhase = 'entering';
            this.cells = times(n, () =>
                times(n, () => ({value: 0, isPreFilled: false, isConflict: false}))
            );
        }

        this.rebuildGrid();
    }

    @action
    handleCellClicked(row: number, col: number) {
        if (!this.isEditable) return;
        this.selectedCell = {row, col};
        this.syncGrid();
    }

    @action
    handleNumberInput(num: number) {
        if (!this.isEditable || !this.selectedCell) return;
        const {row, col} = this.selectedCell;
        const cell = this.cells[row][col];

        if (cell.isPreFilled) return;

        cell.value = num;
        this.startTimerIfNeeded();
        this.computeConflicts();
        this.checkWin();
        this.syncGrid();
    }

    @action
    clearCell() {
        if (!this.isEditable || !this.selectedCell) return;
        const {row, col} = this.selectedCell;
        const cell = this.cells[row][col];
        if (cell.isPreFilled) return;

        cell.value = 0;
        this.computeConflicts();
        this.syncGrid();
    }

    @action
    lockPuzzle() {
        if (this.gameMode !== 'create' || this.createPhase !== 'entering') return;

        const {n, boxRows, boxCols} = this.gridSize;
        const board = this.cellsToBoard();

        // Check for existing conflicts
        this.computeConflicts();
        if (this.cells.flat().some(c => c.isConflict)) {
            XH.dangerToast('Fix conflicts before locking the puzzle.');
            return;
        }

        const result = this.solve([...board], n, boxRows, boxCols, 2);

        if (result.count === 0) {
            XH.dangerToast('This puzzle has no solution.');
            return;
        }

        if (result.count > 1) {
            XH.warningToast(
                'Multiple solutions exist \u2014 the puzzle will accept any valid completion.'
            );
        }

        // Lock filled cells as pre-filled
        this.cells
            .flat()
            .filter(c => c.value > 0)
            .forEach(c => (c.isPreFilled = true));
        this.createPhase = 'solving';
        this.elapsedSeconds = 0;
        this.syncGrid();
    }

    //------------------------------------------------------------------
    // Solver — backtracking on flat board array
    //------------------------------------------------------------------
    private solve(
        board: number[],
        n: number,
        boxRows: number,
        boxCols: number,
        maxSolutions: number,
        randomize: boolean = false
    ): {count: number; solution: number[] | null} {
        let count = 0;
        let solution: number[] | null = null;

        const _solve = (): boolean => {
            const emptyIdx = board.indexOf(0);
            if (emptyIdx === -1) {
                count++;
                if (!solution) solution = [...board];
                return count >= maxSolutions;
            }

            const candidates = times(n, i => i + 1);
            if (randomize) this.shuffleArray(candidates);

            for (const val of candidates) {
                if (this.isValidPlacement(board, emptyIdx, val, n, boxRows, boxCols)) {
                    board[emptyIdx] = val;
                    if (_solve()) return true;
                    board[emptyIdx] = 0;
                }
            }
            return false;
        };

        _solve();
        return {count, solution};
    }

    private isValidPlacement(
        board: number[],
        index: number,
        value: number,
        n: number,
        boxRows: number,
        boxCols: number
    ): boolean {
        const row = Math.floor(index / n),
            col = index % n;

        // Check row
        for (let c = 0; c < n; c++) {
            if (board[row * n + c] === value) return false;
        }

        // Check column
        for (let r = 0; r < n; r++) {
            if (board[r * n + col] === value) return false;
        }

        // Check box
        const boxStartRow = Math.floor(row / boxRows) * boxRows,
            boxStartCol = Math.floor(col / boxCols) * boxCols;
        for (let r = boxStartRow; r < boxStartRow + boxRows; r++) {
            for (let c = boxStartCol; c < boxStartCol + boxCols; c++) {
                if (board[r * n + c] === value) return false;
            }
        }

        return true;
    }

    //------------------------------------------------------------------
    // Puzzle generation
    //------------------------------------------------------------------
    private generatePuzzle(): Cell[][] {
        const {n, boxRows, boxCols} = this.gridSize;
        const emptyBoard = times(n * n, () => 0);

        // Generate a complete valid board
        const {solution} = this.solve(emptyBoard, n, boxRows, boxCols, 1, true);
        const board = solution!;

        // Remove cells while maintaining unique solution
        const givensTarget = GIVENS[this.difficulty][this.gridSizeKey];
        let filledCount = n * n;

        // Shuffle indices for random removal
        const indices = times(n * n, i => i);
        this.shuffleArray(indices);

        for (const idx of indices) {
            if (filledCount <= givensTarget) break;

            const backup = board[idx];
            board[idx] = 0;

            const result = this.solve([...board], n, boxRows, boxCols, 2);
            if (result.count === 1) {
                filledCount--;
            } else {
                board[idx] = backup;
            }
        }

        // Convert flat board to Cell[][]
        return times(n, row =>
            times(n, col => {
                const val = board[row * n + col];
                return {value: val, isPreFilled: val > 0, isConflict: false};
            })
        );
    }

    //------------------------------------------------------------------
    // Conflict detection
    //------------------------------------------------------------------
    private computeConflicts() {
        const {n, boxRows, boxCols} = this.gridSize;

        // Reset all conflicts
        this.cells.flat().forEach(c => (c.isConflict = false));

        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {
                const cell = this.cells[row][col];
                if (cell.value === 0) continue;

                // Check row
                for (let c = 0; c < n; c++) {
                    if (c !== col && this.cells[row][c].value === cell.value) {
                        cell.isConflict = true;
                        this.cells[row][c].isConflict = true;
                    }
                }

                // Check column
                for (let r = 0; r < n; r++) {
                    if (r !== row && this.cells[r][col].value === cell.value) {
                        cell.isConflict = true;
                        this.cells[r][col].isConflict = true;
                    }
                }

                // Check box
                const boxStartRow = Math.floor(row / boxRows) * boxRows,
                    boxStartCol = Math.floor(col / boxCols) * boxCols;
                for (let r = boxStartRow; r < boxStartRow + boxRows; r++) {
                    for (let c = boxStartCol; c < boxStartCol + boxCols; c++) {
                        if (r !== row || c !== col) {
                            if (this.cells[r][c].value === cell.value) {
                                cell.isConflict = true;
                                this.cells[r][c].isConflict = true;
                            }
                        }
                    }
                }
            }
        }
    }

    private checkWin() {
        const allFilled = this.cells.flat().every(c => c.value > 0);
        const noConflicts = this.cells.flat().every(c => !c.isConflict);
        if (!allFilled || !noConflicts) return;

        this.gameState = 'won';
        this.stopTimer();
        XH.successToast(`Solved in ${this.formattedTime}!`);
        if (this.gameMode === 'play') {
            XH.boardGameService.submitScore('sudoku', this.elapsedSeconds, this.difficulty);
        }
    }

    //------------------------------------------------------------------
    // Timer
    //------------------------------------------------------------------
    private timerStarted = false;

    private startTimerIfNeeded() {
        if (this.timerStarted || this.gameState === 'won') return;
        this.timerStarted = true;
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
        this.timerStarted = false;
        if (this.gameTimer) {
            this.gameTimer.cancel();
            this.gameTimer = null;
        }
    }

    //------------------------------------------------------------------
    // Grid sync
    //------------------------------------------------------------------
    @observable cellSize: number = 30;

    @computed get boardWidth(): number {
        return this.n * this.cellSize + 5;
    }

    @computed get boardHeight(): number {
        return this.n * this.cellSize + 1;
    }

    @action
    private rebuildGrid() {
        if (this.gridModel) this.gridModel.destroy();

        const {n, boxRows, boxCols} = this.gridSize;
        const cellSize = (this.cellSize = Math.max(16, Math.ceil(TARGET_BOARD_PX / n)));

        const columns = times(n, col => ({
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
                return this.getCellClasses(row, col, boxRows, boxCols);
            },
            onCellClicked: ({data}) => {
                if (!data) return;
                this.handleCellClicked(data.data.row, col);
            }
        }));

        const fields: {name: string; type: 'int' | 'string'}[] = [{name: 'row', type: 'int'}];
        times(n, col => fields.push({name: `c${col}`, type: 'string'}));

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
            contextMenu: false,
            onKeyDown: e => this.handleKeyDown(e)
        });

        this.syncGrid();
    }

    private handleKeyDown(e: KeyboardEvent) {
        if (!this.isEditable) return;

        const num = parseInt(e.key);
        if (num >= 1 && num <= this.n) {
            e.preventDefault();
            this.handleNumberInput(num);
            return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.clearCell();
            return;
        }

        // Arrow key navigation
        if (this.selectedCell && e.key.startsWith('Arrow')) {
            e.preventDefault();
            const {row, col} = this.selectedCell;
            let newRow = row,
                newCol = col;
            if (e.key === 'ArrowUp') newRow = Math.max(0, row - 1);
            else if (e.key === 'ArrowDown') newRow = Math.min(this.n - 1, row + 1);
            else if (e.key === 'ArrowLeft') newCol = Math.max(0, col - 1);
            else if (e.key === 'ArrowRight') newCol = Math.min(this.n - 1, col + 1);
            this.handleCellClicked(newRow, newCol);
        }
    }

    private getCellClasses(row: number, col: number, boxRows: number, boxCols: number): string {
        const cell = this.cells[row]?.[col];
        if (!cell) return '';

        const classes = ['sudoku-cell'];

        // State classes
        if (cell.isPreFilled) classes.push('sudoku-cell--prefilled');
        else if (cell.value > 0) classes.push('sudoku-cell--filled');
        else classes.push('sudoku-cell--empty');

        if (cell.isConflict) classes.push('sudoku-cell--conflict');

        const sel = this.selectedCell;
        if (sel && sel.row === row && sel.col === col) classes.push('sudoku-cell--selected');

        // Board edge borders — outer perimeter gets same thick treatment
        const {n} = this;
        if (row === 0) classes.push('sudoku-cell--board-top');
        if (row === n - 1) classes.push('sudoku-cell--board-bottom');
        if (col === 0) classes.push('sudoku-cell--board-left');
        if (col === n - 1) classes.push('sudoku-cell--board-right');

        // Box boundary borders — thick lines on interior box edges
        if (row > 0 && row % boxRows === 0) classes.push('sudoku-cell--box-top');
        if (col > 0 && col % boxCols === 0) classes.push('sudoku-cell--box-left');

        return classes.join(' ');
    }

    private syncGrid() {
        if (!this.gridModel) return;
        const {n} = this;
        const rowData = times(n, row => {
            const record: any = {id: row, row};
            times(n, col => {
                const cell = this.cells[row][col];
                record[`c${col}`] = cell.value > 0 ? String(cell.value) : '';
            });
            return record;
        });
        this.gridModel.loadData(rowData);
    }

    private cellRenderer(row: number, col: number) {
        const cell = this.cells[row]?.[col];
        if (!cell || cell.value === 0) return null;
        return span({item: String(cell.value)});
    }

    //------------------------------------------------------------------
    // Helpers
    //------------------------------------------------------------------
    private cellsToBoard(): number[] {
        return this.cells.flat().map(c => c.value);
    }

    private shuffleArray(arr: any[]) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    override destroy() {
        this.stopTimer();
        super.destroy();
    }
}
