import {HoistModel, managed, XH} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {GridModel, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {View} from '@xh/hoist/data/cube';
import {comparer, bindable} from '@xh/hoist/mobx';

import {Cube} from '@xh/hoist/data/cube';
import {DimensionChooserModel} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {numberRenderer, millionsRenderer, fmtNumberTooltip} from '@xh/hoist/format';

@HoistModel
@LoadSupport
export class CubeDataModel {

    @managed
    gridModel = this.createGridModel();

    @managed
    cube = new Cube({
        idSpec: XH.genId,
        fields: [
            {name: 'symbol', isDimension: true},
            {name: 'sector', isDimension: true},
            {name: 'model', isDimension: true},
            {name: 'fund', isDimension: true},
            {name: 'region', isDimension: true},
            {name: 'trader', isDimension: true},
            {name: 'mktVal', isDimension: false, aggregator: 'SUM'},
            {name: 'pnl', isDimension: false, aggregator: 'SUM'}
        ]
    });

    @managed
    dimChooserModel = new DimensionChooserModel({
        dimensions: [
            {value: 'fund', label: 'Fund'},
            {value: 'model', label: 'Model'},
            {value: 'region', label: 'Region'},
            {value: 'sector', label: 'Sector'},
            {value: 'symbol', label: 'Symbol'},
            {value: 'trader', label: 'Trader'}
        ],
        historyPreference: 'portfolioDimHistory'
    });

    @bindable
    fundFilter = null;
    
    @managed
    cubeView = new View({
        cube: this.cube,
        boundStore: this.gridModel.store,
        query: {
            filters: [],
            dimensions: this.dimChooserModel.value,
            includeRoot: false,
            includeLeaves: false
        },
        connect: true
    });


    getQuery() {
        const {dimChooserModel, fundFilter} = this,
            dimensions = dimChooserModel.value,
            filters = [
                {name: 'fund', values: fundFilter}
            ];

        return {dimensions, filters};
    }

    constructor() {
        this.addReaction({
            track: () => this.getQuery(),
            run: (q) => this.cubeView.setQuery(q),
            equals: comparer.structural
        });
    }

    async doLoadAsync() {
        const positions = await XH.portfolioService.getPositionsAsync();
        this.cube.loadData(positions, {});

        window.cube = this.cube;
        window.cubeView = this.cubeView;
    }

    createGridModel() {
        return new GridModel({
            store: {
                idSpec: 'id'
            },
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