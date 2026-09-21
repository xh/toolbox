import type {InitContext, LoadSpec} from '@xh/hoist/core';
import {managed} from '@xh/hoist/core';
import {
    autoRefreshAppOption,
    themeAppOption,
    sizingModeAppOption
} from '@xh/hoist/desktop/cmp/appOption';
import {BaseAppModel} from '../../BaseAppModel';
import {WeatherDashModel} from './WeatherDashModel';
import {viewManagers} from './viewManagers';

export class AppModel extends BaseAppModel {
    static instance: AppModel;
    @managed weatherDashModel: WeatherDashModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);

        // Awaited here, in initAsync, so that saved layouts are loaded and the desired option
        // preselected before WeatherDashModel builds its DashCanvas.
        await viewManagers.initAsync(ctx);

        this.weatherDashModel = new WeatherDashModel(viewManagers.weatherDashboard);
        this.loadAsync(ctx);
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        return this.weatherDashModel.loadAsync(loadSpec);
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption(), autoRefreshAppOption()];
    }
}
