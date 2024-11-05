import {XH} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/core/persist/viewmanager';
import {sizingModeAppOption, themeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {Icon} from '@xh/hoist/icon';
import {BaseAppModel} from '../../BaseAppModel';
import {PortfolioService} from '../../core/svc/PortfolioService';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    viewManagerModel: ViewManagerModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(PortfolioService);

        this.viewManagerModel = await ViewManagerModel.createAsync({
            entity: {
                name: 'portfolioLayout',
                displayName: 'Layout'
            },
            enableSharing: true,
            enableDefault: true,
            persistWith: {localStorageKey: 'portfolioViewManager'}
        });

        this.persistWith = {viewManagerModel: this.viewManagerModel};

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
