import {grid} from '@xh/hoist/cmp/grid';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {HoistComponent, XH} from '@xh/hoist/core';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {Component} from 'react';

import {CubeDataModel} from './CubeDataModel';
import {dimensionManager} from './dimensions/DimensionManager';

@HoistComponent
export class CubeDataPanel extends Component {

    model = new CubeDataModel();

    render() {
        const {model, agOptions} = this,
            {gridModel, dimManagerModel} = model;

        return panel({
            mask: model.loadModel,
            item: hframe({
                items: [
                    dimensionManager({
                        model: dimManagerModel,
                        icon: Icon.cube()
                    }),
                    panel({
                        title: 'Grids › Cube Data',
                        icon: Icon.grid(),
                        flex: 1,
                        item: grid({model: gridModel, agOptions})
                    })

                ]
            }),
            bbar: toolbar(
                refreshButton({
                    text: 'Reload cube',
                    model
                }),
                filler(),
                select({
                    model,
                    bind: 'fundFilter',
                    options: XH.portfolioService.funds,
                    placeholder: 'Fund filter...',
                    enableClear: true
                }),
                toolbarSep(),
                storeFilterField({gridModel})
            )
        });
    }

    agOptions = {
        groupDefaultExpanded: 1
    }
}