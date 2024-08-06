import {HoistAppModel, XH} from '@xh/hoist/core';

export class BaseAppModel extends HoistAppModel {
    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }

    override async initAsync() {
        await super.initAsync();
        XH.fetchService.autoGenCorrelationIds = true;
    }
}
