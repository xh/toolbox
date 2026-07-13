# Claude Design → Toolbox handoff — reusable template &amp; checklist

A repeatable shape for handing a reviewed Claude **Design** prototype to a Claude **Code** agent
working in a Hoist repo. Born out of the `GroupedItemChooser` handoff; generalize freely.

The governing idea: **specify the product, delegate the framework.** Capture behavior and visual
nuance exhaustively (only you have it — it lives in the reviewed prototype); say nothing about *how*
to build it in Hoist (the coding agent has full Hoist context + the `hoist-*` MCP + the repo's own
conventions). Over-specifying implementation is the main failure mode — it drags the agent off the
house style you want it to follow.

---

## Folder shape

Stage a folder in the design project, then copy it into the repo under `docs/<feature>/`:

```
handoff/
  README.md                     # orientation + source-of-truth rule + what's in/out of scope
  spec.md                       # behavioral + visual spec, transcribed from the reviewed prototype
  api.md                        # typed API surface: config, observable value, callbacks
  <repo>-CLAUDE-snippet.md      # short block to merge into the repo's CLAUDE.md (uses @docs/… refs)
  assets/
    reference-demo.html         # self-contained bundle of the reviewed prototype (runnable offline)
    states/*.png                # curated state screenshots (PNG — Claude Code reads raster, not SVG)
```

## Checklist

**Frame**
- [ ] Name the artifact using the framework's own naming convention (read the repo for precedent).
- [ ] State the **single source of truth** explicitly (which prototype file), and flag anything
      unreviewed as non-authoritative.
- [ ] Draw the **component boundary** — what's in scope vs. an example consumer / harness.
- [ ] Strip client/brand/app identifiers; keep only neutral sample data.

**Capture (the part only you can do)**
- [ ] Every state, gesture, affordance, empty/edge case — transcribed from the reviewed prototype.
- [ ] Visual nuance expressed against the design system's tokens/components, **not** copyable CSS.
- [ ] Curated **PNG** screenshots of key states (not SVG — Claude Code reads raster images).
- [ ] A **self-contained** runnable copy of the prototype (inline the assets) so the agent can open it.

**Typed API**
- [ ] Config options + semantics; the observable output **value** shape; callbacks; any shared utility.
- [ ] Mark genuinely-open decisions as open; mark settled ones as settled (with the rationale).

**Delegate (do NOT restate)**
- [ ] Point at the framework MCP tools + reference repo + the closest existing component precedent.
- [ ] Explicitly say framework/coding/styling conventions are delegated, not specified here.
- [ ] Don't reference onboarding skills if the target repo is already integrated with the AI tooling.

**Deliver**
- [ ] A short snippet for the repo's `CLAUDE.md` that links the docs via `@docs/…` (keep root CLAUDE
      lean — detail lives in referenced files, loaded on demand).
- [ ] Confirm the staged folder is self-contained and copies cleanly into `docs/<feature>/`.

## Anti-patterns

- ❌ Pasting the prototype's HTML/CSS/JS as if it were the implementation. It isn't — it's a
  different framework and coding style. Capture *what it does and looks like*, not *how the demo did it*.
- ❌ Restating MobX / component-framework / styling rules the reference already defines.
- ❌ SVG-only visual anchors (raster PNGs travel; SVG isn't read as an image).
- ❌ A giant root `CLAUDE.md`. Link out with `@docs/…`.
- ❌ Leaving "which file is authoritative" implicit when more than one prototype exists.
