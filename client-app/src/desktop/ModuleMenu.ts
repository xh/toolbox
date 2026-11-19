import type {MenuItem} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import type {AppModel} from './AppModel';
import './ModuleMenu.scss';

/**
 * Menu items for the AppMenuButton listing all top-level modules, offering a second and more
 * discoverable form of navigation alongside the DynamicTabSwitcher's tab bar.
 *
 * Each item carries a star toggle controlling that module's status as a switcher favorite. This
 * gives users a durable way to restore a tab they have removed from the bar - the switcher itself
 * surfaces its favorite toggle only via a right-click context menu on a tab that is still present.
 * The star is the item's `rightElement`, so a click on it toggles the favorite without activating
 * the tab or closing the menu - supporting multiple toggles in a row.
 *
 * Items are listed in tab declaration order (not switcher order) so that rows hold their position
 * as favorites are toggled.
 */
export function moduleMenuItems(appModel: AppModel): MenuItem[] {
    const {tabModel} = appModel,
        switcherModel = tabModel.dynamicTabSwitcherModel;

    return tabModel.tabs
        .filter(tab => !tab.excludeFromSwitcher)
        .map(tab => ({
            icon: tab.icon,
            text: tab.title,
            actionFn: () => tab.activate(),
            // Read live state here, so the open menu updates as the active tab and favorites change.
            prepareFn: me => {
                const isFavorite = switcherModel.isTabFavorite(tab.id);
                me.active = tab.isActive;
                me.disabled = tab.disabled;
                me.rightElement = button({
                    className: 'tb-module-menu-item__favorite-button',
                    icon: Icon.favorite({prefix: isFavorite ? 'fas' : 'fal'}),
                    tooltip: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
                    minimal: true,
                    onClick: () => switcherModel.toggleTabFavorite(tab.id)
                });
            }
        }));
}
