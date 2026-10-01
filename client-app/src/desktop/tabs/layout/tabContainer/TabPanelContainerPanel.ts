import {div} from '@xh/hoist/cmp/layout';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../../common/Wrapper';
import {customExample} from './tabs/CustomExample';
import {dynamicExample} from './tabs/DynamicExample';
import {errorExample} from './tabs/ErrorExample';
import {groupsExample} from './tabs/GroupsExample';
import {routingExample} from './tabs/RoutingExample';
import {EXAMPLE_ROUTE, simpleExample} from './tabs/SimpleExample';
import {tabStateExample} from './tabs/TabStateExample';

export const tabPanelContainerPanel = hoistCmp.factory({
    model: creates(() => TabPanelContainerPanelModel),

    render() {
        return wrapper({
            title: 'Tabs',
            icon: Icon.tab(),
            description: [
                '`TabContainer` is configured and managed via a `TabContainerModel` and',
                'supports route-based navigation, managed mounting/unmounting of inactive',
                'tabs, automatic refreshing of a newly activated tab, and a built-in',
                '`ErrorBoundary` to prevent an unhandled error in one tab from crashing the',
                'entire app.',
                '',
                'The controls for switching tabs can be placed on any side of the container,',
                "or omitted, via the model's switcher config."
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/tabContainer/TabPanelContainerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/tab/README.md#tabcontainermodel',
                    text: 'Tabs docs',
                    notes: 'Tabbed interface guide.'
                },
                {
                    url: '$TB/client-app/src/desktop/AppModel.ts',
                    notes: 'Toolbox AppModel with top-level TabContainerModel.'
                },
                {url: '$HR/cmp/tab/TabContainer.ts', notes: 'Hoist container component.'},
                {
                    url: '$HR/cmp/tab/TabContainerModel.ts',
                    notes: 'Hoist container model - primary API and configuration point for tabs.'
                },
                {
                    url: '$HR/cmp/tab/TabModel.ts',
                    notes: 'Hoist tab model - created by TabContainerModel in its ctor from provided configs.'
                }
            ],
            item: panel({
                className: 'tb-layout-tabs',
                height: '60vh',
                width: '90%',
                item: tabContainer({switcher: {orientation: 'top', enableOverflow: true}})
            })
        });
    }
});

class TabPanelContainerPanelModel extends HoistModel {
    @managed
    tabModel = new TabContainerModel({
        route: EXAMPLE_ROUTE,
        tabs: [
            {
                id: 'top',
                title: 'Top',
                content: topExample()
            },
            {
                id: 'bottom',
                title: 'Bottom',
                content: simpleExample({orientation: 'bottom'})
            },
            {
                id: 'left',
                title: 'Left',
                content: simpleExample({orientation: 'left'})
            },
            {
                id: 'right',
                title: 'Right',
                content: simpleExample({orientation: 'right'})
            },
            {
                id: 'groups',
                title: 'Tab Groups',
                content: groupsExample()
            },
            {
                id: 'custom',
                title: 'Custom Switchers',
                content: customExample()
            },
            {
                id: 'state',
                title: 'State',
                content: tabStateExample()
            },
            {
                id: 'dynamic',
                title: 'Dynamic',
                content: dynamicExample()
            },
            {
                id: 'routing',
                title: 'Routing',
                content: routingExample()
            },
            {
                id: 'error',
                title: 'Error Boundary',
                content: errorExample()
            }
        ]
    });
}

const topExample = hoistCmp.factory(() =>
    div(
        `This overall example is a standard TabContainer with its switcher located in the default, top position. Change
        the tabs above to see examples of other TabContainer configurations.`
    )
);
