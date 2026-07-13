# GroupedItemChooser — handoff package

A handoff bundle for a Claude Code agent to implement **`GroupedItemChooser`** (+
`GroupedItemChooserModel`) in the Toolbox repo, authored in Hoist React to the repo's own
conventions.

Copy this folder into the repo at **`docs/grouped-item-chooser/`**, then merge
[`toolbox-CLAUDE-snippet.md`](toolbox-CLAUDE-snippet.md) into the repo's `CLAUDE.md`.

---

## What this component is

A general, **domain-neutral item/series picker + grouper**. The user assembles an ordered comparison
set of **leaf items**, optionally organizes any of them into **groups**, assigns each group a
**transform**, and orders everything; the backing model emits a structured, ordered, colored
**`value`**. The component does **no data computation and no plotting**.

The reviewed prototype uses finance data (companies, benchmarks, peer groups). That is **sample data
only** — the API is fully generic (injected item *kinds*, a developer-supplied *transform* library,
provided vs. user-defined *groups*). Nothing finance-specific belongs in the component.

## What's in this folder

| File | What it is |
|---|---|
| [`spec.md`](spec.md) | **Behavioral + visual spec**, transcribed from the reviewed demo. Every state, gesture, edge case, and styling nuance. Start here. |
| [`api.md`](api.md) | **Typed API contract** — config, the observable `value` shape, callbacks, the color allocator, node-context types. |
| [`toolbox-CLAUDE-snippet.md`](toolbox-CLAUDE-snippet.md) | A short block to merge into the repo's `CLAUDE.md` (links these docs via `@docs/…`). |
| [`handoff-template.md`](handoff-template.md) | A reusable template + checklist for future Design → Toolbox handoffs. |
| [`assets/reference-demo.html`](assets/reference-demo.html) | **Self-contained, runnable** copy of the reviewed demo — open it in a browser. |
| [`assets/states/`](assets/states/) | Curated PNG screenshots of key states (referenced from `spec.md`). |

## Source of truth (standing rule)

**`assets/reference-demo.html`** (the bundled **Compare Builder** demo) is the **sole authority** for
behavior, interaction, and styling. It is the reviewed, approved prototype. When this documentation
and the demo ever disagree, **open the demo and match it.** (The separate `Comparison Picker
Concepts` exploration is *not* included here and is *not* authoritative.)

## Conventions are delegated — do not re-derive them

This package specifies **only the product**: behavior, visual/interaction nuance, and the typed API
surface — the things the framework can't infer. It says **nothing** about *how* to author this in
Hoist. For all framework and coding conventions (MobX, `hoistCmp` / `uses` / local models, file
layout, styling mechanics, TS patterns), use:

- the **`hoist-*` MCP tools** already active in Toolbox — `hoist-search-docs`, `hoist-list-docs`,
  `hoist-search-symbols`, `hoist-get-symbol`, `hoist-get-members`;
- the **hoist-react** repo itself;
- the closest existing precedent, **`GroupingChooser`** — `@xh/hoist/cmp/grouping/GroupingChooserModel`,
  its impl `GroupingChooserLocalModel`, and `@xh/hoist/desktop/cmp/grouping/GroupingChooser`. It is a
  near-structural twin: choose + order items, drag-reorder, inline + popover placement, a `HoistModel`
  holding an observable `value`, a config interface, and a per-instance local model.

Do **not** run `/xh:onboard-app` — Toolbox is already integrated with the Hoist AI tooling; that skill
is only for un-integrated legacy apps.

## Component boundary (in scope vs. not)

**In scope:** the `GroupedItemChooser` control + `GroupedItemChooserModel` + the observable `value`.

**Not in scope:** any chart, legend, or visualization. The demo's chart is an **example consumer** of
`value`. In the Toolbox demo tab, build the chart with Hoist's own chart component **outside** the
control; it consumes the emitted value and owns any flatten/dedupe of items that recur across groups.

## Confidentiality

The originating enterprise client is nameless by design. All identifiers are stripped; the finance
tickers/benchmarks/peer sets are neutral **sample data** for the demo tab only.

## Suggested build order

1. Read [`spec.md`](spec.md), then open [`assets/reference-demo.html`](assets/reference-demo.html) and
   drive it — grouping, transforms, drag, provided-vs-user groups, popover mode.
2. Read [`api.md`](api.md); confirm Hoist naming/conventions via the MCP tools and the `GroupingChooser`
   source.
3. Build `GroupedItemChooserModel` (state + `value` + actions + color allocator), then the desktop
   component + local model, matching `GroupingChooser`'s structure.
4. Add a Toolbox example tab wiring the finance sample data + a chart consumer of `value`.
