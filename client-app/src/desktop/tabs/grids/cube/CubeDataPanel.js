import {grid} from '@xh/hoist/cmp/grid';
import {filler, hframe, span} from '@xh/hoist/cmp/layout';
import {HoistComponent, XH} from '@xh/hoist/core';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {mask} from '@xh/hoist/desktop/cmp/mask';
import {Component} from 'react';

import {CubeDataModel} from './CubeDataModel';
import {dimensionManager} from './dimensions/DimensionManager';

@HoistComponent
export class CubeDataPanel extends Component {

    model = new CubeDataModel();

    render() {
        const {model, agOptions} = this,
            {gridModel, dimManagerModel, loadModel, loadTimesGridModel} = model;

        return panel({
            mask: mask({
                model: loadModel,
                spinner: true
            }),
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
                    }),
                    panel({
                        title: 'Timings (ms)',
                        icon: Icon.clock(),
                        model: {
                            side: 'right',
                            defaultSize: 220
                        },
                        item: grid({model: loadTimesGridModel, hideHeaders: true})
                    })
                ]
            }),
            bbar: toolbar(
                numberInput({
                    model,
                    bind: 'orderCount',
                    enableShorthandUnits: true,
                    selectOnFocus: true,
                    width: 80
                }),
                span('orders'),
                toolbarSep(),
                span('Root:'),
                switchInput({model, bind: 'includeRoot'}),
                span('Leaves:'),
                switchInput({model, bind: 'includeLeaves'}),
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