import React from 'react';
import {hoistComponent, useModel, localModel, managed, HoistModel} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hspacer} from '@xh/hoist/cmp/layout';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common/Wrapper';
import {switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {find} from 'lodash';

export const TabPanelContainerPanel = hoistComponent({
    model: localModel(() => new Model()),

    render() {
        const model = useModel(),
            {stateTabModel, detachedTabModel} = model;

        return wrapper({
            description: [
                <p>
                    TabContainers are configured and managed via a TabContainerModel and support
                    routing based navigation, managed mounting/unmounting of inactive tabs, and lazy
                    refreshing of its active Tab.
                </p>,
                <p>
                    The controls for switching tabs can be placed on any side of the container,
                    or omitted entirely via the <code>switcherPosition</code> prop.
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
                item: tabContainer({
                    model: {
                        tabs: [
                            {
                                id: 'top',
                                title: 'Top Tabs',
                                content: () => `
                                    This overall example is a standard TabContainer with its switcher located in the default,
                                    top position. Change the tabs above to see examples of other TabContainer configurations.
                                `
                            },
                            {
                                id: 'bottom',
                                title: 'Bottom Tabs',
                                content: () => tabContainer({
                                    className: 'child-tabcontainer',
                                    model: model.createContainerModelConfig({switcherPosition: 'bottom'})
                                })
                            },
                            {
                                id: 'left',
                                title: 'Left Tabs',
                                content: () => tabContainer({
                                    className: 'child-tabcontainer',
                                    model: model.createContainerModelConfig({switcherPosition: 'left'})
                                })
                            },
                            {
                                id: 'right',
                                title: 'Right Tabs',
                                content: () => tabContainer({
                                    className: 'child-tabcontainer',
                                    model: model.createContainerModelConfig({switcherPosition: 'right'})
                                })
                            },
                            {
                                id: 'custom',
                                title: 'Custom Switcher',
                                content: () => panel({
                                    className: 'child-tabcontainer',
                                    tbar: model.detachedTabModel.tabs.map(childModel => button({
                                        intent: childModel.isActive ? 'primary' : 'default',
                                        text: childModel.title,
                                        onClick: () => {
                                            detachedTabModel.setActiveTabId(childModel.id);
                                        }
                                    })),
                                    item: tabContainer({model: detachedTabModel})
                                })
                            },
                            {
                                id: 'state',
                                title: 'Tab State',
                                content: () => {
                                    const {tabs} = stateTabModel,
                                        peopleTab = find(tabs, {id: 'people'}),
                                        placesTab = find(tabs, {id: 'places'});

                                    return panel({
                                        className: 'child-tabcontainer',
                                        bbar: [
                                            switchInput({
                                                model: peopleTab,
                                                bind: 'disabled',
                                                label: 'People Disabled?'
                                            }),
                                            hspacer(10),
                                            'Places Tab Title: ',
                                            textInput({
                                                model: placesTab,
                                                bind: 'title'
                                            })
                                        ],
                                        item: tabContainer({model: stateTabModel})
                                    });
                                }
                            }
                        ]
                    }
                })
            })
        });
    }
});


@HoistModel
class Model {

    @managed
    detachedTabModel = new TabContainerModel(this.createContainerModelConfig({switcherPosition: 'none'}));

    @managed
    stateTabModel = new TabContainerModel(this.createContainerModelConfig({}));


    createContainerModelConfig(args) {
        const tabTxt = title => `This is the ${title} tab`;
        return {
            tabs: [
                {
                    id: 'people',
                    icon: Icon.user(),
                    content: () => tabTxt('People')
                },
                {
                    id: 'places',
                    icon: Icon.home(),
                    content: () => tabTxt('Places')
                },
                {
                    id: 'things',
                    icon: Icon.portfolio(),
                    content: () => tabTxt('Things')
                }
            ],
            ...args
        };
    }
}