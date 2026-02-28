import {hoistCmp, uses} from '@xh/hoist/core';
import {box, hframe} from '@xh/hoist/cmp/layout';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dashCanvas} from '@xh/hoist/desktop/cmp/dash';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {jsonHarnessPanel} from './harness/JsonHarnessPanel';
import '../../core/Toolbox.scss';
import './WeatherV2.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        const {weatherV2DashModel, showJsonHarness} = model;
        return panel({
            tbar: appBar({
                icon: Icon.sun({size: '2x', prefix: 'fal'}),
                title: 'Weather V2',
                leftItems: [viewManager()],
                rightItems: [
                    button({
                        icon: Icon.code(),
                        text: 'JSON',
                        active: showJsonHarness,
                        outlined: true,
                        onClick: () => (model.showJsonHarness = !showJsonHarness)
                    }),
                    appBarSeparator()
                ],
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: hframe(
                showJsonHarness ? jsonHarnessPanel({width: 500, minWidth: 350}) : null,
                box({flex: 1, item: dashCanvas({model: weatherV2DashModel.dashCanvasModel})})
            ),
            className: 'weather-v2-app'
        });
    }
});
