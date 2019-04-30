import {emptyFlexCol, GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {Cube, View} from '@xh/hoist/data/cube';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {bindable, comparer} from '@xh/hoist/mobx';
import {values} from 'lodash';
import {DimensionManagerModel} from './dimensions/DimensionManagerModel';

@HoistModel
@LoadSupport
export class CubeDataModel {

    @managed cube;
    @managed gridModel;
    @managed cubeView;
    @managed dimManagerModel;

    @bindable fundFilter = null;

    constructor() {
        this.gridModel = this.createGridModel();
        this.cube = this.createCube();

        const cubeDims = values(this.cube.fields)
            .filter(it => it.isDimension)
            .map(it => ({value: it.name, label: it.displayName}));

        this.dimManagerModel = new DimensionManagerModel({
            dimensions: cubeDims,
            defaultDimConfig: 'cubeTestDefaultDims',
            userDimPref: 'cubeTestUserDims'
        });

        this.cubeView = new View({
            cube: this.cube,
            boundStore: this.gridModel.store,
            query: this.getQuery(),
            connect: true
        });

        this.addReaction({
            track: () => this.getQuery(),
            run: (q) => this.cubeView.setQuery(q),
            equals: comparer.structural
        });
    }

    getQuery() {
        const {dimManagerModel, fundFilter} = this,
            dimensions = dimManagerModel.value,
            filters = fundFilter ? [{name: 'fund', values: fundFilter}] : null;

        return {dimensions, filters};
    }

    async doLoadAsync() {
        const positions = await XH.portfolioService.getPositionsAsync();
        this.cube.loadData(positions, {});
    }

    createCube() {
        return new Cube({
            idSpec: XH.genId,
            fields: [
                {name: 'symbol', isDimension: true},
                {name: 'sector', isDimension: true},
                {name: 'model', isDimension: true},
                {name: 'fund', isDimension: true},
                {name: 'region', isDimension: true},
                {name: 'trader', isDimension: true},
                {name: 'mktVal', displayName: 'Market Value', aggregator: 'SUM'},
                {name: 'pnl', displayName: 'P&L', aggregator: 'SUM'}
            ]
        });
    }

    createGridModel() {
        return new GridModel({
            treeMode: true,
            sortBy: 'pnl|desc|abs',
            emptyText: 'No records found...',
            enableColChooser: true,
            enableExport: true,
            rowBorders: true,
            showHover: true,
            compact: XH.appModel.useCompactGrids,
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
                    field: 'mktVal',
                    headerName: 'Mkt Value (m)',
                    headerTooltip: 'Market value (in millions USD)',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                    renderer: millionsRenderer({
                        precision: 3,
                        ledger: true
                    })
                },
                {
                    field: 'pnl',
                    headerName: 'P&L',
                    align: 'right',
                    width: 130,
                    absSort: true,
                    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true,
                        colorSpec: true
                    })
                }, {
                    ...emptyFlexCol
                }
            ]
        });
    }
}