import {InitContext, XH} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {sizingModeAppOption, themeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {BaseAppModel} from '../../BaseAppModel';

/**
 * Standalone-app entry model for the Data Lab measurement-harness example. Owns the scenario-config
 * ViewManager so its saved views load before the panel model is constructed. Run history is NOT a
 * ViewManager concern - runs are transient, un-named measurement records persisted to localStorage.
 */
export class AppModel extends BaseAppModel {
    static instance: AppModel;

    /** Named, shareable scenario-config profiles ("profiles are data, not code"). */
    scenarioViewManager: ViewManagerModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);

        this.scenarioViewManager = await ViewManagerModel.createAsync(
            {
                type: 'dataLabScenario',
                typeDisplayName: 'Scenario',
                enableDefault: true,
                enableSharing: true,
                manageGlobal: XH.getUser().isHoistAdmin
            },
            ctx
        );
    }

    override getAppOptions() {
        return [themeAppOption(), sizingModeAppOption()];
    }
}
