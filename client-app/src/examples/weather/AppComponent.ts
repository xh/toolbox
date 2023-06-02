import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {weatherPanel} from './WeatherPanel';
import {themeToggleButton} from '@xh/hoist/desktop/cmp/button';
import './App.scss';
import {wrapper} from '../../desktop/common/Wrapper';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return wrapper(
            panel({
                tbar: appBar({
                    icon: Icon.sun({size: '2x', prefix: 'fal'}),
                    hideAppMenuButton: true,
                    hideRefreshButton: false,
                    rightItems: [themeToggleButton()]
                }),
                item: weatherPanel(),
                className: 'tbox-weatherapp'
            })
        );
    }
});
