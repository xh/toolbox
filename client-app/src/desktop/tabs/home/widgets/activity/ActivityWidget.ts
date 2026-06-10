import {grid} from '@xh/hoist/cmp/grid';
import {gridCountLabel} from '@xh/hoist/cmp/grid/helpers/GridCountLabel';
import {filler, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import './ActivityWidget.scss';
import {ActivityWidgetModel} from './ActivityWidgetModel';

export const activityWidget = hoistCmp.factory({
    displayName: 'ActivityWidget',
    model: creates(ActivityWidgetModel),

    render({model}) {
        return panel({
            tbar: toolbar({
                compact: true,
                items: [
                    Icon.icon({iconName: 'github', prefix: 'fab'}),
                    span(
                        `${model.commitCount.toLocaleString()} commits · ${model.monthCommitCount.toLocaleString()} in the last 30 days`
                    ),
                    filler()
                ]
            }),
            item: grid(),
            bbar: bbar(),
            mask: 'onLoad'
        });
    }
});

const bbar = hoistCmp.factory({
    render() {
        return toolbar({
            compact: true,
            items: [
                select({
                    width: 140,
                    bind: 'groupBy',
                    options: [
                        {value: 'committedDay', label: 'By Day'},
                        {value: 'repo', label: 'By Repo'},
                        {value: null, label: 'Ungrouped'}
                    ]
                }),
                filterChooser({placeholder: 'Filter commits...', flex: 5}),
                filler(),
                gridCountLabel({unit: 'commit'}),
                toolbarSep(),
                colChooserButton()
            ]
        });
    }
});
