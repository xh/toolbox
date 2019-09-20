import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';

import {page} from '@xh/hoist/mobile/cmp/page';
import {dataView} from '@xh/hoist/cmp/dataview';
import {refreshButton} from '@xh/hoist/mobile/cmp/button';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

import {DataViewPageModel} from './DataViewPageModel';

@HoistComponent
export class DataViewPage extends Component {

    model = new DataViewPageModel();

    render() {
        const {model} = this,
            {dataViewModel, loadModel} = model;

        return page({
            title: 'DataView',
            icon: Icon.addressCard(),
            mask: loadModel,
            item: dataView({
                model: dataViewModel,
                rowCls: 'dataview-item',
                itemHeight: 70
            }),
            bbar: [
                filler(),
                refreshButton({
                    text: 'Load new (random) records',
                    model
                })
            ]
        });
    }
}

export const dataViewPage = elemFactory(DataViewPage);