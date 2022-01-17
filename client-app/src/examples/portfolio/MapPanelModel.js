import {HoistModel, managed} from '@xh/hoist/core';
import {hspacer} from '@xh/hoist/cmp/layout';
import {fmtMillions} from '@xh/hoist/format';
import {SplitTreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {GridPanelModel} from './GridPanelModel';

export class MapPanelModel extends HoistModel {

    @managed splitTreeMapModel;

    onLinked() {
        const gridPanelModel = this.lookupModel(GridPanelModel);
        this.splitTreeMapModel = new SplitTreeMapModel({
            gridModel: gridPanelModel.gridModel,
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
            maxHeat: 1.0,
            heatField: 'pnlMktVal',
            orientation: 'vertical'
        });
    }
}