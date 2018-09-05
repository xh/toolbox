/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {grid} from '@xh/hoist/mobile/cmp/grid';

import {GridPageModel} from './GridPageModel';

@HoistComponent
export class GridPage extends Component {
    localModel = new GridPageModel();

    render() {
        const {model} = this,
            {gridModel, loadModel} = model;

        return page({
            loadModel: loadModel,
            item: grid({model: gridModel})
        });
    }

}

export const gridPage = elemFactory(GridPage);