import {FormModel} from '@xh/hoist/cmp/form';
import {type ColumnSpec, GridModel} from '@xh/hoist/cmp/grid';
import type {PlainObject} from '@xh/hoist/core';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {action, bindable, computed, observable, observableRef, runInAction} from '@xh/hoist/mobx';
import type {ColDef} from 'ag-grid-community';
import {keyBy, mapValues, max, range} from 'lodash';
import {createElement, createRef} from 'react';

export type ScrollTarget = 'hoist' | 'ag';

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
 * to isolate the cost of Hoist's integration layer. Column virtualisation and per-cell renderers
 * are the two settings with the largest effect on scroll cost, so both can be toggled. The scroll
 * buttons run a measured, stepped scroll and report its timings.
 */
export class GridScrollingModel extends HoistModel {
    readonly hoistGridRef = createRef<HTMLDivElement>();
    readonly agGridRef = createRef<HTMLDivElement>();

    @observable accessor colCount = 20;
    @observable accessor rowCount = 100_000;
    @observable accessor isColVirtualizationEnabled = true;
    // True to give every column a (pass-through) renderer - a React component per cell in both
    // grids - vs. plain text cells that ag-Grid writes itself.
    @observable accessor useRenderers = false;
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
        return range(0, this.rowCount).map(y =>
            mapValues(keyBy(this.fields, 'field'), (_, x) => `${x}-${y}`)
        );
    }

    @computed
    get fields(): Array<{field: string}> {
        return range(0, this.colCount).map(it => ({field: String(it)}));
    }

    @computed
    get hoistColumns(): ColumnSpec[] {
        const renderer = this.useRenderers ? v => v : undefined;
        return this.fields.map(({field}) => ({field, renderer}));
    }

    @computed
    get agColumnDefs(): ColDef[] {
        const cellRenderer = this.useRenderers
            ? p => createElement('span', null, p.value)
            : undefined;
        return this.fields.map(({field}) => ({field, cellRenderer}));
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
        const {colCount, rowCount, isColVirtualizationEnabled, useRenderers} = formModel.getData();
        this.colCount = colCount;
        this.rowCount = rowCount;
        this.isColVirtualizationEnabled = isColVirtualizationEnabled;
        this.useRenderers = useRenderers;
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
                    rules: [required]
                },
                {
                    name: 'colCount',
                    initialValue: this.colCount,
                    rules: [required]
                },
                {
                    name: 'isColVirtualizationEnabled',
                    displayName: 'Col Virtualization',
                    initialValue: this.isColVirtualizationEnabled
                },
                {
                    name: 'useRenderers',
                    displayName: 'Cell Renderers',
                    initialValue: this.useRenderers
                }
            ]
        });
    }

    private createGridModel(): GridModel {
        return new GridModel({
            store: {idSpec: XH.genId},
            columns: this.hoistColumns,
            useVirtualColumns: this.isColVirtualizationEnabled
        });
    }
}

// Resolves after the browser has painted the current state - two frames, as the first callback
// runs before the paint that follows the scroll.
function nextPaintAsync(): Promise<void> {
    return new Promise(resolve =>
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
    );
}
