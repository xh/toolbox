import {XH, HoistModel, managed} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {
    activeCol,
    cityCol,
    companyCol,
    profitLossCol,
    tagsCol,
    tradeDateCol,
    tradeVolumeCol
} from '../../../core/columns';

export class ColumnFilteringPanelModel extends HoistModel {
    @managed gridModel: GridModel;
    @managed filterChooserModel: FilterChooserModel;

    constructor() {
        super();
        this.gridModel = this.createGridModel();
        this.filterChooserModel = this.createFilterChooserModel();
    }

    override async doLoadAsync(loadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'}),
            {gridModel} = this;

        gridModel.loadData(trades);
    }

    private createGridModel() {
        return new GridModel({
            showSummary: 'bottom',
            selModel: {mode: 'multiple'},
            sortBy: 'profit_loss|desc|abs',
            emptyText: 'No records found...',
            filterModel: true,
            colChooserModel: true,
            enableExport: true,
            exportOptions: {
                columns: ['id', 'company', 'VISIBLE'],
                filename: 'hoist-sample-export'
            },
            store: {
                idEncodesTreePath: true,
                freezeData: false,
                fieldDefaults: {disableXssProtection: true}
            },
            colDefaults: {filterable: true},
            columns: [
                {field: 'id', hidden: true},
                activeCol,
                companyCol,
                cityCol,
                tradeVolumeCol,
                profitLossCol,
                tradeDateCol,
                tagsCol
            ]
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
                },
                'tags'
            ]
        });
    }
}
