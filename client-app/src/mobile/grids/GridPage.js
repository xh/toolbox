import {Component} from 'react';
import {XH, HoistComponent, elemFactory, LoadSupport} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {grid} from '@xh/hoist/cmp/grid';

import {GridPageModel} from './GridPageModel';

@HoistComponent
@LoadSupport
export class GridPage extends Component {

    model = new GridPageModel();

    render() {
        const {model} = this,
            {gridModel, loadModel} = model;

        return page({
            loadModel,
            item: grid({
                model: gridModel,
                onRowClicked: (e) => {
                    const {id} = e.data.raw;
                    XH.appendRoute('gridDetail', {id});
                }
            })
        });
    }
}
export const gridPage = elemFactory(GridPage);