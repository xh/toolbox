import {HoistModel, managed, XH} from '@xh/hoist/core';
import {TreeMapModel} from '@xh/hoist/cmp/treemap';
import {Store} from '@xh/hoist/data';
import {bindable} from '@xh/hoist/mobx';

export class SimpleTreeMapModel extends HoistModel {
    @bindable accessor cluster = false;
    @bindable accessor clusterWidthThreshold = 10;
    @bindable accessor clusterHeightThreshold = 10;

    @managed
    store = new Store({
        processRawData: r => {
            return {
                pnlMktVal: r.pnl / Math.abs(r.mktVal),
                ...r
            };
        },
        fields: [
            {name: 'name', type: 'string'},
            {name: 'pnl', type: 'number', displayName: 'P&L'},
            {name: 'pnlMktVal', type: 'number', displayName: 'P&L / Mkt Val'}
        ]
    });

    @managed
    treeMapModel = new TreeMapModel({
        store: this.store,
        maxHeat: 1,
        colorMode: 'linear',
        labelField: 'name',
        valueField: 'pnl',
        heatField: 'pnlMktVal'
    });

    constructor() {
        super();
        this.addReaction({
            track: () => [this.cluster, this.clusterWidthThreshold, this.clusterHeightThreshold],
            run: ([enableCluster, clusterWidthThreshold, clusterHeightThreshold]) => {
                this.treeMapModel.highchartsConfig = {
                    plotOptions: {
                        treemap: {
                            cluster: {
                                enabled: enableCluster,
                                pixelWidth: clusterWidthThreshold,
                                pixelHeight: clusterHeightThreshold
                            }
                        }
                    }
                };
            }
        });
    }

    override async doLoadAsync() {
        const data = await XH.portfolioService.getPositionsAsync(['symbol']);
        this.store.loadData(data);
    }
}
