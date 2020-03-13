import React from 'react';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';

import {wrapper, sampleGrid, SampleGridModel} from '../../common';

export const externalSortGridPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    Grids can optionally manage their sort externally. In the below example, we react to
                    <code>GridModel.sortBy</code> to offload sorting to external logic.
                </p>,
                <p>
                    Similar patterns could be used to offload sorting to the server or to support
                    "max rows" constraints that respect both sorting and filtering.
                </p>
            ],
            item: panel({
                title: 'Grids › External Sort',
                icon: Icon.gridPanel(),
                className: 'tb-grid-wrapper-panel',
                item: sampleGrid({model})
            })
        });
    }
});

class Model extends SampleGridModel {

    @bindable.ref trades;
    @bindable.ref summary;

    constructor() {
        super({
            experimental: {
                externalSort: true
            }
        });

        this.addReaction({
            track: () => [this.trades, this.summary, this.gridModel.sortBy],
            run: () => this.sortAndLoadGridData()
        });
    }

    async doLoadAsync(loadSpec) {
        const {trades, summary} = await XH.fetchJson({url: 'trade'});
        this.setTrades(trades);
        this.setSummary(summary);
    }

    sortAndLoadGridData() {
        const {trades, summary, gridModel} = this,
            {sortBy} = gridModel,
            data = [...trades];

        // Sort according to GridModel.sortBy[]
        sortBy.forEach(it => {
            const compFn = it.comparator.bind(it),
                direction = it.sort === 'desc' ? -1 : 1;

            data.sort((a, b) => compFn(a[it.colId], b[it.colId]) * direction);
        });

        // Show only top 50 records
        gridModel.loadData(data.slice(0, 50), summary);

        if (gridModel.agGridModel.isReady && !gridModel.hasSelection) gridModel.selectFirst();
    }
}