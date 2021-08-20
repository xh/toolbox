import {GridModel, timeCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed} from '@xh/hoist/core';
import {numberRenderer} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {isEmpty} from 'lodash';
import {DimensionManagerModel} from './dimensions/DimensionManagerModel';
import {LoadTimesModel} from './LoadTimesModel';
import {CubeModel} from './CubeModel';

export class CubeTestModel extends HoistModel {

    @managed cubeModel;
    @managed gridModel;
    @managed view;
    @managed dimManagerModel;
    @managed loadTimesModel;

    @bindable includeLeaves = false;
    @bindable.ref fundFilter = null;
    @bindable showSummary = false;
    @bindable updateFreq = -1;
    @bindable updateCount = 5;

    constructor() {
        super();
        makeObservable(this);
        this.loadTimesModel = new LoadTimesModel();
        this.gridModel = this.createGridModel();
        this.cubeModel = new CubeModel(this);

        const {cube} = this.cubeModel;

        this.dimManagerModel = new DimensionManagerModel({
            dimensions: cube.dimensions,
            defaultDimConfig: 'cubeTestDefaultDims',
            userDimPref: 'cubeTestUserDims'
        });

        this.view = cube.createView({
            query: this.getQuery(),
            stores: this.gridModel.store,
            connect: true
        });

        this.addReaction({
            track: () => this.getQuery(),
            run: () => this.executeQueryAsync(),
            equals: 'structural'
        });
    }

    getQuery() {
        const {dimManagerModel, fundFilter, includeLeaves} = this,
            dimensions = dimManagerModel.value,
            filter = !isEmpty(fundFilter) ? {field: 'fund', op: '=', value: fundFilter} : null,
            includeRoot = this.showSummary;

        return {dimensions, filter, includeLeaves, includeRoot};
    }

    clear() {
        this.cubeModel.cube.clearAsync();
    }

    async doLoadAsync() {
        await this.cubeModel.loadAsync();
    }

    async executeQueryAsync() {
        const LTM = this.loadTimesModel,
            {gridModel, loadModel, showSummary} = this,
            query = this.getQuery(),
            dimCount = query.dimensions.length,
            filterCount = !isEmpty(query.filter) ? query.filter.value.length : 0;

        // Query is initialized with empty dims and is triggering an initial run we don't need.
        if (!dimCount) return;

        return wait().then(async () => {
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
            colChooserModel: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
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
                }
            ]
        });
    }
}
