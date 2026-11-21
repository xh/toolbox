import {Icon} from '@xh/hoist/icon';
import {BlueprintAppModel} from '../../blueprints/app/BlueprintApp';
import type {BlueprintAppConfig} from '../../blueprints/app/BlueprintApp';

/** Weather, built from blueprints: dashboards over the weather datasets, made with the Architect. */
export class AppModel extends BlueprintAppModel {
    readonly appConfig: BlueprintAppConfig = {
        storageKey: 'weatherBlueprints',
        datasets: ['weather', 'currentWeather'],
        icon: Icon.sun({size: '2x', prefix: 'fal'})
    };
}
