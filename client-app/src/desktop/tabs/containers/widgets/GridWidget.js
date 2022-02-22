import {hoistCmp, HoistModel, managed, useLocalModel, XH} from '@xh/hoist/core';
import {grid} from '@xh/hoist/cmp/grid';
import {GridModel} from '@xh/hoist/cmp/grid';
import {
    activeCol,
    cityCol,
    companyCol,
    profitLossCol,
    tradeDateCol,
    tradeVolumeCol,
    winLoseCol
} from '../../../../core/columns';

export const gridWidget = hoistCmp.factory({
    render({viewModel}) {
        const model = useLocalModel(() => new LocalModel(viewModel));
        return grid({model: model.gridModel});
    }
});

class LocalModel extends HoistModel {

    viewModel;
    @managed gridModel;

    constructor(viewModel) {
        super();
        this.viewModel = viewModel;

        this.gridModel = new GridModel({
            sortBy: 'profit_loss|desc|abs',
            colChooserModel: true,
            persistWith: {dashViewModel: viewModel},
            columns: [
                {
                    field: 'id',
                    headerName: 'ID',
                    hidden: true
                },
                {...companyCol},
                {...winLoseCol, hidden: true},
                {...cityCol},
                {...tradeVolumeCol},
                {...profitLossCol},
                {...tradeDateCol},
                {...activeCol}
            ]
        });

    }

    async doLoadAsync(loadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'});

        this.gridModel.loadData(trades);
    }
}
