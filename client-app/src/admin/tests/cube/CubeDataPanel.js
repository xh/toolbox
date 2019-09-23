import {grid} from '@xh/hoist/cmp/grid';
import {filler, hframe, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates, XH} from '@xh/hoist/core';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';

import {CubeDataModel} from './CubeDataModel';
import {dimensionManager} from './dimensions/DimensionManager';

export const CubeDataPanel = hoistCmp({
    model: creates(CubeDataModel),

    render({model}) {
        const {gridModel, loadModel, dimManagerModel, loadTimesGridModel} = model;

        return panel({
            mask: loadModel,
            item: hframe({
                items: [
                    dimensionManager({
                        model: dimManagerModel,
                        icon: Icon.cube()
                    }),
                    panel({
                        title: 'Grids › Cube Data',
                        icon: Icon.grid(),
                        flex: 1,
                        item: grid({model: gridModel}),
                        bbar: toolbar(
                            span('Root:'),
                            switchInput({bind: 'includeRoot'}),
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
                            storeFilterField({gridModel})
                        )
                    }),
                    panel({
                        title: 'Run Times',
                        icon: Icon.clock(),
                        model: {
                            side: 'right',
                            defaultSize: 260
                        },
                        item: grid({model: loadTimesGridModel, hideHeaders: true}),
                        bbar: [
                            filler(),
                            button({
                                title: 'Clear timings',
                                icon: Icon.reset({className: 'xh-red'}),
                                onClick: () => model.clearLoadTimes()
                            }),
                            toolbarSep(),
                            storeFilterField({gridModel: loadTimesGridModel})
                        ]
                    })
                ]
            })
        });
    }
});