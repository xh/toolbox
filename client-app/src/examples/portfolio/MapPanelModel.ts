import {HoistModel, lookup, managed} from '@xh/hoist/core';
import {hspacer} from '@xh/hoist/cmp/layout';
import {fmtMillions} from '@xh/hoist/format';
import {SplitTreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {GridPanelModel} from './GridPanelModel';

export class MapPanelModel extends HoistModel {
    @lookup(GridPanelModel) gridPanelModel: GridPanelModel;
    @managed splitTreeMapModel: SplitTreeMapModel;

    override onLinked() {
        this.splitTreeMapModel = new SplitTreeMapModel({
            gridModel: this.gridPanelModel.gridModel,
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
