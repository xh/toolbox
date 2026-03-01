import {managed, persist, XH} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {
    autoRefreshAppOption,
    themeAppOption,
    sizingModeAppOption
} from '@xh/hoist/desktop/cmp/appOption';
import {BaseAppModel} from '../../BaseAppModel';
import {WeatherV2DashModel} from './dash/WeatherV2DashModel';
import {LlmChatService} from './svc/LlmChatService';
import {WeatherDataService} from './svc/WeatherDataService';

export class AppModel extends BaseAppModel {
    static instance: AppModel;
    override persistWith = {localStorageKey: 'weatherV2App'};

    @managed weatherV2DashModel: WeatherV2DashModel;
    @managed weatherViewManager: ViewManagerModel;
    @managed harnessPanelModel: PanelModel;
    @persist @bindable showJsonHarness: boolean = false;
    @persist @bindable showChatHarness: boolean = true;
    @persist @bindable showWidgetChooser: boolean = false;

    constructor() {
        super();
        makeObservable(this);
    }

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(LlmChatService, WeatherDataService);

        this.harnessPanelModel = new PanelModel({
            side: 'right',
            defaultSize: 500,
            minSize: 300,
            resizable: true,
            collapsible: false,
            persistWith: {...this.persistWith, path: 'harnessPanel'}
        });

        this.weatherViewManager = await ViewManagerModel.createAsync({
            type: 'weatherDashboardV2',
            typeDisplayName: 'Layout',
            enableDefault: true,
            enableAutoSave: false,
            manageGlobal: XH.getUser().isHoistAdmin
        });

        this.weatherV2DashModel = new WeatherV2DashModel(this.weatherViewManager);
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption(), autoRefreshAppOption()];
    }
}
