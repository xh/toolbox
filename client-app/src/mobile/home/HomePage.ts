import {div, p, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {isEmpty} from 'lodash';
import {HomeModel} from './HomeModel';
import {manageWidgetsSheet} from './ManageWidgetsSheet';
import {widgetCard} from './widgets/WidgetCard';
import './HomePage.scss';

/**
 * Mobile home dashboard - a personalizable vertical stack of widget cards. Each card carries a quiet
 * collapsible header; the app-bar pencil opens the {@link manageWidgetsSheet} to toggle membership
 * and reorder. Widget membership, order, and collapsed state persist per user via {@link HomeModel}.
 */
export const homePage = hoistCmp.factory({
    displayName: 'HomePage',
    model: uses(HomeModel),

    render({model}) {
        return panel({
            className: 'tb-home',
            children: div({
                className: 'tb-home__frame',
                children: [
                    div({
                        className: 'tb-home__stack xh-tiled-bg',
                        children: isEmpty(model.dashboardWidgets) ? emptyState() : stack({model})
                    }),
                    manageWidgetsSheet()
                ]
            })
        });
    }
});

const stack = hoistCmp.factory<HomeModel>(({model}) =>
    div({
        className: 'tb-home__cards',
        children: model.dashboardWidgets.map(w =>
            widgetCard({
                key: w.id,
                title: w.title,
                icon: w.icon,
                collapsed: model.isCollapsed(w.id),
                onToggleCollapsed: () => model.toggleCollapsed(w.id),
                children: w.content()
            })
        )
    })
);

const emptyState = hoistCmp.factory(() =>
    vbox({
        className: 'tb-home__empty',
        children: [
            Icon.gridLarge({size: '3x'}),
            p('Your home is empty.'),
            p({
                className: 'tb-home__empty-hint',
                children: ['Tap ', Icon.edit(), ' in the app bar to add widgets.']
            })
        ]
    })
);
