# GroupedItemChooser - Toolbox implementation notes

Working notes from the initial build (July 2026), recording where the Toolbox implementation
deliberately deviates from the reference demo / handoff docs, and what remains open. Like the rest
of this folder, these notes are branch-only working material - strip before merge.

## Deliberate deviations from the reference demo

- **Identity-keyed pooled colors, including members.** The demo colored members by index-in-group
  and never released colors. Per `api.md`, the model binds a pooled `ColorAllocator` keyed to item
  id, so the same item shows the same color in every container (top level and all groups), reorder
  never recolors, and removed series return their colors to the pool. Members of a group with an
  `isAggregate` transform get a muted (alpha'd) variant via the default `getColor`.
- **New-group insertion position.** The demo inserted new groups "before the first benchmark" - a
  sample-domain heuristic that cannot generalize (kinds are injected). Generic behavior: the new
  group is inserted where the first gathered top-level entry sat, else appended.
- **Single label representation per item.** The demo showed company *name* first in the add-menu
  but *ticker* first on rows. The generic `ItemOption`/`ItemRef` carry one label + sublabel pair
  (sample data uses ticker-primary), keeping menu and rows consistent.
- **Icon substitutions.** Spec glyphs mapped to Hoist's enumerated `Icon` factories where
  available (`users`, `office`, `pin`, `x`, `ellipsisHorizontal`, `copy`, `calculator`, `lock`).
  `object-group` / `object-ungroup` are not in Hoist's set - registered via `library.add` inside
  the component package so registration travels with a copy. On extraction to hoist-react, add
  proper `Icon.objectGroup()` / `Icon.objectUngroup()` factories and drop the local registration.
- **Action bar single-selection handling.** The demo showed a "select one more" hint (which
  wrapped badly at narrow widths) and allowed group-of-one creation from the bar. Here the Group
  button disables with that message as its tooltip when a lone item is selected and no editable
  group exists to move it into.
- **Anchor is a hard invariant (never groupable).** The demo enforced its "subject" only by data
  omission. Here the anchor lives outside the entries collection entirely, the in-group picker
  and membership actions guard its id, and provided-group defs / initialValue are sanitized with
  a `logWarn`. Apps wanting subject-inclusive aggregates should define a dedicated transform key -
  transform computation is consumer-owned, so no membership is required.
- **Inline header is app-configurable.** `title` (default 'Comparison') and `hint` props, with
  `title: null` suppressing the header entirely.
- **`popoverPosition` prop** added ('bottom-left' | 'bottom-right' | 'bottom') so hosts can align
  the popover panel with a left- or right-anchored trigger.
- **Drop affordances.** Reorder feedback uses @hello-pangea/dnd's standard row-shift animation
  rather than the demo's inset-top-border treatment. The "nest into group" ring/highlight is
  styled via the library's `combineTargetFor` snapshot state.

## Open items

- **Combine ("nest") gesture needs a human mouse test.** Dropping a row onto a *collapsed*
  editable group row is wired per @hello-pangea/dnd combine docs (`isCombineEnabled`,
  `result.combine`, `combineTargetFor` styling) but synthetic drags in automation always resolved
  to reorder impacts, so it was never observed end-to-end. Dropping into an *expanded* group's
  member area works (verified) and covers the common case.
- **Member drag to empty list background.** The demo promoted a member dropped on the blank area
  below all rows; here that drop has no droppable target and no-ops. Dropping a member between
  top-level rows promotes it at that position (verified). Could be closed by letting the top
  droppable fill the list's empty space.
- **No scroll-nudge for the in-group picker.** The demo scrolled the picker into view when it
  would clip (mainly popover placement). Here the list scrolls but the user may need to scroll
  manually. A `scrollIntoView` on picker open would close this.
- **`onSaveGroup` not implemented.** `api.md` sketched an emit-only hook for persisting a
  user-defined group as a provided group, but neither the demo nor the spec showed an affordance
  and no concrete need has appeared - the stubs were removed to keep the surface minimal.
  Reintroduce (hook + a "Save as provided group" item in the editable group's "..." menu, shown
  only when configured) if/when an app wants session-to-session group persistence.
- **Mobile variant not built** - explicitly deferred by the handoff (`api.md` §1).

## Extraction checklist (when promoting to hoist-react)

1. Copy `client-app/src/desktop/cmp/groupeditemchooser/` and split per framework convention:
   model + types + allocator to `cmp/`, desktop component + scss to `desktop/cmp/`.
2. Enumerate `Icon.objectGroup()` / `Icon.objectUngroup()` in the framework icon set; remove the
   package-local `library.add`.
3. Consider `persistWith` support (the component deliberately emits-only today; app owns
   persistence per the handoff boundary).
4. Revisit `GroupedItemChooserValue` naming against then-current framework conventions.
