import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import '../../core/Toolbox.scss';
import './ChatKit.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            className: 'tb-chatkit',
            tbar: appBar({
                icon: Icon.sparkles({size: '2x', prefix: 'fal'}),
                title: 'Chat Kit',
                leftItems: [tabSwitcher({testId: 'app-tabs'})],
                rightItems: [
                    button({
                        testId: 'theme-btn',
                        icon: XH.darkTheme ? Icon.sun() : Icon.moon(),
                        tooltip: 'Switch between light and dark themes',
                        outlined: true,
                        onClick: () => XH.toggleTheme()
                    }),
                    appBarSeparator()
                ],
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: tabContainer({switcher: false})
        });
    }
});
