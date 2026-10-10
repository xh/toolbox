import {FormModel} from '@xh/hoist/cmp/form';
import {GridModel} from '@xh/hoist/cmp/grid';
import type {ColumnSpec} from '@xh/hoist/cmp/grid';
import type {PlainObject} from '@xh/hoist/core';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {numberIs, required} from '@xh/hoist/data';
import {
    dateFormatter,
    dateRenderer,
    millionsFormatter,
    millionsRenderer,
    numberFormatter,
    numberRenderer
} from '@xh/hoist/format';
import {action, bindable, computed, observable, observableRef, runInAction} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import type {ColDef} from 'ag-grid-community';
import {max, random, range, sample} from 'lodash';
import {createElement, createRef} from 'react';
import {PNL_FORMAT, VOLUME_FORMAT} from '../../../core/columns/Trades';

export type ScrollTarget = 'hoist' | 'ag';

/**
 * Sizing shared by both grids, so each renders the same rows and cells per viewport. The heights
 * are Hoist's for its 'standard' sizing mode, which the Hoist grid is fixed to.
 */
export const GRID_SIZING = {rowHeight: 28, headerHeight: 24, colWidth: 130};

/**
 * How the grids turn cell values into content:
 * - 'plain' - no formatting, ag-Grid writes the raw value.
 * - 'formatter' - a formatter returns the cell's text, and ag-Grid writes it.
 * - 'renderer' - a renderer with the same options, rendered as a React component per cell.
 */
export type CellFormatting = 'plain' | 'formatter' | 'renderer';

/** Timings from one measured scroll - see {@link GridScrollingModel.scrollGridAsync}. */
export interface ScrollResult {
    /** Wall-clock ms for all steps. */
    totalMs: number;
    /** Ms taken by the slowest step - the worst hitch a user would feel. */
    maxStepMs: number;
    steps: number;
}

/**
 * Side-by-side scrolling test of a Hoist `Grid` against a bare `AgGridReact` on the same data,
 * to isolate the cost of Hoist's integration layer. Column virtualisation and cell formatting are
 * the two settings with the largest effect on scroll cost, so both can be changed. The scroll
 * buttons run a measured, stepped scroll and report its timings.
 */
export class GridScrollingModel extends HoistModel {
    readonly hoistGridRef = createRef<HTMLDivElement>();
    readonly agGridRef = createRef<HTMLDivElement>();

    @observable accessor colCount = 20;
    @observable accessor rowCount = 100_000;
    @observable accessor isColVirtualizationEnabled = true;
    @observable accessor cellFormatting: CellFormatting = 'formatter';
    // Viewport-heights to scroll per button click - one step per viewport.
    @bindable accessor scrollFactor = 8;

    @observableRef accessor scrollResults: Record<ScrollTarget, ScrollResult> = {
        hoist: null,
        ag: null
    };

    // Bumped each time the grids are rebuilt from a new config - keys the grid components, so both
    // remount. A mounted Hoist grid keeps the model it first found, and ag-Grid fixes its column
    // virtualisation option at init.
    @observable accessor gridGeneration = 0;

    @managed readonly formModel = this.createFormModel();
    @managed gridModel: GridModel;

    @computed
    get rowData(): PlainObject[] {
        const {fields} = this;
        return range(0, this.rowCount).map(() => {
            const row: PlainObject = {};
            fields.forEach(({field, kind}) => (row[field] = COLUMN_KINDS[kind].value()));
            return row;
        });
    }

    @computed
    get fields(): Array<{field: string; kind: ColumnKind}> {
        const kinds = Object.keys(COLUMN_KINDS) as ColumnKind[];
        return range(0, this.colCount).map(it => ({
            field: String(it),
            kind: kinds[it % kinds.length]
        }));
    }

    @computed
    get hoistColumns(): ColumnSpec[] {
        const {cellFormatting} = this;
        return this.fields.map(({field, kind}) => {
            const {formatter, renderer} = COLUMN_KINDS[kind];
            return {
                field,
                width: GRID_SIZING.colWidth,
                align: 'right',
                formatter: cellFormatting === 'formatter' ? formatter : undefined,
                renderer: cellFormatting === 'renderer' ? renderer : undefined
            };
        });
    }

    // The same formatters and renderers through ag-Grid's own `valueFormatter` and `cellRenderer`.
    @computed
    get agColumnDefs(): ColDef[] {
        const {cellFormatting} = this;
        return this.fields.map(({field, kind}) => {
            const {formatter, renderer} = COLUMN_KINDS[kind],
                // No inferred data type, so ag-Grid adds no formatter of its own in 'plain' mode.
                ret: ColDef = {
                    field,
                    width: GRID_SIZING.colWidth,
                    type: 'rightAligned',
                    cellDataType: false
                };

            if (cellFormatting === 'formatter') {
                ret.valueFormatter = p => formatter(p.value);
                // The class rules keep this grid's cost in line with the Hoist grid's. The ledger
                // placeholder is a Hoist grid style, so the digits of positive P&L values here sit
                // one `)` further right than those of negatives.
                ret.cellClassRules = formatter.cellClassRules;
            } else if (cellFormatting === 'renderer') {
                ret.cellRenderer = p => createElement('span', null, renderer(p.value));
            }
            return ret;
        });
    }

