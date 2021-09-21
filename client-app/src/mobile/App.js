import {hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {appBar} from '@xh/hoist/mobile/cmp/header';
import {navigator} from '@xh/hoist/mobile/cmp/navigator';
import {hbox} from '@xh/hoist/cmp/layout';
import {badge} from '@xh/hoist/cmp/badge';
import {Icon} from '@xh/hoist/icon';
import './App.scss';

export const App = hoistCmp({
    displayName: 'App',

    render() {
        return panel({
            tbar: appBar({
                icon: Icon.boxFull({size: 'lg', prefix: 'fal'}),
                hideRefreshButton: false,
                appMenuButtonProps: {
                    hideLogoutItem: false,
                    hideThemeItem: true,
                    extraItems: [
                        {
                            text: hbox(
                                XH.darkTheme ? 'Light Theme' : 'Dark Theme',
                                badge({
                                    item: 'Try Me',
                                    intent: 'primary',
                                    compact: true
                                })
                            ),
                            icon: XH.darkTheme ? Icon.sun({prefix: 'fas'}) : Icon.moon(),
                            actionFn: () => XH.toggleTheme()
                        }
                    ]
                }
            }),
            item: navigator()
        });
    }
});