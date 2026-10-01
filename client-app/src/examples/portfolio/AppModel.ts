import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {sizingModeAppOption, themeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {Icon} from '@xh/hoist/icon';
import {BaseAppModel} from '../../BaseAppModel';
import {PortfolioService} from '../../core/svc/PortfolioService';
import {viewManagers} from './viewManagers';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await XH.installServicesAsync([PortfolioService], ctx);

        // Awaited here, in initAsync, so that all saved views are loaded and the desired option
        // preselected before component-level models are constructed within PortfolioModel.
        await viewManagers.initAsync(ctx);

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
