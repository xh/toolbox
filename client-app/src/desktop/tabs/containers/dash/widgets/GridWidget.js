import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
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
} from '../../../../../core/columns';

export const gridWidget = hoistCmp.factory({
    model: creates(() => new LocalModel()),
    render() {
        return grid();
    }
});

class LocalModel extends HoistModel {

    @managed gridModel;

    onLinked() {
        const {viewModel} = this.componentProps;

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