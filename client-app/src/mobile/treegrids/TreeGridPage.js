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
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {dimensionChooser} from '@xh/hoist/mobile/cmp/dimensionchooser';

import {TreeGridPageModel} from './TreeGridPageModel';
import {treeGridDetailPage} from './TreeGridDetailPage';

@HoistComponent
export class TreeGridPage extends Component {
    model = new TreeGridPageModel();

    render() {
        const {model} = this,
            {gridModel, loadModel, dimensionChooserModel} = model;

        return page({
            loadModel: loadModel,
            items: [
                grid({
                    model: gridModel,
                    onRowClicked: (e) => {
                        const record = e.data.raw;
                        XH.appModel.navigate(record.name, treeGridDetailPage, {record});
                    }
                }),
                toolbar(
                    dimensionChooser({model: dimensionChooserModel})
                )
            ]
        });
    }
}

export const treeGridPage = elemFactory(TreeGridPage);