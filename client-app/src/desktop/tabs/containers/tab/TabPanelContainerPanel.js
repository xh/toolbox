import React from 'react';
import {div} from '@xh/hoist/cmp/layout';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, managed, hoistCmp, HoistModel} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../../common';
import {dynamicExample, tabStateExample, customExample, simpleExample} from './tabs';

export const tabPanelContainerPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render() {
        return wrapper({
            description: [
                <p>
                    TabContainers are configured and managed via a TabContainerModel and support
                    routing-based navigation, managed mounting/unmounting of inactive tabs, and lazy
                    refreshing of its active Tab.
                </p>,
                <p>
                    The controls for switching tabs can be placed on any side of the container,
                    or omitted entirely via the <code>switcher</code> prop.
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/containers/TabPanelContainerPanel.js', notes: 'This example.'},
                {url: '$TB/client-app/src/desktop/AppModel.js', notes: 'Toolbox AppModel with top-level TabContainerModel.'},
                {url: '$HR/cmp/tab/TabContainer.js', notes: 'Hoist container component.'},
                {url: '$HR/cmp/tab/TabContainerModel.js', notes: 'Hoist container model - primary API and configuration point for tabs.'},
                {url: '$HR/cmp/tab/TabModel.js', notes: 'Hoist tab model - created by TabContainerModel in its ctor from provided configs.'}
            ],
            item: panel({
                title: 'Containers › Tabs',
                icon: Icon.tab(),
                className: 'toolbox-containers-tabs',
                width: 700,
                height: 400,
                item: tabContainer()
            })
        });
    }
});

class Model extends HoistModel {
    @managed
    tabModel = new TabContainerModel({
        persistWith: {localStorageKey: 'tabExampleState'},
        tabs: [
            {
                id: 'top',
                title: 'Top Tabs',
                content: topExample()
            },
            {
                id: 'bottom',
                title: 'Bottom Tabs',
                content: simpleExample({orientation: 'bottom'})
            },
            {
                id: 'left',
                title: 'Left Tabs',
                content: simpleExample({orientation: 'left'})
            },
            {
                id: 'right',
                title: 'Right Tabs',
                content: simpleExample({orientation: 'right'})
            },
            {
                id: 'custom',
                title: 'Custom Switcher',
                content: customExample()
            },
            {
                id: 'state',
                title: 'Tab State',
                content: tabStateExample()
            },
            {
                id: 'dynamic',
                title: 'Dynamic',
                content: dynamicExample()
            }
        ]
    });
}

const topExample = hoistCmp.factory(
    () => div(
        `This overall example is a standard TabContainer with its switcher located in the default, top position. Change 
        the tabs above to see examples of other TabContainer configurations.`
    )
);