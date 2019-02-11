import {Component} from 'react';
import {XH, HoistComponent, elemFactory, LoadSupport} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {grid} from '@xh/hoist/cmp/grid';

import {GridPageModel} from './GridPageModel';
import {gridDetailPage} from './GridDetailPage';

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
                    const record = e.data.raw;
                    XH.appModel.navigate(record.company, gridDetailPage, {record});
                }
            })
        });
    }
}
export const gridPage = elemFactory(GridPage);