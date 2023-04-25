import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable, computed} from '@xh/hoist/mobx';
import {range} from 'lodash';
import {createRef} from 'react';

export class GridScrollingModel extends HoistModel {
    readonly columnDefs = [{field: 'value'}];
    @managed readonly gridModel = new GridModel({
        columns: this.columnDefs,
        store: {idSpec: XH.genId}
    });

    readonly hoistGridRef = createRef<HTMLDivElement>();
    readonly agGridRef = createRef<HTMLDivElement>();

    @bindable rowCount = 500000;

    @computed get rowData(): Array<{value: number}> {
        return range(0, this.rowCount).map(it => ({value: it}));
    }

    constructor() {
        super();
        this.addReaction({
            track: () => this.rowData,
            run: data => this.gridModel.loadData(data),
            fireImmediately: true
        });
    }

    scrollGrid(grid: 'hoist' | 'ag'): void {
        const ref = grid === 'hoist' ? this.hoistGridRef : this.agGridRef,
            div = ref.current.querySelector(
                '.ag-body-viewport.ag-row-no-animation.ag-layout-normal'
            ),
            {height} = div.getBoundingClientRect();
        div.scrollTo({top: div.scrollTop + height * 4, behavior: 'smooth'});
    }
}
