import {HoistModel, managed} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {action, bindable, makeObservable} from '@xh/hoist/mobx';
import {GridModel, TreeStyle} from '@xh/hoist/cmp/grid';
import {mktValCol, nameCol, pnlCol} from '../../core/columns';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {capitalize} from 'lodash';

export class GridPanelModel extends HoistModel {
    @bindable loadTimestamp: number;

    @managed gridModel: GridModel;
    @managed panelModel: PanelModel;

    parentModel: PortfolioPanelModel;

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    get collapsedTitle() {
        return this.parentModel.groupingChooserModel.value.map(it => capitalize(it)).join(' › ');
    }

    constructor({persistWith, parentModel}) {
        super();
        makeObservable(this);
        this.parentModel = parentModel;
        this.gridModel = this.createGridModel(persistWith);
        this.panelModel = this.createPanelModel(persistWith);
    }

    @action
    updateState(newState) {
        const {gridModel} = this;
        const gridPm = gridModel.persistenceModel;
        gridPm.patchState(newState.portfolioGrid);
        gridPm.updateGridColumns();
        gridPm.updateGridSort();

        this.panelModel.size = newState.positionsPanel.size;
        this.panelModel.collapsed = newState.positionsPanel.collapsed;
    }

    async clearStateAsync() {
        await this.gridModel.restoreDefaultsAsync({skipWarning: true});
        this.panelModel.size = this.panelModel.defaultSize;
    }

    //------------------
    // Implementation
    //------------------

    private createPanelModel(persistWith) {
        return new PanelModel({
            defaultSize: 500,
            side: 'left',
            persistWith: {path: 'positionsPanel', ...persistWith}
        });
    }

    private createGridModel(persistWith) {
        return new GridModel({
            persistWith: {path: 'portfolioGrid', ...persistWith},
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
