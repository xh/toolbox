import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {isNil, map, uniq} from 'lodash';
import {PERSIST_DETAIL} from '../AppModel';
import {
    closingPriceSparklineCol,
    dirCol,
    fundCol,
    modelCol,
    priceCol,
    quantityCol,
    regionCol,
    sectorCol,
    symbolCol,
    timeCol,
    traderCol
} from '../../../core/columns';
import {DetailPanelModel} from './DetailPanelModel';

export class OrdersPanelModel extends HoistModel {
    parentModel: DetailPanelModel;
    @managed gridModel: GridModel;
    @managed filterChooserModel: FilterChooserModel;

    get positionId() {
        return this.parentModel.positionId;
    }

    constructor(parentModel) {
        super();

        this.parentModel = parentModel;
        this.gridModel = new GridModel({
            groupBy: 'dir',
            sortBy: 'time|desc',
            emptyText: 'No orders found...',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            persistWith: {...PERSIST_DETAIL, path: 'ordersGrid'},
            columns: [
                {...symbolCol, pinned: true},
                {...closingPriceSparklineCol},
                {...traderCol},
                {...fundCol, hidden: true},
                {...modelCol, hidden: true},
                {...regionCol, hidden: true},
                {...sectorCol, hidden: true},
                {...dirCol},
                {...quantityCol},
                {...priceCol},
                {...timeCol}
            ]
        });

        this.filterChooserModel = new FilterChooserModel({
            bind: this.gridModel.store,
            persistWith: {...PERSIST_DETAIL, path: 'ordersFilter', persistValue: false},
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
            track: () => [parentModel.collapsed, parentModel.positionId],
            run: ([collapsed]) => {
                if (!collapsed) this.loadAsync();
            }
        });
    }

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    override async doLoadAsync(loadSpec) {
        const {gridModel, positionId} = this;

        if (isNil(positionId)) {
            gridModel.clear();
            return;
        }

        try {
            const orders = await XH.portfolioService.getOrdersAsync({positionId, loadSpec}),
                symbols = uniq(map(orders, 'symbol')),
                sparklineSeries = await XH.portfolioService.getSparklineSeriesAsync({
                    symbols,
                    loadSpec
                });

            orders.forEach(order => (order.closingPrices = sparklineSeries[order.symbol]));

            gridModel.loadData(orders);
            await gridModel.preSelectFirstAsync();
        } catch (e) {
            gridModel.clear();
            XH.handleException(e);
        }
    }
}
