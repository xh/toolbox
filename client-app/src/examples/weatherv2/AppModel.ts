import {managed, XH} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {
    autoRefreshAppOption,
    themeAppOption,
    sizingModeAppOption
} from '@xh/hoist/desktop/cmp/appOption';
import {BaseAppModel} from '../../BaseAppModel';
import {WeatherV2DashModel} from './dash/WeatherV2DashModel';

export class AppModel extends BaseAppModel {
    static instance: AppModel;
    @managed weatherV2DashModel: WeatherV2DashModel;
    @managed weatherViewManager: ViewManagerModel;
    @bindable showJsonHarness: boolean = false;

    constructor() {
        super();
        makeObservable(this);
    }

    override async initAsync() {
        await super.initAsync();

        this.weatherViewManager = await ViewManagerModel.createAsync({
            type: 'weatherDashboardV2',
            typeDisplayName: 'Layout',
            enableDefault: true,
            manageGlobal: XH.getUser().isHoistAdmin
        });

        this.weatherV2DashModel = new WeatherV2DashModel(this.weatherViewManager);
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption(), autoRefreshAppOption()];
    }
}
