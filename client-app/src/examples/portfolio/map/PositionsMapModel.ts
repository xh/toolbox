import {GridModel} from '@xh/hoist/cmp/grid';
import {hspacer} from '@xh/hoist/cmp/layout';
import {HoistModel, managed} from '@xh/hoist/core';
import {SplitTreeMapModel} from '@xh/hoist/cmp/treemap';
import {fmtMillions} from '@xh/hoist/format';
import {PortfolioModel} from '../PortfolioModel';

export class PositionsMapModel extends HoistModel {
    readonly parentModel: PortfolioModel;

    @managed splitTreeMapModel: SplitTreeMapModel;

    constructor({parentModel, gridModel}: {parentModel: PortfolioModel; gridModel: GridModel}) {
        super();
        this.parentModel = parentModel;

        this.splitTreeMapModel = new SplitTreeMapModel({
            gridModel,
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
