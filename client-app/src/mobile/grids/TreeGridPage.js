/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {grid} from '@xh/hoist/mobile/cmp/grid';

import {TreeGridPageModel} from './TreeGridPageModel';

@HoistComponent
export class TreeGridPage extends Component {
    localModel = new TreeGridPageModel();

    render() {
        const {model} = this,
            {gridModel, loadModel} = model;

        return page({
            loadModel: loadModel,
            item: grid({
                model: gridModel,
                onRowClicked: (e) => {
                    XH.toast({
                        message: `${e.data.name} tapped!`,
                        timeout: 1000
                    });
                }
            })
        });
    }

}

export const treeGridPage = elemFactory(TreeGridPage);