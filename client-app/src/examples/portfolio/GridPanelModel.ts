import {HoistModel, managed} from '@xh/hoist/core';
import {observable, action, makeObservable} from '@xh/hoist/mobx';
import {GridModel, TreeStyle} from '@xh/hoist/cmp/grid';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {PERSIST_MAIN} from './AppModel';
import {mktValCol, nameCol, pnlCol} from '../../core/columns';
import {PortfolioPanelModel} from './PortfolioPanelModel';

export class GridPanelModel extends HoistModel {

    @managed
    panelSizingModel = new PanelModel({
        defaultSize: 500,
        side: 'left',
        persistWith: {...PERSIST_MAIN, path: 'positionsPanel'}
    });

    @observable loadTimestamp: number;
    @action setLoadTimestamp(n: number) {this.loadTimestamp = n}

    @managed
    gridModel: GridModel;

    parentModel: PortfolioPanelModel;

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    constructor({parentModel}) {
        super();
        makeObservable(this);
        this.parentModel = parentModel;
        this.gridModel = this.createGridModel();
    }

    private createGridModel() {
        return new GridModel({
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
