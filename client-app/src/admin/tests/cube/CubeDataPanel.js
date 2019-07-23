import {grid} from '@xh/hoist/cmp/grid';
import {filler, hframe, span} from '@xh/hoist/cmp/layout';
import {HoistComponent, XH} from '@xh/hoist/core';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
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
            {gridModel, dimManagerModel, loadModel, loadTimesGridModel} = model;

        return panel({
            mask: loadModel,
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
                        item: grid({model: gridModel, agOptions}),
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
                            toolbarSep(),
                            span(' >100m Mkt Value:'),
                            switchInput({model, bind: 'highMktVal'}),
                            select({
                                model,
                                bind: 'fundFilter',
                                options: XH.portfolioService.funds,
                                placeholder: 'Fund filter...',
                                enableClear: true,
                                enableMulti: true,
                                flex: 1
                            }),
                            button({
                                title: 'Re-run query',
                                icon: Icon.search(),
                                onClick: () => model.executeQueryAsync()
                            }),
                            toolbarSep(),
                            storeFilterField({gridModel})
                        )
                    }),
                    panel({
                        title: 'Run Times',
                        icon: Icon.clock(),
                        model: {
                            side: 'right',
                            defaultSize: 260
                        },
                        item: grid({model: loadTimesGridModel, hideHeaders: true}),
                        bbar: [
                            filler(),
                            button({
                                title: 'Clear timings',
                                icon: Icon.reset({className: 'xh-red'}),
                                onClick: () => model.clearLoadTimes()
                            }),
                            toolbarSep(),
                            storeFilterField({gridModel: loadTimesGridModel})
                        ]
                    })
                ]
            })
        });
    }

    agOptions = {
        groupDefaultExpanded: 1
    }
}