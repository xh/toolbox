import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {isNil} from 'lodash';
import {PERSIST_DETAIL} from '../AppModel';
import {
    dirCol,
    fundCol,
    modelCol, priceCol,
    quantityCol,
    regionCol,
    sectorCol,
    symbolCol, timeCol,
    traderCol
} from '../../../core/columns';

export class OrdersPanelModel extends HoistModel {

    parentModel;
    @managed gridModel;
    @managed filterChooserModel;

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

    async doLoadAsync(loadSpec) {
        const {gridModel, positionId} = this;

        if (isNil(positionId)) {
            gridModel.clear();
            return;
        }

        try {
            const orders = await XH.portfolioService.getOrdersAsync({positionId, loadSpec});
            gridModel.loadData(orders);
            await gridModel.preSelectFirstAsync();
        } catch (e) {
            gridModel.clear();
            XH.handleException(e);
        }

    }
}
