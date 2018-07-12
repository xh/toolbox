/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {hframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {wrapperPanel} from '../impl/WrapperPanel';
import './TabPanelContainer.scss';

@HoistComponent()
export class TabPanelContainerPanel extends Component {
    topModel =  this.createStandard()
    bottomModel = this.createStandard()
    leftModel =  this.createStandard()
    rightModel =  this.createStandard()
    detachedModel = this.createStandard()
    nestedModel = this.createNested()

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-tabcontainer-panel',
                title: 'TabPanel Container',
                width: 1200,
                height: 400,
                item: this.renderExample()
            })
        );
    }

    renderExample() {
        const {detachedModel, topModel, bottomModel, leftModel, rightModel, nestedModel} = this;
        return hframe({
            cls: 'xh-toolbox-example-container',
            items: [
                panel({
                    title: 'Horizontal - Top',
                    flex: 1,
                    item: tabContainer({model: topModel, switcherPosition: 'top'})
                }),
                panel({
                    title: 'Horizontal - Bottom',
                    flex: 1,
                    item: tabContainer({model: bottomModel, switcherPosition: 'bottom'})
                }),
                panel({
                    title: 'Vertical - Left',
                    flex: 1,
                    item: tabContainer({model: leftModel, switcherPosition: 'left'})
                }),
                panel({
                    title: 'Vertical - Right',
                    flex: 1,
                    item: tabContainer({model: rightModel, switcherPosition: 'right'})
                }),
                panel({
                    title: 'Nested',
                    flex: 1,
                    item: tabContainer({model: nestedModel})
                }),
                panel({
                    title: 'Custom Switcher',
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
                })
            ]
        });
    }

    createStandard(parent = null) {
        return new TabContainerModel({
            tabs: [
                {id: 'foo', content: () => parent ? parent + ' Foo' : 'Foo'},
                {id: 'bar', content: () => parent ? parent + ' Bar' : 'Bar'},
                {id: 'baz', content: () => parent ? parent + ' Baz' : 'Baz'}
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