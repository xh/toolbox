# Dynamic Routable Tabs — Spike Findings

## Summary

All 7 routing scenarios work with a viable workaround pattern. The approach requires
**bypassing TabContainerModel's built-in routing** entirely and managing the Router 5 ↔ tab
sync manually. This works well but exposes several framework-level friction points that could be
smoothed out in hoist-react.

## What Works Out of the Box

- **TabContainerModel + DynamicTabSwitcher** — the tab container's dynamic switcher mode
  (`switcher: {mode: 'dynamic'}`) works well for adding, removing, reordering, and
  favoriting tabs at runtime. No issues with the core tab lifecycle.
- **addTab / removeTab** — these work correctly on a non-routed TabContainerModel. Tabs are
  created, rendered, and destroyed as expected.
- **Router 5 parameterized routes** — defining routes like `/item/:id` works. The router
  resolves params correctly and fires subscribers on navigation.
- **tabContainer switcher: false prop** — the `tabContainer()` component accepts
  `switcher: false` (or `null`) to suppress the built-in switcher, allowing a separately
  placed `dynamicTabSwitcher()` in a toolbar. This is essential for custom layouts.

## Workarounds Required

### 1. Cannot use TabContainerModel's `route` config with dynamic tabs

**The issue:** `TabContainerModel.setTabs()` throws `"Dynamic tabs not available on TabContainer
with routing"` when `route` is set. Since `addTab()` and `removeTab()` both call `setTabs()`
internally, ALL dynamic tab mutations are blocked on routed containers.

**Workaround:** Omit the `route` config and manage routing manually:
- Subscribe to Router 5 directly (`XH.router.subscribe()`) for router→tab sync.
- Use a MobX reaction on `activeTabId` for tab→router sync.
- Use a `_syncing` guard flag to prevent reaction loops.

**This is the central finding of the spike.** The workaround is viable but non-trivial — it
requires ~80 lines of manual routing logic that mirrors what `TabContainerModel` does
internally but adds support for parameterized routes and dynamic tab creation.

### 2. Must subscribe to Router 5 directly, not via MobX reaction on `XH.routerState`

**The issue:** A MobX `reaction` tracking `() => XH.routerState` does not reliably fire when
navigating between routes that share the same name but differ only in params (e.g.,
`/item/5` → `/item/7`). The `routerState` property is `@observable.ref` and the reference
does change, but MobX reactions scheduled from within a Router 5 subscriber callback
interact poorly with MobX's batching — the reaction fires but observable changes made inside
it (via `@action` methods) can be rolled back by other pending reactions.

**Workaround:** Use `XH.router.subscribe()` directly (a native Router 5 subscription) instead
of a MobX reaction. Store the unsubscribe function and call it in `destroy()`.

### 3. Router 5's `isActive()` requires params for parameterized routes

**The issue:** `XH.router.isActive('default.item')` returns `false` when the current route IS
`default.item` with params `{id: '5'}`. Router 5 requires params to be passed for the check
to succeed: `isActive('default.item', {id: '5'})` returns `true`.

**Workaround:** Match routes by checking `XH.routerState.name` directly instead of using
`router.isActive()`.

### 4. DynamicTabSwitcher cleanup races with tab creation

**The issue:** When watching `DynamicTabSwitcherModel.visibleTabs` to detect tab closures and
remove orphaned dynamic tabs from the container, the cleanup reaction fires in the same MobX
batch as a new tab being added. The `DynamicTabSwitcherModel`'s `activeTabReaction` hasn't
yet added the new tab to `visibleTabs`, so the cleanup sees the new tab as "not visible" and
removes it immediately.

**Workaround:** Defer the cleanup to the next microtask using `wait().then(...)`. This allows
`DynamicTabSwitcherModel`'s `activeTabReaction` to settle before checking for orphans.

### 5. DynamicTabSwitcher's close button calls `hide()`, not `removeTab()`

**The issue:** Clicking X on a tab in `DynamicTabSwitcher` calls
`DynamicTabSwitcherModel.hide(tabId)`, which removes the tab from the switcher's visible list
but does NOT remove it from the `TabContainerModel`. The tab's model and rendered content
persist in the DOM (with `display: none`). For dynamic detail tabs, we want actual removal.

**Workaround:** Watch `visibleTabs` for changes and call `removeTab()` on dynamic tabs that
are no longer visible (with the deferral from workaround #4).

## Recommended Framework Changes

In priority order:

### P1: Allow `addTab` / `removeTab` on routed containers

The guard in `setTabs()` that blocks mutations when `route` is set is too broad. Individual
`addTab`/`removeTab` operations should be allowed — the restriction was likely intended for
`setTabs()` (wholesale replacement) where route consistency is harder to guarantee. If
`addTab`/`removeTab` worked with routing, the entire manual routing approach would be
unnecessary for the common case.

**Implementation sketch:** When adding a tab to a routed container, also register the new
tab's route with Router 5 via `XH.router.add()`. When removing a tab, the route can remain
(navigating to it would show no content, or could trigger a fallback). The `syncWithRouter()`
method already iterates over `tabs` and matches by ID, so dynamically added tabs would
naturally participate.

The open question is parameterized routes (`/item/:id`). A single route definition can serve
all dynamic items, but `TabContainerModel.syncWithRouter()` matches tabs by
`route + '.' + tab.id`, which doesn't support params. Supporting a parameterized route pattern
where multiple tabs map to the same route name (differentiated by params) would require
changes to how `syncWithRouter` matches tabs.

### P2: Support `onTabRemoved` callback or actual removal in DynamicTabSwitcher

Currently, `DynamicTabSwitcher.hide()` only affects visibility, not the underlying
`TabContainerModel`. For use cases where dynamic tabs should be fully removed (not just
hidden), the framework should either:
- Provide an `onTabRemoved` callback on the switcher config, or
- Add a `removeOnHide` flag to `TabConfig` / `DynamicTabSwitcherModel`.

### P3: Consider a `TabContainerModel` option for parameterized tab routes

The current routing model assumes a 1:1 mapping between tab IDs and route segments. For
dynamic item detail tabs, a more flexible model would allow a single parameterized route
(e.g., `/item/:id`) to map to multiple tabs, with the model managing the ID↔tab lookup.

## File Inventory

| File | Purpose |
|------|---------|
| `apps/dynamicTabs.ts` | Entry point |
| `examples/dynamicTabs/AppModel.ts` | Route definitions (incl. `/item/:id`) |
| `examples/dynamicTabs/AppComponent.ts` | App shell with app bar |
| `examples/dynamicTabs/DynamicRoutableTabsModel.ts` | Core model: manual routing sync |
| `examples/dynamicTabs/DynamicRoutableTabsPanel.ts` | Panel: tab container + toolbar |
| `examples/dynamicTabs/tabs/HomePanel.ts` | Static tab content |
| `examples/dynamicTabs/tabs/SettingsPanel.ts` | Static tab content |
| `examples/dynamicTabs/tabs/AboutPanel.ts` | Static tab content |
| `examples/dynamicTabs/tabs/ItemDetailPanel.ts` | Dynamic tab content |
