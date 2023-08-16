import {creates, hoistCmp, HoistModel, lookup, managed} from '@xh/hoist/core';
import {sampleTreeGrid} from '../../../common';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {DashCanvasViewModel, DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {modalToggleButton} from '@xh/hoist/desktop/cmp/button';

export const treeGridWidget = hoistCmp.factory({
    model: creates(() => TreeGridWidgetModel),
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
            item: sampleTreeGrid({modelConfig: {includeCheckboxes: false}})
        });
    }
});

class TreeGridWidgetModel extends HoistModel {
    @managed panelModel = new PanelModel({
        modalSupport: true,
        showModalToggleButton: false,
        collapsible: false,
        resizable: false
    });

    @lookup(DashViewModel) viewModel;

    override onLinked() {
        const {viewModel, panelModel} = this;

        if (viewModel instanceof DashCanvasViewModel) {
            viewModel.headerItems = [modalToggleButton({panelModel})];
        }
    }
}
