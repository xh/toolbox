import {FormModel} from '@xh/hoist/cmp/form';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {action, bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {keyBy, mapValues, range} from 'lodash';
import {createRef} from 'react';

export class GridScrollingModel extends HoistModel {
    readonly hoistGridRef = createRef<HTMLDivElement>();
    readonly agGridRef = createRef<HTMLDivElement>();

    @observable colCount = 20;
    @observable rowCount = 100_000;
    @observable isColVirtualizationEnabled = false;
    @bindable scrollFactor = 8;

    @managed readonly formModel = this.createFormModel();
    @managed gridModel: GridModel;

    @computed
    get rowData(): PlainObject[] {
        return range(0, this.rowCount).map(y =>
            mapValues(keyBy(this.columnDefs, 'field'), (_, x) => `${x}-${y}`)
        );
    }

    @computed
    get columnDefs(): Array<{field: string}> {
        return range(0, this.colCount).map(it => ({field: String(it)}));
    }

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => [this.rowData, this.columnDefs, this.isColVirtualizationEnabled],
            run: ([data]) => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
                this.gridModel.loadData(data);
            },
            fireImmediately: true
        });
    }

    scrollGrid(grid: 'hoist' | 'ag'): void {
        const ref = grid === 'hoist' ? this.hoistGridRef : this.agGridRef,
            div = ref.current.querySelector(
                '.ag-body-viewport.ag-row-no-animation.ag-layout-normal'
            ),
            {height} = div.getBoundingClientRect();
        div.scrollTo({top: div.scrollTop + height * this.scrollFactor, behavior: 'smooth'});
    }

    @action
    applyConfigs(): void {
        const {formModel} = this;
        if (!formModel.isValid) return;
        const {colCount, rowCount, isColVirtualizationEnabled} = formModel.getData();
        this.colCount = colCount;
        this.rowCount = rowCount;
        this.isColVirtualizationEnabled = isColVirtualizationEnabled;
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
                }
            ]
        });
    }

    private createGridModel(): GridModel {
        return new GridModel({
            store: {idSpec: XH.genId},
            columns: this.columnDefs,
            useVirtualColumns: this.isColVirtualizationEnabled
        });
    }
}
