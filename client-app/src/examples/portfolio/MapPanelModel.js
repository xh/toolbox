import {HoistModel, managed} from '@xh/hoist/core';
import {hspacer} from '@xh/hoist/cmp/layout';
import {fmtMillions} from '@xh/hoist/format';
import {SplitTreeMapModel} from '@xh/hoist/desktop/cmp/treemap';

export class MapPanelModel extends HoistModel {

    @managed splitTreeMapModel;

    constructor({parentModel}) {
        super();
        this.splitTreeMapModel = new SplitTreeMapModel({
            gridModel: parentModel.gridPanelModel.gridModel,
            mapTitleFn: (model, isPrimary) => {
                return [
                    isPrimary ? 'Profit:' : 'Loss:',
                    hspacer(5),
                    fmtMillions(model.total, {
                        prefix: '$',
                        precision: 2,
                        label: true
                    })
                ];
            },
            labelField: 'name',
            valueField: 'pnl',
            maxHeat: 1.0,
            heatField: 'pnlMktVal',
            orientation: 'vertical'
        });
    }
}