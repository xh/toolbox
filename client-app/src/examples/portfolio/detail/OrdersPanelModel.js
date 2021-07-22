import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {dateTimeCol, GridModel} from '@xh/hoist/cmp/grid';
import {numberRenderer} from '@xh/hoist/format';
import {isNil} from 'lodash';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {PERSIST_DETAIL} from '../AppModel';

export class OrdersPanelModel extends HoistModel {

    @managed gridModel;
    @managed filterChooserModel;

    @bindable positionId = null;

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = new GridModel({
            groupBy: 'dir',
            sortBy: 'time|desc',
            emptyText: 'No orders found...',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            sizingMode: XH.appModel.gridSizingMode,
            persistWith: {...PERSIST_DETAIL, path: 'ordersGrid'},
            store: {
                fields: [
                    {name: 'symbol', displayName: 'Instrument', type: 'string'},
                    {name: 'trader', type: 'string'},
                    {name: 'fund', type: 'string'},
                    {name: 'model', type: 'string'},
                    {name: 'region', type: 'string'},
                    {name: 'sector', type: 'string'},
                    {name: 'dir', displayName: 'Direction', type: 'string'},
                    {name: 'quantity', type: 'number'},
                    {name: 'price', type: 'number'},
                    {name: 'time', displayName: 'Exec Time', type: 'date'}


                ]
            },
            columns: [
                {field: 'symbol', width: 100, pinned: true},
                {field: 'trader', width: 140},
                {field: 'fund', width: 160, hidden: true},
                {field: 'model', width: 160, hidden: true},
                {field: 'region', width: 160, hidden: true},
                {field: 'sector', width: 160, hidden: true},
                {
                    field: 'dir',
                    headerName: 'B/S',
                    headerTooltip: 'Direction (Buy/Sell)',
                    align: 'center',
                    width: 60
                },
                {
                    field: 'quantity',
                    width: 100,
                    renderer: numberRenderer({precision: 0, ledger: true})
                },
                {
                    field: 'price',
                    width: 80,
                    renderer: numberRenderer({precision: 2})
                },
                {
                    field: 'time',
                    ...dateTimeCol,
                    align: 'left'
                }
            ]
        });

        this.filterChooserModel = new FilterChooserModel({
            bind: this.gridModel.store,
            fieldSpecs: [
                'symbol',
                'trader',
                'fund',
                'model',
                'region',
                {
                    field: 'dir',
                    forceSelection: true,
                    values: ['Buy', 'Sell']
                },
                'quantity',
                'price'
            ]
        });

        this.addReaction({
            track: () => this.positionId,
            run: () => this.loadAsync()
        });
    }

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    async doLoadAsync(loadSpec) {
        const {positionId, gridModel} = this;

        if (isNil(positionId)) {
            gridModel.loadData([]);
            return;
        }

        const orders = await XH.portfolioService.getOrdersAsync({
            positionId,
            loadSpec
        }).catchDefault() ?? [];

        gridModel.loadData(orders);
        await gridModel.preSelectFirstAsync();

    }
}
