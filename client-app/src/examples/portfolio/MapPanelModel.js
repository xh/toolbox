import {HoistModel} from '@xh/hoist/core';
import {managed} from '@xh/hoist/core';
import {hspacer} from '@xh/hoist/cmp/layout';
import {fmtMillions} from '@xh/hoist/format';
import {SplitTreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';

@HoistModel
export class MapPanelModel {

    @managed splitTreeMapModel;

    @managed panelSizingModel = new PanelModel({
        defaultSize: 1000,
        side: 'right',
        prefName: 'portfolioMapPanelConfig'
    });

    constructor({parentModel}) {
        this.splitTreeMapModel = new SplitTreeMapModel({
            gridModel: parentModel.gridPanelModel.gridModel,
            mapTitleFn: (model, isPrimary) => {
                return [
                    isPrimary ? 'Profit:' : 'Loss:',
                    hspacer(5),
                    fmtMillions(model.total, {
                        prefix: '$',
                        precision: 2,
                        label: true,
                        asElement: true
                    })
                ];
            },

            labelField: 'name',
            valueField: 'pnl',
            heatField: 'pnlMktVal',
            orientation: 'horizontal'
        });
    }
}