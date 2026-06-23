import {hoistCmp, XH, uses, HoistUser} from '@xh/hoist/core';
import {img} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {appBar} from '@xh/hoist/mobile/cmp/header';
import {button} from '@xh/hoist/mobile/cmp/button';
import {navigator} from '@xh/hoist/mobile/cmp/navigator';
import {Icon} from '@xh/hoist/icon';
import {profilePic} from '../core/cmp';
import {AppModel} from './AppModel';
import {navBlade} from './cmp/navBlade/NavBlade';
// @ts-ignore
import xhLogo from '../core/img/xh-logo.png';
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
                // Show the active section in place of the app name (parent section for drilldowns).
                title: model.navBladeModel.activeTitle,
                hideRefreshButton: false,
                // The back affordance is for drilldowns only; top-level pages keep the hamburger.
                hideBackButton: model.navBladeModel.isTopLevelRoute,
                // On the docs drill-down the chevron carries the parent screen's name (iOS Settings
                // style); elsewhere `backLabel` is null and the button stays icon-only.
                backButtonProps: {text: model.navBladeModel.backLabel},
                // The hamburger glyph and the XH logo together form a single, generously sized button
                // that opens the navigation blade. Shown on every blade-navigable page (Home and the
                // top-level examples) so the menu is always one tap away - drilldown pages drop it and
                // show the back button instead.
                leftItems: [
                    button({
                        className: 'tb-appbar-hamburger',
                        icon: Icon.bars(),
                        text: img({className: 'tb-appbar-logo', src: xhLogo, alt: 'XH'}),
                        omit: !model.navBladeModel.isTopLevelRoute,
                        onClick: () => model.navBladeModel.open()
                    })
                ],
                // Pencil opens the home Manage-widgets sheet. Like the hamburger, it belongs only on
                // the home root - sub-pages have no widget dashboard to customize.
                rightItems: [
                    button({
                        icon: Icon.edit(),
                        omit: model.navigatorModel.stack.length > 1,
                        onClick: () => (model.homeModel.isManaging = true)
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
