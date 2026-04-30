import {FilterBuilderModel} from '@xh/hoist/cmp/filter';
import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {
    activeCol,
    cityCol,
    companyCol,
    profitLossCol,
    tradeDateCol,
    tradeVolumeCol
} from '../../../core/columns';

export class FilterBuilderPanelModel extends HoistModel {
    @managed gridModel: GridModel;
    @managed filterBuilderModel: FilterBuilderModel;
    @managed filterChooserModel: FilterChooserModel;
    @bindable enableFavorites: boolean = true;

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = this.createGridModel();
        this.filterBuilderModel = this.createFilterBuilderModel();
        this.filterChooserModel = this.createFilterChooserModel();

        this.addReaction({
            track: () => this.enableFavorites,
            run: () => {
                this.filterBuilderModel.destroy();
                this.filterBuilderModel = this.createFilterBuilderModel();
            }
        });
    }

    override async doLoadAsync() {
        const {trades} = await XH.fetchJson({url: 'trade'});
        this.gridModel.loadData(trades);
    }

    private createGridModel() {
        return new GridModel({
            sortBy: 'profit_loss|desc|abs',
            emptyText: 'No records found...',
            store: {
                idEncodesTreePath: true,
                freezeData: false
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
    }

    private createFilterBuilderModel() {
        const {store} = this.gridModel;
        return new FilterBuilderModel({
            bind: store,
            fieldSpecs: [
                'active',
                'company',
                'city',
                'trade_date',
                {field: 'profit_loss'},
                {field: 'trade_volume'}
            ],
            persistWith: this.enableFavorites
                ? {localStorageKey: 'toolboxFilterBuilder', persistFavorites: true}
                : null
        });
    }

    private createFilterChooserModel() {
        const {store} = this.gridModel;
        return new FilterChooserModel({
            bind: store,
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
}
