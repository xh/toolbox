import {HoistModel} from '@xh/hoist/core';
import {managed} from '@xh/hoist/core';
import {hspacer} from '@xh/hoist/cmp/layout';
import {fmtMillions} from '@xh/hoist/format';
import {SplitTreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';

@HoistModel
export class SplitTreeMapPanelModel {

    @managed splitTreeMapModel;

    @managed panelSizingModel = new PanelModel({
        defaultSize: 1000,
        side: 'right'
    });

    constructor({gridModel}) {
        this.splitTreeMapModel = new SplitTreeMapModel({
            gridModel,
            mapFilter: rec => rec.pnl >= 0,
            mapTitleFn: (mapName, model) => {
                const isPrimary = mapName === 'primary',
                    v = isPrimary ? model.primaryMapTotal : model.secondaryMapTotal;
                return [
                    isPrimary ? 'Profit:' : 'Loss:',
                    hspacer(5),
                    fmtMillions(v, {
                        prefix: '$',
                        precision: 2,
                        label: true,
                        asElement: true
                    })
                ];
            },

            labelField: 'name',
            valueField: 'pnl',
            heatField: 'pnl',
            valueFieldLabel: 'Pnl',

            orientation: 'horizontal'
        });
    }

    get isResizing() {
        return this.panelSizingModel.isResizing;
    }
}