import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import type {InitContext} from '@xh/hoist/core';

/**
 * ViewManagerModels for the Weather V2 app.
 *
 * Hoist requires that every `ViewManagerModel` an app needs is created - and has loaded its
 * persisted state - before any component-level model is constructed, so that those models can bind
 * to the correct saved state as they are built. Creation is therefore still driven from
 * `AppModel.initAsync()`, which awaits {@link ViewManagers.initAsync} below.
 *
 * The models are held *here* rather than as properties of `AppModel` so consumers (e.g. the LLM
 * tool service) can reach them without importing `AppModel` - which imports the very widgets and
 * services that consume them, closing a runtime import cycle. This module imports nothing from the
 * app, so it is safe for any model, component, or service to depend on.
 */
class ViewManagers {
    /** Saved layouts for the Weather V2 dashboard. */
    weatherDashboardV2: ViewManagerModel;

    async initAsync(ctx: InitContext) {
        this.weatherDashboardV2 = await ViewManagerModel.createAsync(
            {
                type: 'weatherDashboardV2',
                typeDisplayName: 'Layout',
                enableDefault: true,
                enableAutoSave: false
            },
            ctx
        );
    }
}

export const viewManagers = new ViewManagers();
