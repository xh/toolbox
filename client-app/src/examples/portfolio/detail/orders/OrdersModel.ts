import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {HoistModel, LoadSpec, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {isNil, map, uniq} from 'lodash';
import {
    closingPriceSparklineCol,
    orderExecDay,
    dirCol,
    fundCol,
    modelCol,
    priceCol,
    quantityCol,
    regionCol,
    sectorCol,
    symbolCol,
    orderExecTime,
    traderCol
} from '../../../../core/columns';
import {AppModel} from '../../AppModel';
import {DetailModel} from '../DetailModel';

export class OrdersModel extends HoistModel {
    parentModel: DetailModel;

    @managed gridModel: GridModel;
    @managed filterChooserModel: FilterChooserModel;

    get positionId() {
        return this.parentModel.positionId;
    }

    get selectedSymbol(): string {
        return this.gridModel.selectedRecord?.data.symbol ?? null;
    }

    constructor({parentModel}: {parentModel: DetailModel}) {
        super();

        this.parentModel = parentModel;

        const hidden = true;
        this.gridModel = new GridModel({
            persistWith: {...AppModel.instance.persistWith, path: 'ordersGrid'},
            groupBy: 'dir',
            sortBy: 'time|desc',
            emptyText: 'No orders found...',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            columns: [
                {...symbolCol, pinned: true},
                {...closingPriceSparklineCol},
                {...traderCol},
                {...fundCol, hidden},
                {...modelCol, hidden},
                {...regionCol, hidden},
                {...sectorCol, hidden},
                {...dirCol, hidden},
                {...quantityCol},
                {...priceCol},
                {...orderExecDay, hidden},
                {...orderExecTime}
            ]
        });

        this.filterChooserModel = new FilterChooserModel({
            persistWith: {
                ...AppModel.instance.persistWith,
                path: 'ordersFilter',
                persistFavorites: false
            },
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
                'price',
                'day'
            ]
        });

        this.addReaction({
            track: () => [parentModel.collapsed, parentModel.positionId] as const,
            run: ([collapsed]) => {
                if (!collapsed) this.loadAsync();
            }
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {gridModel, positionId} = this;

        if (isNil(positionId)) {
            gridModel.clear();
            return;
        }

        try {
            const orders = await XH.portfolioService.getOrdersAsync({positionId, loadSpec}),
                sparklineSeries = await XH.portfolioService.getSparklineSeriesAsync({
                    symbols: uniq(map(orders, 'symbol')),
                    loadSpec
                });
            if (loadSpec.isStale) return;

            orders.forEach(order => (order.closingPrices = sparklineSeries[order.symbol]));
            gridModel.loadData(orders);
            await gridModel.preSelectFirstAsync();
        } catch (e) {
            if (loadSpec.isAutoRefresh || !loadSpec.isStale) return;

            gridModel.clear();
            XH.handleException(e);
        }
    }
}
