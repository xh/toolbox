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
import {DashCanvasViewModel} from '@xh/hoist/desktop/cmp/dash';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {modalButton} from '@xh/hoist/desktop/cmp/panel/impl/PanelHeader';

export const gridWidget = hoistCmp.factory({
    model: creates(() => GridWidgetModel),
    render({model}) {
        return panel({
            model: model.panelModel,
            item: grid()
        });
    }
});

class GridWidgetModel extends HoistModel {

    @managed gridModel;
    @managed panelModel = new PanelModel({modalView: true, collapsible: false, resizable: false});
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

        const {viewModel, gridModel, panelModel} = this;

        viewModel.setExtraMenuItems([
            {
                text: 'Autosize Columns',
                icon: Icon.arrowsLeftRight(),
                actionFn: () => gridModel.autosizeAsync()
            },
            {
                text: 'Restore Grid Defaults',
                icon: Icon.reset(),
                actionFn: () => gridModel.restoreDefaultsAsync()
            }
        ]);

        if (viewModel instanceof DashCanvasViewModel) {
            viewModel.setHeaderItems([
                colChooserButton({gridModel}),
                modalButton({panelModel})
            ]);
        }
    }

    async doLoadAsync(loadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'});

        this.gridModel.loadData(trades);
    }
}
