import {Icon} from '@xh/hoist/icon';
import {BlueprintAppModel} from '../../blueprints/app/BlueprintApp';
import type {BlueprintAppConfig} from '../../blueprints/app/BlueprintApp';
import {WEATHER_TYPE} from '../../blueprints/blueprintTypes';

/** Weather, built from blueprints: dashboards over the weather datasets, made with the Architect. */
export class AppModel extends BlueprintAppModel {
    readonly appConfig: BlueprintAppConfig = {
        storageKey: 'blueprintWeather',
        type: WEATHER_TYPE,
        icon: Icon.sun({size: '2x', prefix: 'fal'})
    };
}
