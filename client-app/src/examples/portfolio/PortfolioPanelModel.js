import {HoistModel, LoadSupport, managed, loadAllAsync, XH} from '@xh/hoist/core';
import {PositionsPanelModel} from './PositionsPanelModel';
import {SplitTreeMapPanelModel} from './SplitTreeMapPanelModel';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {PositionInfoPanelModel} from './PositionInfoPanelModel';
import {GridModel} from '@xh/hoist/cmp/grid';
import {clamp} from 'lodash';

@HoistModel
@LoadSupport
export class PortfolioPanelModel {

    @managed
    gridModel = new GridModel({
        treeMode: true,
        sortBy: 'pnl|desc|abs',
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        rowBorders: true,
        showHover: true,
        compact: XH.appModel.useCompactGrids,
        stateModel: 'portfolio-positions-grid',
        store: {
            processRawData: (r) => {
                return {
                    pnlMktVal: clamp(r.pnl / Math.abs(r.mktVal), -1, 1),
                    ...r
                };
            },
            fields: [
                {name: 'pnl', label: 'P&L'},
                {name: 'pnlMktVal', label: 'P&L / Mkt Val'}
            ]
        },
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
                agOptions: {
                    aggFunc: 'sum'
                },
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
                agOptions: {
                    aggFunc: 'sum'
                },
                tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true
                })
            }
        ]
    });

    @managed positionsPanelModel = new PositionsPanelModel({gridModel: this.gridModel});
    @managed splitTreeMapPanelModel = new SplitTreeMapPanelModel({gridModel: this.gridModel, colorMode: 'balanced'});
    @managed positionInfoPanelModel = new PositionInfoPanelModel();

    get selectedPosition() {
        return this.positionsPanelModel.selectedRecord;
    }

    constructor() {
        this.addReaction(this.selectedPositionReaction());
    }

    async doLoadAsync(loadSpec) {
        await loadAllAsync([
            this.positionsPanelModel,
            this.positionInfoPanelModel
        ], loadSpec);
    }

    get isResizing() {
        return this.positionInfoPanelModel.isResizing || this.positionsPanelModel.isResizing;
    }

    //----------------------------------------
    // Implementations
    //----------------------------------------
    selectedPositionReaction() {
        return {
            track: () => this.selectedPosition,
            run: (position) => {
                console.log(`setting positionInfoPanelModel's positionId to: ${position ? position.id : 'null'}`);
                this.positionInfoPanelModel.setPositionId(position ? position.id : null);
            },
            delay: 500
        };
    }
}