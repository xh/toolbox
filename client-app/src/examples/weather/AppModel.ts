import {managed, XH} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {
    autoRefreshAppOption,
    themeAppOption,
    sizingModeAppOption
} from '@xh/hoist/desktop/cmp/appOption';
import {BaseAppModel} from '../../BaseAppModel';
import {WeatherDashModel} from './WeatherDashModel';

export class AppModel extends BaseAppModel {
    static instance: AppModel;
    @managed weatherDashModel: WeatherDashModel;
    @managed weatherViewManager: ViewManagerModel;

    override async initAsync() {
        await super.initAsync();

        this.weatherViewManager = await ViewManagerModel.createAsync({
            type: 'weatherDashboard',
            typeDisplayName: 'Layout',
            enableDefault: true,
            manageGlobal: XH.getUser().isHoistAdmin
        });

        this.weatherDashModel = new WeatherDashModel(this.weatherViewManager);
        this.loadAsync();
    }

    override async doLoadAsync(loadSpec) {
        await this.weatherDashModel.loadAsync(loadSpec);
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption(), autoRefreshAppOption()];
    }
}
