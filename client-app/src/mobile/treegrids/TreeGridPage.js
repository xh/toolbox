/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {grid} from '@xh/hoist/cmp/grid';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {filler} from '@xh/hoist/cmp/layout';
import {dimensionChooser} from '@xh/hoist/mobile/cmp/dimensionchooser';
import {colChooserButton} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';

import {TreeGridPageModel} from './TreeGridPageModel';

@HoistComponent
export class TreeGridPage extends Component {
    model = new TreeGridPageModel();

    render() {
        const {model} = this,
            {gridModel, loadModel, dimensionChooserModel} = model;

        return page({
            title: 'Tree Grids',
            icon: Icon.grid(),
            mask: loadModel,
            item: grid({
                model: gridModel,
                onRowClicked: (e) => {
                    const id = encodeURIComponent(e.data.raw.id);
                    XH.appendRoute('treeGridDetail', {id});
                }
            }),
            bbar: toolbar(
                dimensionChooser({model: dimensionChooserModel}),
                filler(),
                colChooserButton({gridModel})
            )
        });
    }
}

export const treeGridPage = elemFactory(TreeGridPage);