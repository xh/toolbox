import {grid} from '@xh/hoist/cmp/grid';
import {gridCountLabel} from '@xh/hoist/cmp/grid/helpers/GridCountLabel';
import {filler} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {gridFindField} from '@xh/hoist/desktop/cmp/grid';
import {segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {repoFilterPicker} from '../RepoFilterPicker';
import './ActivityWidget.scss';
import {ActivityWidgetModel} from './ActivityWidgetModel';

export const activityWidget = hoistCmp.factory({
    displayName: 'ActivityWidget',
    model: creates(ActivityWidgetModel),

    render() {
        return panel({
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
                repoFilterPicker(),
                toolbarSep(),
                segmentedControl({
                    bind: 'groupBy',
                    compact: true,
                    options: [
                        {value: 'committedDay', icon: Icon.calendar()},
                        {value: 'repo', icon: Icon.code()},
                        {value: 'authorName', icon: Icon.user()},
                        {value: null, label: '', icon: Icon.list()}
                    ]
                }),
                filler(),
                gridCountLabel({unit: 'commit'}),
                toolbarSep(),
                gridFindField({width: 180}),
                toolbarSep(),
                colChooserButton()
            ]
        });
    }
});
