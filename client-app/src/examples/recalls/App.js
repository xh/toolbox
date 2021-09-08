import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {recallsPanel} from './RecallsPanel';
import '../../core/Toolbox.scss';

export const App = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            tbar: appBar({
                icon: Icon.health({size: '2x', prefix: 'fal'}),
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: recallsPanel()
        });
    }
});
