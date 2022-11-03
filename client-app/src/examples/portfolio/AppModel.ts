import {HoistAppModel, initServicesAsync, XH} from '@xh/hoist/core';
import {themeAppOption, sizingModeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {Icon} from '@xh/hoist/icon';
import {OauthService} from '../../core/svc/OauthService';
import {PortfolioService} from '../../core/svc/PortfolioService';

export let App: AppModel;
export const PERSIST_MAIN = {localStorageKey: 'portfolioAppMainState'};
export const PERSIST_DETAIL = {localStorageKey: 'portfolioAppDetailState'};

export class AppModel extends HoistAppModel {

    static oauthService: OauthService;
    portfolioService: PortfolioService;

    static async preAuthAsync() {
        await initServicesAsync(OauthService, this);
    }

    override async initAsync() {
        App = this;
        await this.initServicesAsync(PortfolioService);

        this.addReaction({
            track: () => XH.webSocketService.connected,
            run: () => this.updateWebsocketAlertBanner()
        });
    }

    override async logoutAsync() {
        await AppModel.oauthService.logoutAsync();
    }

    override getAppOptions() {
        return [
            themeAppOption(),
            sizingModeAppOption()
        ];
    }

    private updateWebsocketAlertBanner() {
        const {connected} = XH.webSocketService,
            category = 'wsAlert';

        if (!connected) {
            XH.showBanner({
                category,
                icon: Icon.warning(),
                intent: 'warning',
                message: 'Realtime connection to the server dropped - will attempt to reconnect...',
                actionButtonProps: {
                    icon: Icon.refresh(),
                    text: 'Reload App',
                    onClick: () => XH.reloadApp()
                }
            });
        } else {
            XH.hideBanner(category);
        }
    }
}
