import {Component} from 'react';
import {XH, HoistComponent, elemFactory, LoadSupport} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {grid} from '@xh/hoist/cmp/grid';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {filler} from '@xh/hoist/cmp/layout';
import {colChooserButton} from '@xh/hoist/mobile/cmp/button';

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
            items: [
                grid({
                    model: gridModel,
                    onRowClicked: (e) => {
                        const {id} = e.data.raw;
                        XH.appendRoute('gridDetail', {id});
                    }
                }),
                // Todo: page.bbar
                toolbar(
                    filler(),
                    colChooserButton({
                        text: 'Choose Columns',
                        model: gridModel
                    })
                )
            ]
        });
    }
}
export const gridPage = elemFactory(GridPage);