import {HoistAppModel, XH} from '@xh/hoist/core';
import {OauthService} from '../../core/svc/OauthService';
import {ChatGptService} from '../../core/svc/ChatGptService';
import {PortfolioService} from '../../core/svc/PortfolioService';

export class AppModel extends HoistAppModel {
    static instance: AppModel;

    static override async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }

    override async initAsync() {
        await XH.installServicesAsync(ChatGptService, PortfolioService);
    }
}
