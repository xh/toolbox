import {grid} from '@xh/hoist/cmp/grid';
import {gridCountLabel} from '@xh/hoist/cmp/grid/helpers/GridCountLabel';
import {filler, p, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import './ActivityWidget.scss';
import {ActivityWidgetModel} from './ActivityWidgetModel';
import {errorMessage} from '@xh/hoist/desktop/cmp/error';
import {XH} from '@xh/hoist/core/XH';

export const activityWidget = hoistCmp.factory({
    displayName: 'ActivityWidget',
    model: creates(ActivityWidgetModel),

    render({model}) {
        let errorThrown = model.githubErrorThrown;
        if (errorThrown && !errorThrown['isRoutine']) {
            XH.handleException(errorThrown, {showAlert: false, showAsError: false});
        }

        return panel({
            items: [
                gitHubErrorPanel({error: errorThrown}),
                vframe({
                    omit: !!errorThrown,
                    item: grid()
                })
            ],
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

const gitHubErrorPanel = hoistCmp.factory(({error}) => {
    return errorMessage({
        omit: !error,
        error: error,
        title: 'Error loading GitHub panel',
        message: error?.['isRoutine']
            ? p(error?.['message'])
            : 'A non-routine exception occurred when loading this panel. Please try again later.'
    });
});
