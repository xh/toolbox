import {InitContext, XH} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {sizingModeAppOption, themeAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {BaseAppModel} from '../../BaseAppModel';

/**
 * Standalone-app entry model for the Data Lab measurement-harness example, registered like the
 * Portfolio example. Owns the two ViewManagers (scenario configs + run history) so their saved
 * views load before `DataLabModel` is constructed.
 */
export class AppModel extends BaseAppModel {
    static instance: AppModel;

    /** Named scenario-config profiles ("profiles are data, not code"). */
    scenarioViewManager: ViewManagerModel;
    /** Per-run scorecards persisted as named views ("runs are data"). */
    runViewManager: ViewManagerModel;

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

        this.runViewManager = await ViewManagerModel.createAsync(
            {
                type: 'dataLabRun',
                typeDisplayName: 'Run',
                instance: 'runHistory',
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
