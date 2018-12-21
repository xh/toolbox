import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hspacer} from '@xh/hoist/cmp/layout';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common/Wrapper';
import {switchInput, textInput} from '@xh/hoist/desktop/cmp/input';

@HoistComponent
export class TabPanelContainerPanel extends Component {
    detachedTabModel = new TabContainerModel(this.createContainerModelConfig());
    stateTabModel = new TabContainerModel(this.createContainerModelConfig());

    render() {
        const {detachedTabModel, stateTabModel} = this;

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
            item: panel({
                title: 'Containers > Tabs',
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
                                    model: this.createContainerModelConfig(),
                                    switcherPosition: 'bottom'
                                })
                            },
                            {
                                id: 'left',
                                title: 'Left Tabs',
                                content: () => tabContainer({
                                    className: 'child-tabcontainer',
                                    model: this.createContainerModelConfig(),
                                    switcherPosition: 'left'
                                })
                            },
                            {
                                id: 'right',
                                title: 'Right Tabs',
                                content: () => tabContainer({
                                    className: 'child-tabcontainer',
                                    model: this.createContainerModelConfig(),
                                    switcherPosition: 'right'
                                })
                            },
                            {
                                id: 'custom',
                                title: 'Custom Switcher',
                                content: () => panel({
                                    className: 'child-tabcontainer',
                                    tbar: toolbar(
                                        detachedTabModel.tabs.map(childModel => button({
                                            intent: childModel.isActive ? 'primary' : 'default',
                                            text: childModel.title,
                                            onClick: () => {
                                                detachedTabModel.setActiveTabId(childModel.id);
                                            }
                                        }))
                                    ),
                                    item: tabContainer({model: detachedTabModel, switcherPosition: 'none'})
                                })
                            },
                            {
                                id: 'state',
                                title: 'Tab State',
                                content: () => {
                                    const peopleTab = stateTabModel.getTabById('people'),
                                        placesTab = stateTabModel.getTabById('places');

                                    return panel({
                                        className: 'child-tabcontainer',
                                        bbar: toolbar(
                                            switchInput({
                                                model: peopleTab,
                                                field: 'disabled',
                                                label: 'People Disabled?'
                                            }),
                                            hspacer(10),
                                            'Places Tab Title: ',
                                            textInput({
                                                model: placesTab,
                                                field: 'title'
                                            })
                                        ),
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

    createContainerModelConfig() {
        const tabTxt = title => `This is the ${title} tab`;
        return {
            tabs: [
                {id: 'people', content: () => tabTxt('People')},
                {id: 'places', content: () => tabTxt('Places')},
                {id: 'things', content: () => tabTxt('Things')}
            ]
        };
    }
}