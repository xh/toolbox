import {grid} from '@xh/hoist/cmp/grid';
import {hframe, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates, XH} from '@xh/hoist/core';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';

import {CubeDataModel} from './CubeDataModel';
import {dimensionManager} from './dimensions/DimensionManager';
import {loadTimesPanel} from './LoadTimesPanel';

export const CubeDataPanel = hoistCmp({
    model: creates(CubeDataModel),

    render() {
        return panel(
            hframe({
                items: [
                    dimensionManager({icon: Icon.cube()}),
                    panel({
                        title: 'Grids › Cube Data',
                        icon: Icon.grid(),
                        flex: 1,
                        item: grid(),
                        mask: 'onLoad',
                        bbar: bbar()
                    }),
                    loadTimesPanel()
                ]
            })
        );
    }
});

const bbar = hoistCmp.factory(
    ({model}) => toolbar(
        span('w/Summary:'),
        switchInput({bind: 'showSummary'}),
        span('Leaves:'),
        switchInput({bind: 'includeLeaves'}),
        toolbarSep(),
        select({
            model,
            bind: 'fundFilter',
            options: XH.portfolioService.lookups.funds,
            placeholder: 'Fund filter...',
            enableClear: true,
            enableMulti: true,
            flex: 1
        }),
        button({
            title: 'Re-run query',
            icon: Icon.search(),
            onClick: () => model.executeQueryAsync()
        }),
        toolbarSep(),
        storeFilterField()
    )
);


