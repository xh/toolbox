import {creates, hoistCmp, lookup, HoistModel, managed, XH} from '@xh/hoist/core';
import {grid} from '@xh/hoist/cmp/grid';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash/DashViewModel';
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
    model: creates(() => GridWidgetModel),
    render() {
        return grid();
    }
});

class GridWidgetModel extends HoistModel {

    @managed gridModel;
    @lookup(DashViewModel) viewModel;

    onLinked() {
        this.gridModel = new GridModel({
            sortBy: 'profit_loss|desc|abs',
            colChooserModel: true,
            persistWith: {dashViewModel: this.viewModel},
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
