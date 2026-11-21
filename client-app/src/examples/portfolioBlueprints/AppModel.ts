import {Icon} from '@xh/hoist/icon';
import {BlueprintAppModel} from '../../blueprints/app/BlueprintApp';
import type {BlueprintAppConfig} from '../../blueprints/app/BlueprintApp';
import {PORTFOLIO_TYPE} from '../../blueprints/blueprintTypes';

/** Portfolio, built from blueprints: dashboards over the portfolio datasets, made with the Architect. */
export class AppModel extends BlueprintAppModel {
    readonly appConfig: BlueprintAppConfig = {
        storageKey: 'portfolioBlueprints',
        type: PORTFOLIO_TYPE,
        icon: Icon.portfolio({size: '2x', prefix: 'fal'})
    };
}
