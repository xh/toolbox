import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dashCanvas} from '@xh/hoist/desktop/cmp/dash';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {CITIES} from './WeatherDashModel';
import '../../core/Toolbox.scss';
import './Weather.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        const {weatherDashModel} = model;
        return panel({
            tbar: appBar({
                icon: Icon.sun({size: '2x', prefix: 'fal'}),
                leftItems: [
                    select({
                        model: weatherDashModel,
                        bind: 'selectedCity',
                        options: CITIES,
                        enableFilter: true,
                        width: 200
                    }),
                    appBarSeparator(),
                    viewManager()
                ],
                rightItems: [
                    relativeTimestamp({
                        model: weatherDashModel,
                        bind: 'lastLoadCompleted',
                        prefix: 'Updated:'
                    }),
                    appBarSeparator()
                ],
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: dashCanvas({model: weatherDashModel.dashCanvasModel}),
            className: 'weather-app'
        });
    }
});
