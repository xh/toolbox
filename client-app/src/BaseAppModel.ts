import {HoistAppModel, XH} from '@xh/hoist/core';
import {AuthService} from './core/svc/AuthService';

export class BaseAppModel extends HoistAppModel {
    static override async preAuthAsync() {
        await XH.installServicesAsync(AuthService);
    }

    override async logoutAsync() {
        return XH.authService.logoutAsync();
    }

    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }
}
