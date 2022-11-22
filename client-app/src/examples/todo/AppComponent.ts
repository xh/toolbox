import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {todoPanel} from './TodoPanel';
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
                    icon: Icon.clipboard({size: '2x', prefix: 'fal'}),
                    hideAppMenuButton: true,
                    hideRefreshButton: true,
                    rightItems: [themeToggleButton()]
                }),
                item: todoPanel(),
                className: 'tbox-todoapp'
            })
        );
    }
});
