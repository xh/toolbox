import {div} from '@xh/hoist/cmp/layout';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {wrapper} from '../../../common';
import {customExample, dynamicExample, errorExample, simpleExample, tabStateExample} from './tabs';

export const tabPanelContainerPanel = hoistCmp.factory({
    model: creates(() => TabPanelContainerPanelModel),

    render() {
        return wrapper({
            description: [
                <p>
                    <code>TabContainer</code> is configured and managed via a{' '}
                    <code>TabContainerModel</code> and supports route-based navigation, managed
                    mounting/unmounting of inactive tabs, automatic refreshing of a newly activated
                    tab, and a built-in <code>ErrorBoundary</code> to prevent an unhandled error in
                    one tab from crashing the entire app.
                </p>,
                <p>
                    The controls for switching tabs can be placed on any side of the container, or
                    omitted, via the model's <code>switcher</code> config.
                </p>
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/tabContainer/TabPanelContainerPanel.tsx',
                    notes: 'This example.'
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
                title: 'Layout › Tabs',
                icon: Icon.tab(),
                className: 'tb-layout-tabs',
                width: 750,
                height: 400,
                item: tabContainer()
            })
        });
    }
});

class TabPanelContainerPanelModel extends HoistModel {
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
