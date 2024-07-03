import {HoistAppModel} from '@xh/hoist/core';

export class BaseAppModel extends HoistAppModel {
    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }
}
