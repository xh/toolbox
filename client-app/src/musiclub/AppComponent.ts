import {badge} from '@xh/hoist/cmp/badge';
import {hbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/mobile/cmp/header';
import {navigator} from '@xh/hoist/mobile/cmp/navigator';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {AppModel} from './AppModel';
import './App.scss';
import {clubIcon} from './Icons';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            tbar: appBar({
                omit: XH.isLandscape,
                icon: clubIcon({size: 'lg'}),
                hideRefreshButton: true,
                appMenuButtonProps: {
                    hideAboutItem: true,
                    hideThemeItem: true,
                    hideFeedbackItem: true,
                    extraItems: [
                        {
                            text: XH.darkTheme ? 'LESS Ü' : 'MORE Ü',
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
