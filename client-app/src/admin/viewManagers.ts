import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';

/**
 * ViewManagerModels for the Admin app.
 *
 * Hoist requires that every `ViewManagerModel` an app needs is created - and has loaded its
 * persisted state - before any component-level model is constructed, so that those models can bind
 * to the correct saved state as they are built. Creation is therefore still driven from
 * `AppModel.initAsync()`, which awaits {@link ViewManagers.initAsync} below.
 *
 * The models are held *here* rather than as properties of `AppModel` so consumers can reach them
 * without importing `AppModel` - which imports the very components that consume them, closing a
 * runtime import cycle. This module imports nothing from the app, so it is safe for any model or
 * component to depend on.
 */
class ViewManagers {
    /** Named parameter sets for the Grid test panel - see GridTestModel. */
    gridTestConfig: ViewManagerModel;

    async initAsync(ctx: InitContext) {
        this.gridTestConfig = await ViewManagerModel.createAsync(
            {
                type: 'gridTestConfig',
                typeDisplayName: 'config',
                // Benchmark configs should only change when explicitly saved - a silent auto-save
                // would quietly re-baseline a config mid-comparison.
                enableAutoSave: false,
                manageGlobal: XH.getUser().isHoistAdmin
            },
            ctx
        );
    }
}

export const viewManagers = new ViewManagers();
