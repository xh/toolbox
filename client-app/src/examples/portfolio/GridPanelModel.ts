import {HoistModel, managed} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {GridModel, TreeStyle} from '@xh/hoist/cmp/grid';
import {PERSIST_MAIN} from './AppModel';
import {mktValCol, nameCol, pnlCol} from '../../core/columns';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {capitalize} from 'lodash';

export class GridPanelModel extends HoistModel {
    @bindable loadTimestamp: number;

    @managed
    gridModel: GridModel;

    parentModel: PortfolioPanelModel;

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    get collapsedTitle() {
        return this.parentModel.groupingChooserModel.value.map(it => capitalize(it)).join(' › ');
    }

    constructor({parentModel}) {
        super();
        makeObservable(this);
        this.parentModel = parentModel;
        this.gridModel = this.createGridModel();
    }

    private createGridModel() {
        return new GridModel({
            printSupport: true,
            persistWith: PERSIST_MAIN,
            treeMode: true,
            treeStyle: TreeStyle.HIGHLIGHTS_AND_BORDERS,
            sortBy: 'pnl|desc|abs',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            showSummary: true,
            store: this.parentModel.store,
            columns: [
                {
                    field: 'id',
                    headerName: 'ID',
                    width: 40,
                    hidden: true
                },
                {
                    ...nameCol,
                    width: null,
                    flex: 1,
                    isTreeColumn: true
                },
                {...mktValCol},
                {...pnlCol, highlightOnChange: true}
            ]
        });
    }
}
