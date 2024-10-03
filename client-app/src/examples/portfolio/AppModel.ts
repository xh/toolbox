import {managed, XH} from '@xh/hoist/core';
import {themeAppOption, sizingModeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {Icon} from '@xh/hoist/icon';
import {PortfolioService} from '../../core/svc/PortfolioService';
import {BaseAppModel} from '../../BaseAppModel';
import {ViewManagerModel} from '@xh/hoist/core/persist/viewManager';

export const PERSIST_MAIN = {localStorageKey: 'portfolioAppMainState'};
export const PERSIST_DETAIL = {localStorageKey: 'portfolioAppDetailState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    @managed viewManagerModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(PortfolioService);

        this.viewManagerModel = await ViewManagerModel.createAsync({
            entity: {
                name: 'PortfolioExample',
                displayName: 'View'
            },
            canManageGlobal: () => XH.getUser().hasRole('GLOBAL_VIEW_MANAGER'),
            persistWith: {prefKey: 'portfolioExample'},
            enableDefault: true,
            enableAutoSave: true
        });

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
