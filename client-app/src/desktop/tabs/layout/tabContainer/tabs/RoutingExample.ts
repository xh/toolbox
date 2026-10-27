import {code, div, filler, p, vframe} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {omit} from 'lodash';
import {EXAMPLE_ROUTE} from './SimpleExample';

const BASE_ROUTE = `${EXAMPLE_ROUTE}.routing`;

/**
 * Routed TabContainer, nested within the (also routed) outer example container. Each tab owns an
 * `?item` route param - see the matching route definitions in the desktop AppModel.
 */
export const routingExample = hoistCmp.factory(() =>
    panel({
        className: 'tb-layout-tabs__child',
        item: tabContainer({
            modelConfig: {
                route: BASE_ROUTE,
                tabs: [
                    {
                        id: 'people',
                        icon: Icon.user(),
                        content: () =>
                            routedItemPanel({tabId: 'people', options: ['Ann', 'Bob', 'Cat']})
                    },
                    {
                        id: 'places',
                        icon: Icon.location(),
                        content: () =>
                            routedItemPanel({tabId: 'places', options: ['Paris', 'Oslo', 'Rome']})
                    }
                ]
            }
        }),
        bbar: [filler(), 'Route:', code(XH.routerState?.path)]
    })
);

const routedItemPanel = hoistCmp.factory({
    model: creates(() => RoutedItemModel),

    render({model}) {
        return vframe({
            alignItems: 'center',
            justifyContent: 'center',
            className: 'xh-pad',
            gap: true,
            items: [
                div({
                    style: {maxWidth: 500},
                    items: [
                        p(
                            'The selection is synced with an ',
                            code('item'),
                            " param on this tab's own route. Both tabs declare it, but each owns " +
                                'its own value and deliberately do not influence each other.'
                        ),
                        p(
                            "The container remembers each tab's own route params and restores " +
                                'them on return, so this selection survives a round trip to the ' +
                                'other tab. Configure ',
                            code('restoreTabRouteParams: false'),
                            ' to return to the bare route instead.'
                        )
                    ]
                }),
                select({bind: 'item', options: model.options, placeholder: 'Select...', width: 150})
            ]
        });
    }
});

class RoutedItemModel extends HoistModel {
    @bindable accessor item: string = null;

    get options(): string[] {
        return this.componentProps.options;
    }

    get route(): string {
        return `${BASE_ROUTE}.${this.componentProps.tabId}`;
    }

    override onLinked() {
        // Route is the source of truth - a missing param clears the selection.
        this.addReaction(
            {
                track: () => XH.routerState,
                run: () => this.syncFromRoute(),
                fireImmediately: true
            },
            {
                track: () => this.item,
                run: () => this.syncToRoute()
            }
        );
    }

    private syncFromRoute() {
        if (!this.isRouteActive) return;
        this.item = XH.routerState.params.item ?? null;
    }

    private syncToRoute() {
        const {item, route} = this;
        if (!this.isRouteActive) return;

        const {params} = XH.routerState;
        if ((params.item ?? null) === item) return;
        XH.navigate(route, item ? {...params, item} : omit(params, 'item'), {replace: true});
    }

    private get isRouteActive(): boolean {
        return XH.router.isActive(this.route, XH.routerState?.params);
    }
}
