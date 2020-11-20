import {HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {GridModel, TreeStyle} from '@xh/hoist/cmp/grid';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {PERSIST_MAIN} from './AppModel';

export class GridPanelModel extends HoistModel {

    get isLoadSupport() {return true}

    @managed
    panelSizingModel = new PanelModel({
        defaultSize: 500,
        side: 'left',
        persistWith: {...PERSIST_MAIN, path: 'positionsPanel'}
    });

    // TODO:  What is this?  is this load support?
    @bindable loadTimestamp;

    @managed
    gridModel;

    parentModel;

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    constructor({parentModel}) {
        super();
        this.parentModel = parentModel;
        this.gridModel = this.createGridModel();
    }

    createGridModel() {
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
            sizingMode: XH.appModel.gridSizingMode,
            store: this.parentModel.store,
            columns: [
                {
                    field: 'id',
                    headerName: 'ID',
                    width: 40,
                    hidden: true
                },
                {
                    field: 'name',
                    headerName: 'Name',
                    flex: 1,
                    minWidth: 180,
                    isTreeColumn: true
                },
                {
                    field: 'mktVal',
                    headerName: 'Mkt Value (m)',
                    headerTooltip: 'Market value (in millions USD)',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                    renderer: millionsRenderer({
                        precision: 3,
                        ledger: true
                    })
                },
                {
                    field: 'pnl',
                    headerName: 'P&L',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    highlightOnChange: true,
                    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true,
                        colorSpec: true
                    })
                }
            ]
        });
    }
}
