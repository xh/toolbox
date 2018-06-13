/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {box, hframe, panel} from '@xh/hoist/cmp/layout';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {toolbar} from '@xh/hoist/cmp/toolbar';
import {button} from '@xh/hoist/kit/blueprint';
import {wrapperPanel} from '../impl/WrapperPanel';
import './TabPanelContainer.scss';

@HoistComponent()
export class TabPanelContainerPanel extends Component {
    topModel = new TabContainerModel({
        id: 'horizontal-top',
        switcherPosition: 'top',
        children: this.createStandard()
    });

    bottomModel = new TabContainerModel({
        id: 'horizontal-bottom',
        switcherPosition: 'bottom',
        children: this.createStandard()
    });

    leftModel = new TabContainerModel({
        id: 'vertical-left',
        switcherPosition: 'left',
        children: this.createStandard()
    });

    rightModel = new TabContainerModel({
        id: 'vertical-right',
        switcherPosition: 'right',
        children: this.createStandard()
    });

    nModel = new TabContainerModel({
        id: 'nested',
        children: this.createNested()
    });

    detachedModel = new TabContainerModel({
        id: 'detached',
        switcherPosition: 'none',
        children: this.createStandard()
    });


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
        return hframe({
            cls: 'xh-toolbox-example-container',
            items: [
                panel({
                    title: 'Horizontal - Top',
                    flex: 1,
                    item: tabContainer({model: this.topModel})
                }),
                panel({
                    title: 'Horizontal - Bottom',
                    flex: 1,
                    item: tabContainer({model: this.bottomModel})
                }),
                panel({
                    title: 'Vertical - Left',
                    flex: 1,
                    item: tabContainer({model: this.leftModel})
                }),
                panel({
                    title: 'Vertical - Right',
                    flex: 1,
                    item: tabContainer({model: this.rightModel})
                }),
                panel({
                    title: 'Nested',
                    flex: 1,
                    item: tabContainer({model: this.nModel})
                }),
                panel({
                    title: 'Detached Switcher',
                    tbar: toolbar(
                        this.detachedModel.children.map(childModel => button({
                            intent: this.detachedModel.selectedId === childModel.id ? 'primary' : 'default',
                            text: childModel.name,
                            onClick: () => {
                                this.detachedModel.setSelectedId(childModel.id);
                            }
                        }))
                    ),
                    item: tabContainer({model: this.detachedModel})
                })
            ]
        });
    }

    createStandard() {
        return [
            {
                id: 'foo',
                name: 'Foo',
                component: class extends Component { render() {return 'Foo'}}
            },
            {
                id: 'bar',
                name: 'Bar',
                component: class extends Component { render() {return 'Bar'}}
            },
            {
                id: 'baz',
                name: 'Baz',
                component: class extends Component { render() {return 'Baz'}}
            }
        ];
    }

    createNested() {
        return [
            {
                id: 'foo',
                switcherPosition: 'left',
                children: [
                    {id: 'Child 1', component: class extends Component { render() { return box('Foo - Child 1')}}},
                    {id: 'Child 2', component: class extends Component { render() { return box('Foo - Child 2')}}}
                ]
            },
            {
                id: 'bar',
                switcherPosition: 'left',
                children: [
                    {id: 'Child 1', component: class extends Component { render() { return box('Bar - Child 1')}}},
                    {id: 'Child 2', component: class extends Component { render() { return box('Bar - Child 2')}}}
                ]
            },
            {
                id: 'baz',
                switcherPosition: 'left',
                children: [
                    {id: 'Child 1', component: class extends Component { render() { return box('Baz - Child 1')}}},
                    {id: 'Child 2', component: class extends Component { render() { return box('Baz - Child 2')}}}
                ]
            }
        ];
    }

}