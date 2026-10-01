import type {InitContext} from '@xh/hoist/core';
import {managed, persist, XH} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {bindable} from '@xh/hoist/mobx';
import {
    autoRefreshAppOption,
    themeAppOption,
    sizingModeAppOption
} from '@xh/hoist/desktop/cmp/appOption';
import {BaseAppModel} from '../../BaseAppModel';
import {WeatherV2DashModel} from './dash/WeatherV2DashModel';
import {LlmChatService} from './svc/LlmChatService';
import {LlmToolService} from './svc/LlmToolService';
import {WeatherDataService} from './svc/WeatherDataService';
import {viewManagers} from './viewManagers';
import {initialState, viewSpecs} from './widgets/viewSpecs';

export class AppModel extends BaseAppModel {
    static instance: AppModel;
    override persistWith = {localStorageKey: 'weatherV2App'};

    @managed weatherV2DashModel: WeatherV2DashModel;
    @managed harnessPanelModel: PanelModel;
    @bindable @persist accessor manualEditingEnabled: boolean = true;
    @bindable @persist accessor showJsonHarness: boolean = false;
    @bindable @persist accessor showChatHarness: boolean = true;
    @bindable @persist accessor showWidgetChooser: boolean = false;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await XH.installServicesAsync([LlmChatService, LlmToolService, WeatherDataService], ctx);

        this.harnessPanelModel = new PanelModel({
            side: 'right',
            defaultSize: 500,
            minSize: 300,
            resizable: true,
            collapsible: false,
            persistWith: {...this.persistWith, path: 'harnessPanel'}
        });

        // Awaited here, in initAsync, so that saved layouts are loaded and the desired option
        // preselected before WeatherV2DashModel builds its DashCanvas.
        await viewManagers.initAsync(ctx);

        this.weatherV2DashModel = new WeatherV2DashModel({
            viewManagerModel: viewManagers.weatherDashboardV2,
            viewSpecs,
            initialState
        });

        this.addReaction({
            track: () => this.manualEditingEnabled,
            run: editing => {
                this.weatherV2DashModel.dashCanvasModel.showGridBackground = editing;
            },
            fireImmediately: true
        });
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption(), autoRefreshAppOption()];
    }
}
