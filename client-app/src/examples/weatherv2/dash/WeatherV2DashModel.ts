import {HoistModel, managed} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {makeObservable} from '@xh/hoist/mobx';
import {WiringModel} from './WiringModel';
import {WeatherDataModel} from './WeatherDataModel';

/**
 * Central model for the Weather V2 dashboard.
 *
 * Owns the DashCanvasModel (layout + widgets), the WiringModel (inter-widget
 * communication), and the WeatherDataModel (shared data cache).
 */
export class WeatherV2DashModel extends HoistModel {
    @managed wiringModel: WiringModel;
    @managed weatherDataModel: WeatherDataModel;
    @managed dashCanvasModel: DashCanvasModel;

    viewManagerModel: ViewManagerModel;

    constructor(viewManagerModel: ViewManagerModel) {
        super();
        makeObservable(this);

        this.viewManagerModel = viewManagerModel;
        this.wiringModel = new WiringModel();
        this.weatherDataModel = new WeatherDataModel();

        // DashCanvasModel is initialized with no viewSpecs or initialState yet.
        // Widgets will be registered in Phase 3 as they're implemented.
        this.dashCanvasModel = new DashCanvasModel({
            persistWith: {viewManagerModel},
            viewSpecs: [],
            initialState: []
        });
    }
}