    constructor() {
        super();
        this.addReaction({
            track: () =>
                [this.rowData, this.hoistColumns, this.isColVirtualizationEnabled] as const,
            run: ([data]) => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
                this.gridModel.loadData(data);
                this.gridGeneration++;
                this.scrollResults = {hoist: null, ag: null};
            },
            fireImmediately: true
        });
    }

    /**
     * Scroll the given grid by `scrollFactor` viewports, one viewport per step, waiting for the
     * browser to render each step before taking the next, and record the timings.
     */
    async scrollGridAsync(grid: ScrollTarget): Promise<void> {
        const ref = grid === 'hoist' ? this.hoistGridRef : this.agGridRef,
            div = ref.current?.querySelector('.ag-grid-viewport');
        if (!div) return;

        const {height} = div.getBoundingClientRect(),
            steps = Math.max(1, Math.round(this.scrollFactor)),
            stepTimes: number[] = [],
            start = performance.now();

        for (let i = 0; i < steps; i++) {
            const stepStart = performance.now();
            div.scrollTop += height;
            await nextPaintAsync();
            stepTimes.push(performance.now() - stepStart);
        }

        const result: ScrollResult = {
            totalMs: performance.now() - start,
            maxStepMs: max(stepTimes),
            steps
        };
        runInAction(() => (this.scrollResults = {...this.scrollResults, [grid]: result}));
    }

    @action
    applyConfigs(): void {
        const {formModel} = this;
        if (!formModel.isValid) return;
        const {colCount, rowCount, isColVirtualizationEnabled, cellFormatting} =
            formModel.getData();
        this.colCount = colCount;
        this.rowCount = rowCount;
        this.isColVirtualizationEnabled = isColVirtualizationEnabled;
        this.cellFormatting = cellFormatting;
        // The applied values are the new baseline, so Apply re-enables only on a further change.
        formModel.init(formModel.getData());
    }

    // -------------------------------
    // Implementation
    // -------------------------------

    private createFormModel(): FormModel {
        return new FormModel({
            fields: [
                {
                    name: 'rowCount',
                    initialValue: this.rowCount,
                    rules: [required, numberIs({min: 0})]
                },
                {
                    name: 'colCount',
                    initialValue: this.colCount,
                    rules: [required, numberIs({min: 1})]
                },
                {
                    name: 'isColVirtualizationEnabled',
                    displayName: 'Col Virtualization',
                    initialValue: this.isColVirtualizationEnabled
                },
                {
                    name: 'cellFormatting',
                    initialValue: this.cellFormatting,
                    rules: [required]
                }
            ]
        });
    }

    private createGridModel(): GridModel {
        return new GridModel({
            store: {idSpec: XH.genId},
            columns: this.hoistColumns,
            useVirtualColumns: this.isColVirtualizationEnabled,
            // Fixed sizing, so the grid matches the bare grid's rows and columns per viewport.
            sizingMode: 'standard',
            autosizeOptions: {mode: 'disabled'}
        });
    }
}

//------------------
// Column kinds
//------------------
const DATE_FORMAT = {fmt: 'MMM D, YYYY'},
    // A shared pool, so the rows reuse a few hundred LocalDate instances.
    DATES = range(0, 500).map(it => LocalDate.get('2026-01-01').subtract(it));

/**
 * The kinds of column the grids cycle through, each with a value generator and a formatter and
 * renderer that take the same options.
 */
const COLUMN_KINDS = {
    pnl: {
        value: () => random(-5_000_000, 5_000_000),
        formatter: numberFormatter(PNL_FORMAT),
        renderer: numberRenderer(PNL_FORMAT)
    },
    volume: {
        value: () => random(0, 10_000_000_000),
        formatter: millionsFormatter(VOLUME_FORMAT),
        renderer: millionsRenderer(VOLUME_FORMAT)
    },
    date: {
        value: () => sample(DATES),
        formatter: dateFormatter(DATE_FORMAT),
        renderer: dateRenderer(DATE_FORMAT)
    }
};

type ColumnKind = keyof typeof COLUMN_KINDS;

// Resolves after the browser has painted the current state - two frames, as the first callback
// runs before the paint that follows the scroll.
function nextPaintAsync(): Promise<void> {
    return new Promise(resolve =>
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
    );
}
