import {IDynamicTabSwitcherModel, TabModel} from '@xh/hoist/cmp/tab';
import {hoistCmp, HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {menuItem} from '@xh/hoist/kit/blueprint';
import {stopPropagation} from '@xh/hoist/utils/js';
import {MouseEvent, ReactElement} from 'react';
import {type AppModel} from './AppModel';
import './ModuleMenu.scss';

/**
 * Menu items for the AppMenuButton listing all top-level modules, offering a second and more
 * discoverable form of navigation alongside the DynamicTabSwitcher's tab bar.
 *
 * Each item carries a star toggle controlling that module's status as a switcher favorite. This
 * gives users a durable way to restore a tab they have removed from the bar - the switcher itself
 * surfaces its favorite toggle only via a right-click context menu on a tab that is still present.
 *
 * Items are listed in tab declaration order (not switcher order) so that rows hold their position
 * as favorites are toggled.
 */
export function moduleMenuItems(appModel: AppModel): ReactElement[] {
    const {tabModel} = appModel,
        switcherModel = tabModel.dynamicTabSwitcherModel;

    return tabModel.tabs
        .filter(tab => !tab.excludeFromSwitcher)
        .map(tab => moduleMenuItem({key: tab.id, tab, switcherModel}));
}

//---------------------------
// Implementation
//---------------------------
interface ModuleMenuItemProps extends HoistProps {
    tab: TabModel;
    switcherModel: IDynamicTabSwitcherModel;
}

const moduleMenuItem = hoistCmp.factory<ModuleMenuItemProps>({
    displayName: 'ModuleMenuItem',
    model: false,

    render({tab, switcherModel}) {
        const isFavorite = switcherModel.isTabFavorite(tab.id);
        return menuItem({
            icon: tab.icon,
            text: tab.title,
            active: tab.isActive,
            disabled: tab.disabled,
            onClick: () => tab.activate(),
            // Rendered within the item, but stops propagation to toggle the favorite without
            // activating the tab or dismissing the menu - supporting multiple toggles in a row.
            labelElement: button({
                className: 'tb-module-menu-item__favorite-button',
                icon: Icon.favorite({prefix: isFavorite ? 'fas' : 'fal'}),
                title: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
                minimal: true,
                onClick: (e: MouseEvent<HTMLElement>) => {
                    stopPropagation(e);
                    switcherModel.toggleTabFavorite(tab.id);
                }
            })
        });
    }
});
