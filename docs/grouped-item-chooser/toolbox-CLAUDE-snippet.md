# Toolbox `CLAUDE.md` snippet — GroupedItemChooser

Merge the block below into the Toolbox repo's guidance so the coding agent auto-loads a pointer to
this package. **Keep it short** — Claude Code loads `CLAUDE.md` into every session, so detail belongs
in the referenced docs (loaded on demand via `@docs/...`), not inline here.

Toolbox is already integrated with the Hoist AI tooling (the `xh/hoist-ai` plugin + `hoist-*` MCP
server), so this snippet only needs to (a) point at the spec docs and (b) reaffirm that framework
conventions come from the live Hoist reference — **do not** restate MobX/`hoistCmp`/styling rules
here, and **do not** run `/xh:onboard-app` (that's for un-integrated legacy apps; Toolbox is onboarded).

---

```markdown
## Feature: GroupedItemChooser (in progress)

Building `GroupedItemChooser` + `GroupedItemChooserModel` — a general, domain-neutral
item/series **picker + grouper** control (leaf items → optional one-level groups → per-group
transform → ordered, colored output `value`). Finance data in the demo is sample data only.

- **Product spec (behavior + visuals):** @docs/grouped-item-chooser/spec.md
- **Typed API (model/component/value):** @docs/grouped-item-chooser/api.md
- **Reviewed reference demo + state PNGs:** docs/grouped-item-chooser/assets/
  (`reference-demo.html` is the SOLE source of truth for behavior/styling — open it and match it.)

**How to build it:** follow this repo's own conventions and the Hoist reference — the `hoist-*`
MCP tools (`hoist-search-docs`, `hoist-search-symbols`, `hoist-get-symbol`, `hoist-get-members`)
and the closest precedent, **`GroupingChooser`** (`@xh/hoist/cmp/grouping` +
`@xh/hoist/desktop/cmp/grouping`, incl. its impl `GroupingChooserLocalModel`). The spec/api docs
deliberately do NOT restate framework or styling conventions — those come from Hoist.

**Boundary:** the deliverable is the control + its model + the observable `value`. Any chart/legend
is an *example consumer* of the value in a demo tab — NOT part of the component.
```

---

### Placement notes

- Put the three artifacts under `docs/grouped-item-chooser/` in the repo (spec.md, api.md,
  assets/). The `@docs/...` references above assume that path — adjust if the repo nests docs
  differently.
- If the repo prefers feature notes to live beside the code rather than in root `CLAUDE.md`, drop
  the block into the nearest scoped `CLAUDE.md` instead; the `@docs/...` links work from anywhere.
