import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {dateTimeCol, GridModel} from '@xh/hoist/cmp/grid';
import {numberRenderer} from '@xh/hoist/format';
import {isNil} from 'lodash';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class OrdersPanelModel {

    @bindable positionId = null;

    constructor() {
        this.addReaction({
            track: () => this.positionId,
            run: () => this.loadAsync()
        });
    }

    @managed
    gridModel = new GridModel({
        groupBy: 'dir',
        sortBy: [{colId: 'time', sort: 'desc'}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        rowBorders: true,
        showHover: true,
        sizingMode: XH.appModel.gridSizingMode,
        persistWith: 'portfolio-orders-grid',
        columns: [
            {
                field: 'symbol',
                headerName: 'Instrument',
                width: 100,
                pinned: true
            },
            {
                field: 'trader',
                headerName: 'Trader',
                width: 140
            },
            {
                field: 'fund',
                headerName: 'Fund',
                width: 160,
                hidden: true
            },
            {
                field: 'model',
                headerName: 'Model',
                width: 160,
                hidden: true
            },
            {
                field: 'region',
                headerName: 'Region',
                width: 160,
                hidden: true
            },
            {
                field: 'sector',
                headerName: 'Sector',
                width: 160,
                hidden: true
            },
            {
                field: 'dir',
                headerName: 'B/S',
                headerTooltip: 'Direction (Buy/Sell)',
                chooserName: 'Direction',
                align: 'center',
                width: 60
            },
            {
                field: 'quantity',
                headerName: 'Quantity',
                width: 100,
                align: 'right',
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true
                })
            },
            {
                field: 'price',
                headerName: 'Price',
                width: 80,
                align: 'right',
                renderer: numberRenderer({
                    precision: 2
                })
            },
            {
                field: 'time',
                headerName: 'Exec Time',
                ...dateTimeCol,
                align: 'left'
            }
        ]
    });

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    async doLoadAsync(loadSpec) {
        const {positionId, gridModel} = this;

        if (isNil(positionId)) {
            gridModel.loadData([]);
            return;
        }

        const orders = await XH.portfolioService.getOrdersAsync(positionId);
        gridModel.loadData(orders);
        if (!this.selectedRecord) gridModel.selectFirst();
    }
}
