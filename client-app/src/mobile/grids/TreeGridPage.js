/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {menu, MenuModel} from '@xh/hoist/mobile/cmp/menu';
import {menuButton} from '@xh/hoist/mobile/cmp/button';
import {grid} from '@xh/hoist/cmp/grid';
import {div, span} from '@xh/hoist/cmp/layout';
import {dimChooser} from '@xh/hoist/mobile/cmp/dimChooser'
import {toolbar} from '@xh/hoist/kit/onsen';
import {select} from '@xh/hoist/mobile/cmp/form'



import './TreeGridPage.scss'

import {TreeGridPageModel} from './TreeGridPageModel';

@HoistComponent
export class TreeGridPage extends Component {
    localModel = new TreeGridPageModel();

    render() {
        const {model} = this,
            {gridModel, loadModel, menuModel} = model;
        console.log(menuModel);
        return page({
            loadModel: loadModel,
            items: [
                grid({
                    model: gridModel,
                    onRowClicked: (e) => {
                        XH.toast({
                            message: `${e.data.name} tapped!`,
                            timeout: 1000
                        });
                    }
                }),
                div({
                    className: 'dim-chooser-bar',
                    items: [
                        dimChooser({
                            model: menuModel
                        })
                    ]
                }),
            ]
        });
    }
}

export const treeGridPage = elemFactory(TreeGridPage);