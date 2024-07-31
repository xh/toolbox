import {XH} from '@xh/hoist/core';
import {themeAppOption, sizingModeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {Icon} from '@xh/hoist/icon';
import {PortfolioService} from '../../core/svc/PortfolioService';
import {BaseAppModel} from '../../BaseAppModel';

export const PERSIST_MAIN = {localStorageKey: 'portfolioAppMainState'};
export const PERSIST_DETAIL = {localStorageKey: 'portfolioAppDetailState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(PortfolioService);

        this.addReaction({
            track: () => XH.webSocketService.connected,
            run: () => this.updateWebsocketAlertBanner()
        });
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption()];
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
