import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {HoistModel, managed, XH} from '@xh/hoist/core';
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
} from '../../../core/columns';
import {DetailPanelModel} from './DetailPanelModel';
import {action} from '@xh/hoist/mobx';
import {parseFilter} from '@xh/hoist/data';

export class OrdersPanelModel extends HoistModel {
    parentModel: DetailPanelModel;
    @managed gridModel: GridModel;
    @managed filterChooserModel: FilterChooserModel;

    get positionId() {
        return this.parentModel.positionId;
    }

    constructor({persistWith, parentModel}) {
        super();

        this.parentModel = parentModel;

        const hidden = true;
        this.gridModel = new GridModel({
            groupBy: 'dir',
            sortBy: 'time|desc',
            emptyText: 'No orders found...',
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            persistWith: {path: 'ordersGrid', ...persistWith},
            columns: [
                {...symbolCol, pinned: true},
                {...closingPriceSparklineCol},
                {...traderCol},
                {...fundCol, hidden},
                {...modelCol, hidden},
                {...regionCol, hidden},
                {...sectorCol, hidden},
                {...dirCol},
                {...quantityCol},
                {...priceCol},
                {...orderExecDay, hidden},
                {...orderExecTime}
            ]
        });

        this.filterChooserModel = new FilterChooserModel({
            bind: this.gridModel.store,
            persistWith: {path: 'ordersFilter', ...persistWith},
            initialValue: null,
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

    @action
    updateState(newState) {
        const {gridModel, filterChooserModel} = this,
            gridPm = gridModel.persistenceModel,
            ordersFilterValue = newState.ordersFilter ? newState.ordersFilter.value : null,
            ordersFilterFavorites = newState.ordersFilter ? newState.ordersFilter.favorites : [];
        gridPm.patchState(newState.ordersGrid);
        gridPm.updateGridColumns();
        gridPm.updateGridSort();

        filterChooserModel.setValue(ordersFilterValue);
        filterChooserModel.setFavorites(ordersFilterFavorites.map(parseFilter));
    }

    async clearStateAsync() {
        await this.gridModel.restoreDefaultsAsync({
            skipWarning: true,
            skipClearPersistenceModel: true
        });
        this.filterChooserModel.setValue(null);
        this.filterChooserModel.setFavorites([]);
    }
}
