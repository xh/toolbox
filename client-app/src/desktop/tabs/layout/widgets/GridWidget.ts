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
import {colChooserButton, modalToggleButton} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';

export const gridWidget = hoistCmp.factory({
    model: creates(() => GridWidgetModel),
    render({model}) {
        const {panelModel, viewModel} = model,
            modalOpts = {
                title: viewModel.title,
                icon: viewModel.icon,
                headerItems: [modalToggleButton({panelModel})]
            };

        return panel({
            model: panelModel,
            ...(panelModel.isModal ? modalOpts : {}),
            item: grid()
        });
    }
});

class GridWidgetModel extends HoistModel {
    @managed gridModel: GridModel;
    @managed panelModel = new PanelModel({
        modalSupport: true,
        showModalToggleButton: false,
        collapsible: false,
        resizable: false
    });
    @lookup(DashViewModel) viewModel;

    override onLinked() {
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
            viewModel.headerItems = [
                colChooserButton({gridModel}),
                modalToggleButton({panelModel})
            ];
        }
    }

    override async doLoadAsync(loadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'});

        this.gridModel.loadData(trades);
    }
}
