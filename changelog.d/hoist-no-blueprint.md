### Technical

* Removed all imports from `@xh/hoist/kit/blueprint` ahead of hoist-react dropping Blueprint -
  dialogs and tooltips now use Hoist's own `dialog` and `tooltip` (from the new
  `@xh/hoist/cmp/tooltip`), the app menu's module items are `MenuItem` configs with the favorite
  star as their `rightElement`, and mobile popovers import from `@xh/hoist/cmp/popover`.
* Moved button labels from `title` to hoist-react's new `ButtonProps.tooltip`, so they show in a
  Hoist `Tooltip` - including the Docs search buttons, which no longer wrap themselves in
  `tooltip()`.
