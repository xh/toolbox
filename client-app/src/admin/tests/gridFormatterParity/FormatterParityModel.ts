import {GridModel} from '@xh/hoist/cmp/grid';
import type {ColumnOrGroupSpec} from '@xh/hoist/cmp/grid';
import type {PlainObject, SizingMode} from '@xh/hoist/core';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {action, observableRef, runInAction} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {camelCase, range} from 'lodash';
import {createRef} from 'react';
import type {CellDiff} from './CellProbe';
import {compareCells, readCell} from './CellProbe';
import type {ParityCase} from './FormatterParityCases';
import {PARITY_CASES} from './FormatterParityCases';

/** The outcome of one probe run - see {@link FormatterParityModel.runProbeAsync}. */
export interface ProbeResult {
    /** Cell pairs compared. */
    pairCount: number;
    /** Cell pairs with at least one difference. */
    failedPairCount: number;
    sizingMode: SizingMode;
    darkTheme: boolean;
}

/**
 * Regression check for hoist-react's `Column.formatter`. Each case renders one field through a
 * renderer and through the matching formatter, and the probe reads both cells of every pair
 * from the DOM to check that they display the same.
 */
export class FormatterParityModel extends HoistModel {
    readonly gridRef = createRef<HTMLDivElement>();

    @managed readonly gridModel = this.createGridModel();
    /** One row per difference found by the last probe run. */
    @managed readonly diffGridModel = this.createDiffGridModel();

    @observableRef accessor result: ProbeResult = null;

    constructor() {
        super();
        this.gridModel.loadData(createRows());

        // A result holds only for the sizing mode and theme it ran in.
        this.addReaction({
            track: () => [this.gridModel.sizingMode, XH.darkTheme],
            run: () => this.clearResult()
        });
    }

    /** Autosize the grid, then compare every rendered cell pair and record the differences. */
    async runProbeAsync(): Promise<void> {
        const {gridModel} = this;
        await gridModel.autosizeAsync();
        await nextPaintAsync();

        const gridEl = this.gridRef.current;
        if (!gridEl) return;

        const diffs: PlainObject[] = [];
        let pairCount = 0,
            failedPairCount = 0;

        gridModel.store.records.forEach(record => {
            const cellOf = (colId: string) =>
                gridEl.querySelector<HTMLElement>(
                    `.ag-row[row-id="${record.agId}"] .ag-cell[col-id="${colId}"]`
                );

            PARITY_CASES.forEach(parityCase => {
                const id = caseId(parityCase),
                    rendererCell = cellOf(`${id}_r`),
                    formatterCell = cellOf(`${id}_f`),
                    pairDiffs: CellDiff[] =
                        rendererCell && formatterCell
                            ? compareCells(readCell(rendererCell), readCell(formatterCell))
                            : [
                                  {
                                      check: 'missing',
                                      renderer: rendererCell ? 'rendered' : 'not rendered',
                                      formatter: formatterCell ? 'rendered' : 'not rendered'
                                  }
                              ];

                pairCount++;
                if (pairDiffs.length) failedPairCount++;
                pairDiffs.forEach(it =>
                    diffs.push({...it, caseName: parityCase.name, row: record.id})
                );
            });
        });

        this.diffGridModel.loadData(diffs);
        runInAction(() => {
            this.result = {
                pairCount,
                failedPairCount,
                sizingMode: gridModel.sizingMode,
                darkTheme: XH.darkTheme
            };
        });
    }

    //------------------
    // Implementation
    //------------------
    @action
    private clearResult() {
        this.result = null;
        this.diffGridModel.clear();
    }

    private createGridModel(): GridModel {
        const columns: ColumnOrGroupSpec[] = [
            {field: 'id', headerName: 'Row', width: 50, pinned: 'left'},
            {field: 'num', colId: 'rawNum', headerName: 'Raw Num', width: 110, pinned: 'left'},
            ...PARITY_CASES.map(parityCase => {
                const {name, field, renderer, formatter} = parityCase,
                    id = caseId(parityCase),
                    // Size each column on its cells alone, so the pair's widths can be compared.
                    common = {field, autosizeIncludeHeader: false};
                return {
                    groupId: id,
                    headerName: name,
                    // A group border sits on one cell of the pair only, which would offset its text.
                    borders: false,
                    children: [
                        {
                            ...renderer,
                            ...common,
                            colId: `${id}_r`,
                            headerName: 'R',
                            headerTooltip: 'Renderer'
                        },
                        {
                            ...formatter,
                            ...common,
                            colId: `${id}_f`,
                            headerName: 'F',
                            headerTooltip: 'Formatter'
                        }
                    ]
                };
            })
        ];

        return new GridModel({
            store: {
                fields: [
                    {name: 'num', type: 'number'},
                    {name: 'date', type: 'date'},
                    {name: 'localDate', type: 'localDate'}
                ]
            },
            columns,
            // Scopes the units label rule in FormatterParityPanel.scss. Autosize adds row classes
            // to the row it measures in, so the rule applies there too.
            rowClassFn: () => 'tb-formatter-parity__row',
            autosizeOptions: {mode: 'managed'},
            // The probe reads every cell, so all columns must stay in the DOM.
            useVirtualColumns: false
        });
    }

    private createDiffGridModel(): GridModel {
        return new GridModel({
            store: {idSpec: XH.genId},
            emptyText: 'No differences.',
            columns: [
                {field: 'caseName', headerName: 'Case', width: 200},
                {field: 'row', width: 60},
                {field: 'check', width: 100},
                {field: 'renderer', flex: 1},
                {field: 'formatter', flex: 1}
            ]
        });
    }
}

// Values that exercise signs, zero, null, rounding, scale and a 4-digit whole number. Dates cycle
// through a shorter list.
const NUMBERS = [1234567.891, -1234567.891, 0, null, 0.004, -0.004, 12.5, -12.5, 2.5e9, 0.25, 1500];

function createRows(): PlainObject[] {
    const dates = [
        new Date(2026, 9, 7, 14, 5, 9),
        new Date(2024, 0, 15, 9, 30, 0),
        new Date(), // Today, for compactDate.
        null,
        new Date(2026, 6, 1, 0, 0, 0)
    ];
    return range(0, NUMBERS.length).map(id => {
        const date = dates[id % dates.length];
        return {id, num: NUMBERS[id], date, localDate: date ? LocalDate.from(date) : null};
    });
}

function caseId(parityCase: ParityCase): string {
    return camelCase(parityCase.name);
}

// Resolves after the browser has painted the current state.
function nextPaintAsync(): Promise<void> {
    return new Promise(resolve =>
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
    );
}
