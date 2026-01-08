import {isEmpty} from 'lodash';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {
    buttonWidget,
    chartWidget,
    errorWidget,
    gridWidget,
    panelWidget,
    treeGridWidget
} from '../widgets';

export class DashCanvasPanelModel extends HoistModel {
    @bindable renderDashboard = true;
    @observable.ref allSymbols: string[] = [];

    @managed
    @observable.ref
    dashCanvasModel: DashCanvasModel;

    override async doLoadAsync(loadSpec) {
        if (isEmpty(this.allSymbols)) {
            const symbols = await XH.portfolioService.getSymbolsAsync({loadSpec});
            runInAction(() => {
                this.allSymbols = symbols.slice(0, 5);
                this.dashCanvasModel = this.createDashCanvasModel();
            });
        }
    }

    constructor() {
        super();
        makeObservable(this);
    }

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
            persistWith: {localStorageKey: 'dashCanvasExampleState'},
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
                    content: treeGridWidget,
                    width: 12,
                    height: 8,
                    groupName: 'Grid Widgets'
                },
                {
                    id: 'buttons',
                    title: 'Buttons',
                    icon: Icon.stop(),
                    content: buttonWidget,
                    width: 4,
                    height: 2,
                    allowRename: false,
                    hideMenuButton: true
                },
                {
                    id: 'chart',
                    title: 'Multi-Chart',
                    icon: Icon.chartLine(),
                    unique: true,
                    content: chartWidget,
                    width: 12,
                    height: 5
                },
                ...this.allSymbols.map(symbol => ({
                    id: 'singleSeriesChart-' + symbol,
                    title: symbol + ' Chart',
                    groupName: 'Single Series Charts',
                    icon: Icon.chartLine(),
                    unique: true,
                    content: chartWidget,
                    width: 12,
                    height: 5
                })),
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
            w: 4,
            h: 3
        },
        viewSpecId: 'buttons',
        title: 'Buttons 1',
        state: {
            value: 'Button 1'
        }
    },
    {
        layout: {
            x: 4,
            y: 5,
            w: 4,
            h: 3
        },
        viewSpecId: 'buttons',
        title: 'Buttons 2',
        state: {
            value: 'Button 2'
        }
    },
    {
        layout: {
            x: 8,
            y: 5,
            w: 4,
            h: 3
        },
        viewSpecId: 'buttons',
        title: 'Buttons 3',
        state: {
            value: 'Button 3'
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
