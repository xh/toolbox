import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {TreeMapModel} from '@xh/hoist/cmp/treemap';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {mktValCol, nameCol, pnlCol} from '../../../core/columns';

export class GridTreeMapModel extends HoistModel {
    @bindable cluster = false;

    @managed
    groupingChooserModel = new GroupingChooserModel({
        dimensions: ['region', 'sector', 'symbol'],
        initialValue: ['sector', 'symbol'],
        initialFavorites: [
            ['sector', 'symbol'],
            ['region', 'sector', 'symbol'],
            ['region', 'symbol'],
            ['sector'],
            ['symbol']
        ],
        persistWith: {
            localStorageKey: 'gridTreeMapDims',
            persistFavorites: true
        }
    });

    @managed
    gridModel = new GridModel({
        treeMode: true,
        sortBy: 'pnl|desc|abs',
        emptyText: 'No records found...',
        selModel: 'multiple',
        store: {
            processRawData: r => {
                return {
                    pnlMktVal: r.pnl / Math.abs(r.mktVal),
                    ...r
                };
            },
            fields: [{name: 'pnlMktVal', type: 'number', displayName: 'P&L / Mkt Val'}]
        },
        levelLabels: () => this.groupingChooserModel.valueDisplayNames,
        columns: [{...nameCol, isTreeColumn: true}, {...mktValCol}, {...pnlCol}]
    });

    @managed
    treeMapModel = new TreeMapModel({
        gridModel: this.gridModel,
        maxHeat: 1,
        colorMode: 'linear',
        labelField: 'name',
        valueField: 'pnl',
        heatField: 'pnlMktVal'
    });

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.groupingChooserModel.value,
            run: () => this.loadAsync()
        });
        this.addReaction({
            track: () => this.cluster,
            run: enableCluster => {
                this.treeMapModel.highchartsConfig = {
                    plotOptions: {
                        treemap: {
                            cluster: {
                                enabled: enableCluster,
                                minimumClusterSize: 2,
                                pixelWidth: 50,
                                pixelHeight: 50
                            }
                        }
                    }
                };
            }
        });
    }

    override async doLoadAsync() {
        const dims = this.groupingChooserModel.value;
        const data = await XH.portfolioService.getPositionsAsync(dims);
        this.gridModel.loadData(data);
    }
}
