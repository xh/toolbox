import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {elemFactory} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {splitTreeMap} from '@xh/hoist/desktop/cmp/treemap';

@HoistComponent
export class SplitTreeMapPanel extends Component {

    render() {
        const {model} = this,
            {splitTreeMapModel, panelSizingModel} = model;

        return panel({
            title: panelSizingModel.collapsed ? 'Treemap' : null,
            model: panelSizingModel,
            item: splitTreeMap({
                model: splitTreeMapModel
            })
        });
    }
}

export const splitTreeMapPanel = elemFactory(SplitTreeMapPanel);

