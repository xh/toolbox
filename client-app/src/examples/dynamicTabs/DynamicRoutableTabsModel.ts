import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, makeObservable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {homePanel} from './tabs/HomePanel';
import {settingsPanel} from './tabs/SettingsPanel';
import {aboutPanel} from './tabs/AboutPanel';
import {itemDetailPanel} from './tabs/ItemDetailPanel';

/**
 * Model demonstrating dynamic, routable tabs.
 *
 * Cannot use TabContainerModel's built-in `route` config because it prohibits all dynamic
 * tab mutations (addTab/removeTab both call setTabs, which throws when routing is enabled).
 * Instead, we manage routing manually with bidirectional reactions.
 */
export class DynamicRoutableTabsModel extends HoistModel {
    @managed
    tabContainerModel: TabContainerModel = new TabContainerModel({
        // No `route` config — we manage routing manually.
        switcher: {mode: 'dynamic', initialFavorites: ['home', 'settings', 'about']},
        tabs: [
            {id: 'home', title: 'Home', icon: Icon.home(), content: homePanel},
            {id: 'settings', title: 'Settings', icon: Icon.gear(), content: settingsPanel},
            {id: 'about', title: 'About', icon: Icon.info(), content: aboutPanel}
        ]
    });

    /** ID typed into the "open item" input. */
    @bindable itemIdInput: string = '';

    // Guard to prevent reaction loops during sync.
    private _syncing = false;
    private _routerUnsub = null;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        super.onLinked();

        // Router → Tabs: subscribe directly to Router 5 for reliable change detection,
        // including param-only changes on the same route name. MobX reactions on
        // XH.routerState don't reliably detect these.
        this._routerUnsub = XH.router.subscribe(() => this.syncRouterToTabs());
        // Initial sync on mount.
        this.syncRouterToTabs();

        // Tabs → Router: when the active tab changes, update the URL.
        this.addReaction({
            track: () => this.tabContainerModel.activeTabId,
            run: () => this.syncTabsToRouter(),
            fireImmediately: true
        });

        // Cleanup: when the DynamicTabSwitcher hides an item tab (user clicks X), defer
        // removal to the next tick so that MobX reactions from tab creation have settled.
        this.addReaction({
            track: () =>
                this.tabContainerModel.dynamicTabSwitcherModel?.visibleTabs?.map(t => t.id),
            run: visibleIds => this.deferredCleanupHiddenItemTabs(visibleIds)
        });
    }

    /** Open (or activate) the item tab for the given ID. */
    @action
    openItemTab(id: string | number) {
        const itemId = String(id),
            tabId = `item-${itemId}`,
            {tabContainerModel} = this;

        if (!tabContainerModel.findTab(tabId)) {
            tabContainerModel.addTab({
                id: tabId,
                title: `Item ${itemId}`,
                icon: Icon.detail(),
                content: () => itemDetailPanel({itemId})
            });
        }

        tabContainerModel.activateTab(tabId);
    }

    /** Handle "Open Tab" button click. */
    @action
    onOpenItemClick() {
        const id = this.itemIdInput?.trim();
        if (id) {
            this.openItemTab(id);
            this.itemIdInput = '';
        }
    }

    override destroy() {
        if (typeof this._routerUnsub === 'function') this._routerUnsub();
        super.destroy();
    }

    //------------------------------------------------------------------
    // Routing sync
    //------------------------------------------------------------------
    private syncRouterToTabs() {
        if (this._syncing) return;
        this._syncing = true;
        try {
            const state = XH.routerState;
            if (!state) return;

            const {name, params} = state;

            // Match parameterized item route.
            // Note: cannot use router.isActive('default.item') without params — Router 5
            // requires params to match for parameterized routes. Check route name directly.
            if (name === 'default.item' && params?.id) {
                this.openItemTab(params.id);
                return;
            }

            // Match static tab routes by name.
            const staticIds = ['home', 'settings', 'about'];
            for (const tabId of staticIds) {
                if (name === 'default.' + tabId) {
                    this.tabContainerModel.activateTab(tabId);
                    return;
                }
            }

            // Fallback: if we're on the base route with no child, go to home.
            if (name === 'default') {
                this.tabContainerModel.activateTab('home');
            }
        } finally {
            this._syncing = false;
        }
    }

    private syncTabsToRouter() {
        if (this._syncing) return;
        this._syncing = true;
        try {
            const tabId = this.tabContainerModel.activeTabId;
            if (!tabId) return;

            if (tabId.startsWith('item-')) {
                const itemId = tabId.replace('item-', '');
                XH.navigate('default.item', {id: itemId});
            } else {
                XH.navigate('default.' + tabId);
            }
        } finally {
            this._syncing = false;
        }
    }

    /**
     * When the DynamicTabSwitcher "hides" a tab (user clicks X), the tab is removed from the
     * switcher's visible list but still exists in the container. For dynamic item tabs, we want
     * to fully remove them. Deferred to next tick to avoid racing with tab creation — the
     * DynamicTabSwitcherModel's activeTabReaction needs time to add newly activated tabs to
     * its visibleTabs before we check for orphans.
     */
    private deferredCleanupHiddenItemTabs(visibleIds: string[]) {
        if (!visibleIds) return;
        wait().then(() => {
            if (this.isDestroyed) return;
            const switcherVisibleIds =
                this.tabContainerModel.dynamicTabSwitcherModel?.visibleTabs?.map(t => t.id) ?? [];
            const allTabs = [...this.tabContainerModel.tabs];
            for (const tab of allTabs) {
                if (tab.id.startsWith('item-') && !switcherVisibleIds.includes(tab.id)) {
                    this.tabContainerModel.removeTab(tab);
                }
            }
        });
    }
}
