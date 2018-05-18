/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from 'hoist/core';
import {hframe, box} from 'hoist/cmp/layout';
import {tabContainer, TabContainerModel} from 'hoist/cmp/tab';
import {panel} from 'hoist/cmp/panel';
import {wrapperPanel} from '../impl/WrapperPanel';
import './TabPanelContainer.scss';

@HoistComponent()
export class TabPanelContainerPanel extends Component {
    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-tabcontainer-panel',
                title: 'TabPanel Container',
                width: 700,
                height: 400,
                item: this.renderExample()
            })
        );
    }

    renderExample() {
        const hModel = new TabContainerModel({
                id: 'horizontal',
                orientation: 'h',
                children: this.createStandard()
            }),
            vModel = new TabContainerModel({
                id: 'horizontal',
                orientation: 'v',
                children: this.createStandard()
            }),
            nModel = new TabContainerModel({
                id: 'horizontal',
                orientation: 'h',
                children: this.createNested()
            });

        return hframe({
            cls: 'xh-toolbox-example-container',
            items: [
                panel({
                    title: 'Horizontal',
                    flex: 1,
                    item: tabContainer({model: hModel})
                }),
                panel({
                    title: 'Vertical',
                    flex: 1,
                    item: tabContainer({model: vModel})
                }),
                panel({
                    title: 'Nested',
                    flex: 1,
                    item: tabContainer({model: nModel})
                })
            ]
        });
    }

    createStandard() {
        return [
            {
                id: 'foo',
                component: class extends Component { render() {return 'Foo'}}
            },
            {
                id: 'bar',
                component: class extends Component { render() {return 'Bar'}}

            },
            {
                id: 'baz',
                component: class extends Component { render() {return 'Baz'}}
            }
        ];
    }

    createNested() {
        return [
            {
                id: 'foo',
                orientation: 'v',
                children: [
                    {id: 'Child 1', component: class extends Component { render() { return box('Foo - Child 1')}}},
                    {id: 'Child 2', component: class extends Component { render() { return box('Foo - Child 2')}}}
                ]
            },
            {
                id: 'bar',
                orientation: 'v',
                children: [
                    {id: 'Child 1', component: class extends Component { render() { return box('Bar - Child 1')}}},
                    {id: 'Child 2', component: class extends Component { render() { return box('Bar - Child 2')}}}
                ]
            },
            {
                id: 'baz',
                orientation: 'v',
                children: [
                    {id: 'Child 1', component: class extends Component { render() { return box('Baz - Child 1')}}},
                    {id: 'Child 2', component: class extends Component { render() { return box('Baz - Child 2')}}}
                ]
            }
        ];
    }
}