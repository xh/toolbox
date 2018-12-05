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
import {div} from '@xh/hoist/cmp/layout';
import {dimensionChooser} from '@xh/hoist/mobile/cmp/dimensionchooser';

import './TreeGridPage.scss';

import {TreeGridPageModel} from './TreeGridPageModel';

@HoistComponent
export class TreeGridPage extends Component {
    localModel = new TreeGridPageModel();

    render() {
        const {model} = this,
            {gridModel, loadModel, dimensionChooserModel} = model;
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
                        dimensionChooser({
                            model: dimensionChooserModel
                        })
                    ]
                })
            ]
        });
    }
}

export const treeGridPage = elemFactory(TreeGridPage);