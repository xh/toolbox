import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {themeToggleButton} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {wrapper} from '../../desktop/common/Wrapper';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return wrapper(
            panel({
                tbar: appBar({
                    icon: Icon.gridPanel({size: '2x', prefix: 'fal'}),
                    hideAppMenuButton: true,
                    hideRefreshButton: true,
                    rightItems: [themeToggleButton()]
                }),
                item: tabContainer(),
                className: 'board-games-app'
            })
        );
    }
});
