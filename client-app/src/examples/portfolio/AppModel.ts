import {XH} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {sizingModeAppOption, themeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {Icon} from '@xh/hoist/icon';
import {BaseAppModel} from '../../BaseAppModel';
import {PortfolioService} from '../../core/svc/PortfolioService';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    portfolioViewManager: ViewManagerModel;

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(PortfolioService);

        // Constructed here, in initAsync, so we can await the async factory and ensure that all
        // saved views are loaded and the desired option has been preselected before the model
        // is used to construct component-level models within PortfolioModel.
        this.portfolioViewManager = await ViewManagerModel.createAsync({
            type: 'portfolioLayout',
            typeDisplayName: 'Layout',
            enableDefault: true,
            manageGlobal: true,
            persistWith: {localStorageKey: 'portfolioViewManager'}
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
