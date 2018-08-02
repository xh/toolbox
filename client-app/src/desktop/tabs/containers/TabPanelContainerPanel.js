/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../impl/Wrapper';

@HoistComponent()
export class TabPanelContainerPanel extends Component {
    topModel =  this.createStandard()
    bottomModel = this.createStandard()
    leftModel =  this.createStandard()
    rightModel =  this.createStandard()
    detachedModel = this.createStandard()
    nestedModel = this.createNested()

    render() {
        const {detachedModel, topModel, bottomModel, leftModel, rightModel, nestedModel} = this;

        return wrapper({
            description: `
                TabContainers are configured and managed via a TabContainerModel and support 
                routing based navigation, managed mounting/unmounting of inactive tabs, and lazy 
                refreshing of its active Tab. The controls for switching tabs can be placed on 
                any side of the container, or skipped entirely.
            `,
            item: panel({
                title: 'Containers > Tabs',
                icon: Icon.tab(),
                cls: 'toolbox-containers-tabs',
                width: 600,
                height: '80%',
                overflowY: 'scroll',
                itemSpec: {
                    factory: panel,
                    margin: 10,
                    height: 280,
                    flex: 'none'
                },
                items: [
                    {
                        title: 'Top Tabs (default)',
                        item: tabContainer({model: topModel})
                    },
                    {
                        title: 'Bottom Tabs',
                        item: tabContainer({model: bottomModel, switcherPosition: 'bottom'})
                    },
                    {
                        title: 'Left Tabs',
                        item: tabContainer({model: leftModel, switcherPosition: 'left'})
                    },
                    {
                        title: 'Right Tabs',
                        item: tabContainer({model: rightModel, switcherPosition: 'right'})
                    },
                    {
                        title: 'Nested Tabs',
                        item: tabContainer({model: nestedModel})
                    },
                    {
                        title: 'Custom Switcher UI',
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
                    }
                ]
            })
        });
    }

    createStandard(parent = null) {
        const tabTxt = (title) => {
            return parent ? `${parent} > This is the ${title} tab` : `This is the ${title} tab`;
        };

        return new TabContainerModel({
            tabs: [
                {id: 'people', content: () => tabTxt('People')},
                {id: 'places', content: () => tabTxt('Places')},
                {id: 'things', content: () => tabTxt('Things')}
            ]
        });
    }

    createNested() {
        return new TabContainerModel({
            tabs: [
                {
                    id: 'apples',
                    content: () => tabContainer({model: this.createStandard('Apples'), switcherPosition: 'left'})
                },
                {
                    id: 'oranges',
                    content: () => tabContainer({model: this.createStandard('Oranges'), switcherPosition: 'left'})
                },
                {
                    id: 'bananas',
                    content: () => tabContainer({model: this.createStandard('Bananas'), switcherPosition: 'left'})
                }
            ]
        });
    }
}