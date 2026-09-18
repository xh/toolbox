import {hspacer} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {
    SplitTreeMapModel,
    TreeMapAlgorithm,
    TreeMapColorMode,
    TreeMapModel
} from '@xh/hoist/cmp/treemap';
import {Store} from '@xh/hoist/data';
import {fmtMillions} from '@xh/hoist/format';
import {bindable} from '@xh/hoist/mobx';

export class TreeMapPageModel extends HoistModel {
    @bindable accessor type: 'treeMap' | 'splitTreeMap' = 'treeMap';

    // Display options applied live to both the simple and split maps.
    @bindable accessor colorMode: TreeMapColorMode = 'linear';
    @bindable accessor algorithm: TreeMapAlgorithm = 'squarified';

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

    @managed
    splitTreeMapModel: SplitTreeMapModel = new SplitTreeMapModel({
        store: this.store,
        maxHeat: 1,
        colorMode: 'linear',
        labelField: 'name',
        valueField: 'pnl',
        heatField: 'pnlMktVal',
        mapTitleFn: (model, isPrimary) => {
            return [
                isPrimary ? 'Profit:' : 'Loss:',
                hspacer(5),
                fmtMillions(model.total, {
                    prefix: '$',
                    precision: 2,
                    label: true
                })
            ];
        }
    });

    constructor() {
        super();
        this.addReaction({
            track: () => [this.colorMode, this.algorithm] as const,
            run: ([colorMode, algorithm]) => {
                this.treeMapModel.colorMode = colorMode;
                this.treeMapModel.algorithm = algorithm;
                // SplitTreeMapModel exposes colorMode/algorithm as read-only getters; its setter
                // methods fan the change out to both the primary and secondary child maps.
                this.splitTreeMapModel.setColorMode(colorMode);
                this.splitTreeMapModel.setAlgorithm(algorithm);
            },
            fireImmediately: true
        });
    }

    override async doLoadAsync() {
        const data = await XH.portfolioService.getPositionsAsync(['symbol']);
        this.store.loadData(data);
    }
}
