import {grid} from '@xh/hoist/cmp/grid';
import {label} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {ActivityWidgetModel} from './ActivityWidgetModel';
import './ActivityWidget.scss';

export const activityWidget = hoistCmp.factory({
    displayName: 'ActivityWidget',
    model: creates(ActivityWidgetModel),

    render({model}) {
        return panel({
            item: grid(),
            bbar: bbar(),
            mask: 'onLoad'
        });
    }
});

const bbar = hoistCmp.factory({
    render({model}) {
        return toolbar(
            label('Repositories:'),
            select({
                bind: 'repos',
                enableMulti: true,
                flex: 1,
                options: [
                    'hoist-react',
                    'hoist-core',
                    'hoist-dev-utils',
                    'toolbox'
                ]
            })
        );
    }
});
