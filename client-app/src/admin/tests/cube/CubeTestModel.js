import {emptyFlexCol, GridModel} from '@xh/hoist/cmp/grid';
import {timeCol} from '@xh/hoist/cmp/grid/columns';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {numberRenderer} from '@xh/hoist/format';
import {bindable, comparer} from '@xh/hoist/mobx';
import {start} from '@xh/hoist/promise';
import {isEmpty} from 'lodash';
import {DimensionManagerModel} from './dimensions/DimensionManagerModel';
import {LoadTimesModel} from './LoadTimesModel';
import {CubeModel} from './CubeModel';

@HoistModel
@LoadSupport
export class CubeTestModel {

    @managed cubeModel;
    @managed gridModel;
    @managed view;
    @managed dimManagerModel;
    @managed loadTimesModel;

    @bindable includeLeaves = false;
    @bindable fundFilter = null;
    @bindable showSummary = false;
    @bindable updateFreq = -1;
    @bindable updateCount = 5;

    constructor() {
        this.loadTimesModel = new LoadTimesModel();
        this.gridModel = this.createGridModel();
        this.cubeModel = new CubeModel(this);

        const {cube} = this.cubeModel;

        const cubeDims = cube.fields
            .filter(it => it.isDimension)
            .map(it => ({value: it.name, label: it.label}));

        this.dimManagerModel = new DimensionManagerModel({
            dimensions: cubeDims,
            defaultDimConfig: 'cubeTestDefaultDims',
            userDimPref: 'cubeTestUserDims'
        });

        this.view = cube.createView({
            query: this.getQuery(),
            store: this.gridModel.store,
            connect: true
        });

        this.addReaction({
            track: () => this.getQuery(),
            run: () => this.executeQueryAsync(),
            equals: comparer.structural
        });
    }

    getQuery() {
        const {dimManagerModel, fundFilter, includeLeaves} = this,
            dimensions = dimManagerModel.value,
            filters = !isEmpty(fundFilter) ? [{name: 'fund', values: [...fundFilter]}] : null,
            includeRoot = this.showSummary;

        return {dimensions, filters, includeLeaves, includeRoot};
    }

    async doLoadAsync() {
        await this.cubeModel.loadAsync();
    }

    async executeQueryAsync() {
        const LTM = this.loadTimesModel,
            {gridModel, loadModel, showSummary} = this,
            query = this.getQuery(),
            dimCount = query.dimensions.length,
            filterCount = !isEmpty(query.filters) ? query.filters[0].values.length : 0;

        // Query is initialized with empty dims and is triggering an initial run we don't need.
        if (!dimCount) return;

        return start(async () => {
            const {store} = gridModel;
            gridModel.setShowSummary(showSummary);
            store.setLoadRootAsSummary(showSummary);

            await LTM.withLoadTime(`Query | ${dimCount} dims | ${filterCount} fund filters`, async () => {
                this.view.updateQuery(this.getQuery());
            });
        }).linkTo(loadModel);
    }

    createGridModel() {
        return new GridModel({
            treeMode: true,
            showSummary: this.showSummary,
            store: {loadRootAsSummary: this.showSummary},
            sortBy: 'time|desc',
            emptyText: 'No records found...',
            enableColChooser: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            sizingMode: XH.appModel.gridSizingMode,
            columns: [
                {
                    field: 'id',
                    headerName: 'ID',
                    width: 40,
                    hidden: true
                },
                {
                    field: 'cubeLabel',
                    headerName: 'Name',
                    flex: 1,
                    minWidth: 180,
                    isTreeColumn: true
                },
                {
                    field: 'fund',
                    width: 130
                },
                {
                    field: 'trader',
                    width: 130
                },
                {
                    field: 'quantity',
                    headerName: 'Qty',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true
                    }),
                    hidden: true
                },
                {
                    field: 'price',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 4
                    }),
                    hidden: true
                },
                {
                    field: 'commission',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true
                    })
                },
                {
                    field: 'maxConfidence',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 0
                    }),
                    hidden: true
                },
                {
                    field: 'minConfidence',
                    align: 'right',
                    width: 130,
                    renderer: numberRenderer({
                        precision: 0
                    }),
                    hidden: true
                },
                {
                    field: 'time',
                    ...timeCol
                },
                {...emptyFlexCol}
            ]
        });
    }
}
