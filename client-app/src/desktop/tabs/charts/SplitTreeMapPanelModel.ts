import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {SplitTreeMapModel} from '@xh/hoist/cmp/treemap';
import {hspacer} from '@xh/hoist/cmp/layout';
import {fmtMillions} from '@xh/hoist/format';
import {mktValCol, nameCol, pnlCol} from '../../../core/columns';

export class SplitTreeMapPanelModel extends HoistModel {
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
            localStorageKey: 'splitTreeMapDims',
            persistFavorites: true
        }
    });

    @managed
    gridModel = new GridModel({
        treeMode: true,
        sortBy: 'pnl|desc|abs',
        emptyText: 'No records found...',
        selModel: 'multiple',
        levelLabels: () => this.groupingChooserModel.getLevelLabels(),
        store: {
            processRawData: r => {
                return {
                    pnlMktVal: r.pnl / Math.abs(r.mktVal),
                    ...r
                };
            },
            fields: [{name: 'pnlMktVal', type: 'number', displayName: 'P&L / Mkt Val'}]
        },
        columns: [{...nameCol, isTreeColumn: true}, {...mktValCol}, {...pnlCol}]
    });

    @managed
    splitTreeMapModel: SplitTreeMapModel = new SplitTreeMapModel({
        gridModel: this.gridModel,
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
            track: () => this.groupingChooserModel.value,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync() {
        const dims = this.groupingChooserModel.value;
        const data = await XH.portfolioService.getPositionsAsync(dims);
        this.gridModel.loadData(data);
    }
}
