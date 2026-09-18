import {HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {
    optionsWidget,
    chartWidget,
    errorWidget,
    gridWidget,
    panelWidget,
    treeGridWidget
} from '../widgets';

export class DashCanvasPanelModel extends HoistModel {
    @bindable accessor renderDashboard = true;
    @bindable accessor showWidgetChooser = true;

    @managed
    dashCanvasModel = this.createDashCanvasModel();

    clearCanvas() {
        this.dashCanvasModel.viewModels.forEach(it => this.dashCanvasModel.removeView(it.id));
        XH.toast({message: 'All views removed.'});
    }

    resetState() {
        this.dashCanvasModel.restoreDefaults();
        XH.toast({message: 'Dash state reset to default'});
    }

    private createDashCanvasModel() {
        return new DashCanvasModel({
            persistWith: {localStorageKey: 'dashCanvasExampleStateV2'},
            allowsDrop: true,
            initialState,
            viewSpecDefaults: {
                icon: Icon.gridPanel()
            },
            viewSpecs: [
                {
                    id: 'grid',
                    title: 'Grid',
                    unique: true,
                    content: gridWidget,
                    width: 6,
                    height: 5,
                    groupName: 'Grid Widgets'
                },
                {
                    id: 'treeGrid',
                    title: 'Tree Grid',
                    icon: Icon.treeList(),
                    content: treeGridWidget,
                    width: 12,
                    height: 8,
                    groupName: 'Grid Widgets'
                },
                {
                    id: 'options',
                    title: 'Options',
                    icon: Icon.settings(),
                    content: optionsWidget,
                    width: 4,
                    height: 2,
                    allowRename: false,
                    hideMenuButton: true
                },
                {
                    id: 'chart',
                    title: 'Live Chart',
                    icon: Icon.chartLine(),
                    unique: true,
                    content: chartWidget,
                    width: 12,
                    height: 5
                },
                {
                    id: 'panel',
                    title: 'Panel',
                    icon: Icon.window(),
                    content: panelWidget
                },
                {
                    id: 'error',
                    title: 'Error Example',
                    icon: Icon.skull(),
                    unique: true,
                    content: errorWidget({componentName: 'DashCanvas'})
                }
            ]
        });
    }
}

const initialState = [
    {
        layout: {
            x: 0,
            y: 0,
            w: 12,
            h: 5
        },
        viewSpecId: 'chart'
    },
    {
        layout: {
            x: 0,
            y: 5,
            w: 6,
            h: 3
        },
        viewSpecId: 'options',
        title: 'Options 1',
        state: {
            value: 'Live'
        }
    },
    {
        layout: {
            x: 6,
            y: 5,
            w: 6,
            h: 3
        },
        viewSpecId: 'options',
        title: 'Options 2',
        state: {
            value: 'Daily'
        }
    },
    {
        layout: {
            x: 9,
            y: 8,
            w: 3,
            h: 4
        },
        viewSpecId: 'panel'
    },
    {
        layout: {
            x: 0,
            y: 8,
            w: 9,
            h: 7
        },
        viewSpecId: 'treeGrid'
    },
    {
        layout: {
            x: 0,
            y: 15,
            w: 6,
            h: 6
        },
        viewSpecId: 'error'
    }
];
