import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, LoadSpec, lookup, managed, XH} from '@xh/hoist/core';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {isNil, map, uniq} from 'lodash';
import {
    closingPriceSparklineCol,
    dirCol,
    fundCol,
    modelCol,
    orderExecDay,
    orderExecTime,
    priceCol,
    quantityCol,
    regionCol,
    sectorCol,
    symbolCol,
    traderCol
} from '../../../../core/columns';
import {DetailModel} from '../DetailModel';

export class OrdersModel extends HoistModel {
    parentModel: DetailModel;
    @lookup(DashViewModel) dashViewModel: DashViewModel;

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
    }

    override onLinked() {
        super.onLinked();
        const {parentModel, dashViewModel} = this;

        const hidden = true;
        this.gridModel = new GridModel({
            persistWith: {dashViewModel},
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
                dashViewModel,
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

        this.addReaction(
            {
                track: () => [parentModel.collapsed, parentModel.positionId] as const,
                run: ([collapsed]) => {
                    if (!collapsed) this.loadAsync();
                }
            },
            {
                track: () => this.selectedSymbol,
                run: symbol => (parentModel.selectedSymbol = symbol)
            }
        );
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
