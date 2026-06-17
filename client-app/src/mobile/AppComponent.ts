import {hoistCmp, XH, uses, HoistUser} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {appBar} from '@xh/hoist/mobile/cmp/header';
import {button} from '@xh/hoist/mobile/cmp/button';
import {navigator} from '@xh/hoist/mobile/cmp/navigator';
import {Icon} from '@xh/hoist/icon';
import {profilePic} from '../core/cmp';
import {AppModel} from './AppModel';
import {navBlade} from './cmp/navBlade/NavBlade';
import '../core/Toolbox.scss';
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
                // Hamburger opens the navigation blade. Shown only at the root of the nav stack,
                // where the back button is absent - on sub-pages the back button owns the left slot.
                leftItems: [
                    button({
                        icon: Icon.bars(),
                        omit: model.navigatorModel.stack.length > 1,
                        onClick: () => model.navBladeModel.open()
                    })
                ],
                // Pencil opens the home Manage-widgets sheet. Like the hamburger, it belongs only on
                // the home root - sub-pages have no widget dashboard to customize.
                rightItems: [
                    button({
                        icon: Icon.edit(),
                        omit: model.navigatorModel.stack.length > 1,
                        onClick: () => model.homeModel.setBindable('isManaging', true)
                    })
                ],
                appMenuButtonProps: {
                    hideLogoutItem: false,
                    // Theme now lives in the blade footer and the Options dialog - hide the
                    // now-redundant copy in the AppMenu.
                    hideThemeItem: true,
                    renderWithUserProfile
                }
            }),
            items: [navigator(), navBlade({model: model.navBladeModel})]
        });
    }
});
