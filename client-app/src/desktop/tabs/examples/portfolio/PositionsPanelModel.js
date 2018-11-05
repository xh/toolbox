import {HoistModel, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {PanelSizingModel} from '@xh/hoist/desktop/cmp/panel';
import {DimensionChooserModel} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {numberRenderer} from '@xh/hoist/format';
import {GridModel} from '@xh/hoist/cmp/grid';
import {LocalStore} from '@xh/hoist/data';
import {PendingTaskModel} from '@xh/hoist/utils/async';

@HoistModel
export class PositionsPanelModel {

    @bindable dimensions = ['model'];
    @bindable loadTimestamp;

    dimChooserModel = new DimensionChooserModel({
        dimensions: [
            {value: 'model', label: 'Model'},
            {value: 'strategy', label: 'Strategy'},
            {value: 'symbol', label: 'Symbol'},
            {value: 'funds', label: 'Fund'},
            {value: 'region', label: 'Region'}
        ],
        historyPreference: 'portfolioDimHistory'
    });

    gridModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'name', 'quantity', 'pnl']
        }),
        sortBy: [{colId: 'pnl', sort: 'desc', abs: true}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
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
                isTreeColumn: true
            },
            {
                field: 'quantity',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    tooltip: true
                })
            },
            {
                headerName: 'P&L',
                field: 'pnl',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true,
                    tooltip: true
                })
            }
        ]
    });

    sizingModel = new PanelSizingModel({
        defaultSize: 500,
        side: 'left'
    });

    loadModel = new PendingTaskModel();

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    constructor() {
        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: (dimensions) => {
                this.setDimensions(dimensions);
                this.loadAsync();
            },
            fireImmediately: true
        });
    }

    loadAsync() {
        return XH.portfolioService
            .getPortfolioAsync(this.dimensions)
            .then(portfolio => {
                this.gridModel.loadData(portfolio);
                this.gridModel.selectFirst();
                this.setLoadTimestamp(Date.now());
            })
            .linkTo(this.loadModel);
    }
}