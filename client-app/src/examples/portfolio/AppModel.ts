import {HoistAppModel, XH} from '@xh/hoist/core';
import {themeAppOption, sizingModeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {Icon} from '@xh/hoist/icon';
import {OauthService} from '../../core/svc/OauthService';
import {PortfolioService} from '../../core/svc/PortfolioService';

export const PERSIST_MAIN = {localStorageKey: 'portfolioAppMainState'};
export const PERSIST_DETAIL = {localStorageKey: 'portfolioAppDetailState'};

export class AppModel extends HoistAppModel {
    static instance: AppModel;

    static override async preAuthAsync() {
        await XH.installServicesAsync(OauthService);
    }

    override async initAsync() {
        XH.fetchService.enableCorrelationIds('toolbox-portfolio');
        await XH.installServicesAsync(PortfolioService);

        this.addReaction({
            track: () => XH.webSocketService.connected,
            run: () => this.updateWebsocketAlertBanner()
        });
    }

    override async logoutAsync() {
        await XH.oauthService.logoutAsync();
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption()];
    }

    override get supportsVersionBar(): boolean {
        return window.self === window.top;
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
