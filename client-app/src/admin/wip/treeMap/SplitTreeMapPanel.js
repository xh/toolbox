import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hframe, hspacer} from '@xh/hoist/cmp/layout';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {grid} from '@xh/hoist/cmp/grid';
import {splitTreeMap} from '@xh/hoist/desktop/cmp/treemap';
import {fmtMillions} from '@xh/hoist/format';

import {SplitTreeMapPanelModel} from './SplitTreeMapPanelModel';

@HoistComponent
export class SplitTreeMapPanel extends Component {

    model = new SplitTreeMapPanelModel();

    render() {
        const {model} = this,
            {loadModel, dimChooserModel, gridModel, splitTreeMapModel} = model;

        return panel({
            mask: loadModel,
            bbar: [dimensionChooser({model: dimChooserModel})],
            items: hframe(
                panel({
                    model: {defaultSize: 480, side: 'left'},
                    item: grid({model: gridModel})
                }),
                splitTreeMap({
                    model: splitTreeMapModel,
                    regionTitleRenderer: (v, region) => {
                        return [
                            region === 'primary' ? 'Profit:' : 'Loss:',
                            hspacer(5),
                            fmtMillions(v, {
                                prefix: '$',
                                precision: 2,
                                label: true,
                                asElement: true
                            })
                        ];
                    }
                })
            )
        });
    }

}