import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {LoadTimesModel} from './LoadTimesModel';

export const loadTimesPanel = hoistCmp.factory({
    model: uses(LoadTimesModel),

    render({model}) {
        return panel({
            title: 'Run Times',
            icon: Icon.clock(),
            modelConfig: {
                side: 'right',
                defaultCollapsed: true,
                defaultSize: 260
            },
            item: grid(),
            bbar: [
                filler(),
                button({
                    title: 'Clear timings',
                    icon: Icon.reset({className: 'xh-red'}),
                    onClick: () => model.clearLoadTimes()
                }),
                toolbarSep(),
                storeFilterField()
            ]
        });
    }
});
