import {hoistCmp, XH, uses, HoistUser} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {appBar} from '@xh/hoist/mobile/cmp/header';
import {navigator} from '@xh/hoist/mobile/cmp/navigator';
import {hbox} from '@xh/hoist/cmp/layout';
import {badge} from '@xh/hoist/cmp/badge';
import {Icon} from '@xh/hoist/icon';
import {profilePic} from '../core/cmp';
import {AppModel} from './AppModel';
import './App.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        const renderWithUserProfile = model.renderWithUserProfile
            ? (user: HoistUser) => profilePic({user})
            : false;

        return panel({
            tbar: appBar({
                omit: XH.isLandscape,
                icon: Icon.boxFull({size: 'lg', prefix: 'fal'}),
                hideRefreshButton: false,
                appMenuButtonProps: {
                    hideLogoutItem: false,
                    hideThemeItem: true,
                    renderWithUserProfile,
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
