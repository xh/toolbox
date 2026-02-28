import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dashCanvas} from '@xh/hoist/desktop/cmp/dash';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import '../../core/Toolbox.scss';
import './WeatherV2.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        const {weatherV2DashModel} = model;
        return panel({
            tbar: appBar({
                icon: Icon.sun({size: '2x', prefix: 'fal'}),
                title: 'Weather V2',
                leftItems: [viewManager()],
                rightItems: [appBarSeparator()],
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: dashCanvas({model: weatherV2DashModel.dashCanvasModel}),
            className: 'weather-v2-app'
        });
    }
});
