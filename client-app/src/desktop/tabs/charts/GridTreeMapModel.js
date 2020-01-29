import {XH, HoistModel, managed} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {GridModel, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {DimensionChooserModel} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {TreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {clamp} from 'lodash';

@HoistModel
@LoadSupport
export class GridTreeMapModel {

    @managed
    dimChooserModel = new DimensionChooserModel({
        dimensions: [
            {value: 'region', label: 'Region'},
            {value: 'sector', label: 'Sector'},
            {value: 'symbol', label: 'Symbol'}
        ],
        initialValue: ['sector', 'symbol']
    });

    @managed
    gridModel = new GridModel({
        treeMode: true,
        sortBy: 'pnl|desc|abs',
        emptyText: 'No records found...',
        compact: XH.appModel.gridSizingMode,
        selModel: 'multiple',
        store: {
            processRawData: (r) => {
                return {
                    pnlMktVal: clamp(r.pnl / Math.abs(r.mktVal), -1, 1),
                    ...r
                };
            },
            fields: [
                {name: 'pnl', label: 'P&L'},
                {name: 'pnlMktVal', label: 'P&L / Mkt Val'}
            ]
        },
        columns: [
            {
                headerName: 'Name',
                width: 200,
                field: 'name',
                isTreeColumn: true
            },
            {
                field: 'mktVal',
                headerName: 'Mkt Value (m)',
                align: 'right',
                width: 130,
                absSort: true,
                renderer: millionsRenderer({
                    precision: 3,
                    ledger: true
                })
            },
            {
                headerName: 'P&L',
                field: 'pnl',
                align: 'right',
                width: 130,
                absSort: true,
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true
                })
            },
            {...emptyFlexCol}
        ]
    });

    @managed
    treeMapModel = new TreeMapModel({
        gridModel: this.gridModel,
        colorMode: 'balanced',
        labelField: 'name',
        valueField: 'pnl',
        heatField: 'pnlMktVal'
    });

    constructor() {
        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: () => this.loadAsync()
        });
    }

    async doLoadAsync() {
        const dims = this.dimChooserModel.value;
        const data = await XH.portfolioService.getPositionsAsync(dims);
        this.gridModel.loadData(data);
    }

}
