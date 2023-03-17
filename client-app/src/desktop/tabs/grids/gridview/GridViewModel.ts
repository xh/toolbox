import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {millionsRenderer} from '@xh/hoist/format';
import {numberRenderer} from '@xh/hoist/format';
import {runInAction} from '@xh/hoist/mobx';
import {
    activeCol,
    cityCol,
    companyCol,
    profitLossCol,
    tradeDateCol,
    tradeVolumeCol
} from '../../../../core/columns';
import {GridViewManagerModel} from './manager/GridViewManagerModel';

export class GridViewModel extends HoistModel {
    @managed gridModel: GridModel;
    @managed filterChooserModel: FilterChooserModel;
    @managed managerModel: GridViewManagerModel;

    constructor() {
        super();

        this.managerModel = new GridViewManagerModel({
            url: 'rest/gridView',
            persistWith: {localStorageKey: 'gridViewManager'},
            onChangeAsync: async () => this.onViewChangeAsync()
        });

        this.gridModel = new GridModel({
            persistWith: this.managerModel.provider,
            showSummary: 'bottom',
            selModel: {mode: 'multiple'},
            sortBy: 'profit_loss|desc|abs',
            emptyText: 'No records found...',
            filterModel: true,
            colChooserModel: true,
            store: {
                idEncodesTreePath: true
            },
            colDefaults: {filterable: true},
            columns: [
                {field: 'id', hidden: true},
                activeCol,
                companyCol,
                cityCol,
                tradeVolumeCol,
                profitLossCol,
                tradeDateCol
            ]
        });

        this.filterChooserModel = new FilterChooserModel({
            bind: this.gridModel.store,
            persistWith: {...this.managerModel.provider, persistFavorites: false},
            fieldSpecs: [
                'active',
                'company',
                'city',
                'trade_date',
                {field: 'profit_loss', valueRenderer: numberRenderer({precision: 0})},
                {
                    field: 'trade_volume',
                    valueRenderer: millionsRenderer({precision: 1, label: true})
                }
            ]
        });
    }

    async onViewChangeAsync() {
        const {managerModel, gridModel, filterChooserModel} = this,
            newState = managerModel.provider.getData();

        runInAction(() => {
            // TODO - add Hoist API to handle this state refresh (method on gridPm to push new state -> grid)
            const gridPm = gridModel.persistenceModel;
            gridPm.state = newState.grid ?? {columns: []};
            gridPm.updateGridColumns();
            gridPm.updateGridSort();

            const filterState = newState.filterChooser?.value ?? [];
            filterChooserModel.setValue(filterState);
        });
    }

    override async doLoadAsync(loadSpec) {
        try {
            const {trades} = await XH.fetchJson({url: 'trade'});
            this.gridModel.loadData(trades);
        } catch (e) {
            XH.handleException(e);
        }
    }
}
