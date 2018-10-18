/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {grid} from '@xh/hoist/cmp/grid';

import {GridPageModel} from './GridPageModel';

@HoistComponent
export class GridPage extends Component {
    localModel = new GridPageModel();

    render() {
        const {model} = this,
            {gridModel, loadModel} = model;

        return page({
            loadModel: loadModel,
            item: grid({
                model: gridModel,
                onRowClicked: (e) => {
                    XH.toast({
                        message: `${e.data.company} tapped!`,
                        timeout: 1000
                    });
                }
            })
        });
    }

}

export const gridPage = elemFactory(GridPage);