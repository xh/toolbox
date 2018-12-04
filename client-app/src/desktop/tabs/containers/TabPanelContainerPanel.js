import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common/Wrapper';

@HoistComponent
export class TabPanelContainerPanel extends Component {
    topModel =  this.createTopModel()

    render() {
        const {topModel} = this;

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
                item: tabContainer({model: topModel})
            })
        });
    }

    createTopModel() {
        const detachedModel = this.createContainerModel();

        const intro = `
            This overall example is a standard TabContainer with its switcher located in the default,
            top position. Change the tabs above to see examples of other TabContainer configurations.
        `;

        return new TabContainerModel({
            tabs: [
                {
                    id: 'top',
                    title: 'Top Tabs',
                    content: () => intro
                },
                {
                    id: 'bottom',
                    title: 'Bottom Tabs',
                    content: () => {
                        return tabContainer({
                            className: 'child-tabcontainer',
                            model: this.createContainerModel(),
                            switcherPosition: 'bottom'
                        });
                    }
                },
                {
                    id: 'left',
                    title: 'Left Tabs',
                    content: () => {
                        return tabContainer({
                            className: 'child-tabcontainer',
                            model: this.createContainerModel(),
                            switcherPosition: 'left'
                        });
                    }
                },
                {
                    id: 'right',
                    title: 'Right Tabs',
                    content: () => {
                        return tabContainer({
                            className: 'child-tabcontainer',
                            model: this.createContainerModel(),
                            switcherPosition: 'right'
                        });
                    }
                },
                {
                    id: 'custom',
                    title: 'Custom Switcher',
                    content: () => {
                        return panel({
                            className: 'child-tabcontainer',
                            tbar: toolbar(
                                detachedModel.tabs.map(childModel => button({
                                    intent: childModel.isActive ? 'primary' : 'default',
                                    text: childModel.title,
                                    onClick: () => {
                                        detachedModel.setActiveTabId(childModel.id);
                                    }
                                }))
                            ),
                            item: tabContainer({model: detachedModel, switcherPosition: 'none'})
                        });
                    }
                }
            ]
        });
    }

    createContainerModel() {
        const tabTxt = title => `This is the ${title} tab`;
        return new TabContainerModel({
            tabs: [
                {id: 'people', content: () => tabTxt('People')},
                {id: 'places', content: () => tabTxt('Places')},
                {id: 'things', content: () => tabTxt('Things')}
            ]
        });
    }
}