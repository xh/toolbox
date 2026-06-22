# Mobile Docs Reader - Design

Date: 2026-06-21
Branch: `mobile-upgrade`
Source brief: `.tmp/design_handoff_toolbox_mobile/` (§4 "Docs reader", screenshot
`screenshots/06-docs-reader-future.png`) - originally scoped as future/exploratory, now in scope.
Working notes: `.tmp/docs-reader-mobile-proposal.md`.

This carries the desktop in-app documentation viewer to the Toolbox **mobile (phone)** client, shaped
for the form factor. Phone only - tablets load the desktop app by design.

## Goal

When a user taps a "Docs" link in a mobile example's Resources sheet, open that doc *inside* Toolbox
rather than ejecting to GitHub - parity with desktop, where `ToolboxLink` already deep-links repo-relative
`.md` URLs into the viewer. Reuse the existing shared data/service/link-classification layers and render
with the mobile component kit.

A second, explicit goal: this feature is meant to be an **exemplar of mobile+desktop code reuse**. The
refactor that extracts a shared, platform-neutral doc layer is a deliberate part of the deliverable, not
incidental - Toolbox should teach the pattern.

## Scope & sequencing

**Phase 1 (this spec): single-doc viewer.** A deep-link destination that renders one document well.
**Phase 2 (planned follow-on, out of scope here): browse + search demo** - a nav-blade "Docs" entry,
category/doc browsing, and global full-text search, framed as a demonstration of mobile-appropriate
patterns rather than a claim that phone doc-grinding is a primary use case.

### In scope (Phase 1)

- Open any doc by `source` + `docId` (+ optional `section`) as a full-screen Navigator page.
- Render markdown via the shared `markdown` component.
- A back-capable page header with: a lightweight **breadcrumb context** label (source > doc title) and an
  **"On this page"** jump menu (H2 sections) matching the mock's pill.
- **Tap-to-copy** on fenced code blocks (the mock's signature mobile-shaped detail). Copies to clipboard
  with a confirmation toast.
- **In-content link handling:** anchor links scroll within the doc; repo-relative doc->doc links resolve
  (via shared `resolveDocLink`) and navigate within the reader (route `replace`, content swaps in place,
  no page-stack pileup); source-code and external `http` links open the system browser.
- Wire the mobile `ExampleScreen` Resources segment so `.md` links deep-link into the reader instead of
  opening the browser; non-doc links keep their current open-in-browser behavior.

### Out of scope (Phase 1)

- Global full-text **search** UI and any browse/catalog experience (Phase 2).
- A nav-blade "Docs" entry (Phase 2). The reader is reached only via Resources links in Phase 1.
- **Related-examples** rows (doc -> example screen).
- **"Report Doc Issue"** feedback compose (desktop-only).
- Desktop behavior changes beyond the shared-code extraction (desktop must remain functionally identical).

## What already exists (reused as-is or extracted)

- **`DocService`** (`core/svc/DocService.ts`) - platform-agnostic: loads the registry (`docs/registry`),
  fetches + caches markdown (`docs/content`), classifies sources/categories, builds a MiniSearch index.
  Server endpoints are shared. **Not yet installed on mobile** - mobile `AppModel.initAsync` installs only
  GitHub + Portfolio; add `DocService`.
- **`docRegistry.ts`** (`desktop/tabs/docs/`) - doc types, `resolveDocLink`/`normalizePath`,
  `DOC_EXAMPLES`/`getDocExamples`. Types + link resolution are platform-neutral and move to `core/`; the
  desktop-route `DOC_EXAMPLES` map stays on desktop.
- **`ToolboxLink.docRouteParams`** (`core/cmp/`) - parses `$HR/.../README.md#section` into
  `{source, docId, section}` and targets route `default.docs.docRef`. Moves to the shared doc utils;
  `ToolboxLink` imports it from there. The route name is identical on both platforms.
- **`DocsPanelModel` / `DocsTab`** (`desktop/tabs/docs/`) - the desktop viewer. Its platform-neutral core
  (content load, route<->doc sync, section parsing, scroll-spy, link interception) is extracted to shared
  pieces (below); its desktop-only parts (tree `GridModel`, search, feedback `DockContainerModel`,
  resizable `PanelModel`) stay and rebase onto the shared base.
- **`markdown`** (`@xh/hoist/cmp/markdown`) - shared; already used in the mobile ExampleScreen Info segment.
- **Mobile examples already emit doc links** (e.g. `$HR/cmp/grid/README.md`,
  `$HR/cmp/form/README.md#formmodel`). Today `ExampleScreen.resourcesSegment` opens *all* links in the
  browser - the one behavior to change.

## Architecture - shared-code split (the showcase)

New platform-neutral module **`client-app/src/core/docs/`**:

- **`types.ts`** - `DocEntry`, `DocCategory`, `DocSourceInfo`, `DocSection`, `DocExampleLink`.
- **`DocUtils.ts`** - `resolveDocLink`, `normalizePath`, `docRouteParams` (lifted from `ToolboxLink`), and
  the markdown section parser `extractSections` / `slugify` / `stripInlineMarkdown` (lifted from
  `DocsPanelModel`'s private helpers). Pure functions, no platform deps.
- **`DocViewModel.ts`** - a headless `HoistModel` base owning the shared viewer state and behavior:
  - observables: `activeDoc`, `content`, `activeSection`, `pendingScrollSection`; `loadContentTask`.
  - computeds: `sections` (via `extractSections`), `activeSource`, `activeCategory`,
    `activeCategorySiblings`, `activeSourceCategories`.
  - methods: `navigateToDoc(docId, source?, section?)`, `loadContentAsync`, `setActiveSection`,
    `clearPendingScrollSection`, and route<->doc sync (`updateDocFromRoute`, `updateRouteFromDoc`,
    `docRefFromRoute`, `docIdToRoute`) keyed on the shared `default.docs.docRef` route.
  - `navigateToDoc` is written so a subclass can hook in extra selection side effects (desktop grid).
- **`DocContent.ts`** - a shared `hoistCmp` component (`docContent`) that takes a `DocViewModel` and renders
  the scrollable markdown body: `markdown` render, post-render H2 anchor-id assignment, scroll-spy active
  section tracking, in-content link interception (anchor scroll / `resolveDocLink` navigate / browser open),
  and per-code-block copy buttons. Pure DOM/React - platform-neutral.
- **`DocService`** remains in `core/svc` (already shared); its import of doc types repoints to `core/docs`.

**Desktop (`desktop/tabs/docs/`):**
- `DocsPanelModel extends DocViewModel` - adds the tree `GridModel` nav + tree build, search mode/results,
  the feedback `DockContainerModel`, and the resizable `navPanelModel`; overrides `navigateToDoc` to also
  drive grid selection. `DOC_EXAMPLES`/`getDocExamples` stays here.
- `DocsTab` - unchanged shell (nav sidebar, breadcrumb dropdowns, search panel, feedback dock, examples
  menu) but renders the shared `docContent` for its body in place of the inlined `contentBody`.

**Mobile (new `mobile/docs/`):**
- `DocsPageModel extends DocViewModel` - the route param is the source of truth, so this adds little beyond
  reading initial params from `componentProps` and delegating to the shared route sync.
- `DocsPage` - a Navigator page: a mobile `panel` with a header showing the breadcrumb context + an
  "On this page" control. Tapping it opens a lightweight section jump menu (mobile-kit menu/popover - not
  the heavier `pullUpSheet`, which stays reserved for the example Options surface) listing the doc's H2
  `sections`; selecting one scrolls to that heading. Body = shared `docContent`. The Navigator's native
  back returns to the originating example.

## Navigation & wiring

- **Route + page (mobile `AppModel`):** add
  `{name: 'docs', path: '/docs', children: [{name: 'docRef', path: '/:source/:docId?section'}]}` under
  `default`, mirroring desktop exactly, and register `docsPage` in `NavigatorModel.pages`.
- **Service install:** add `DocService` to mobile `AppModel.initAsync`'s `installServicesAsync` list.
- **Resources link wiring (`ExampleScreen`):** in `resourcesSegment`, classify each link; a `.md` doc link
  navigates to `default.docs.docRef` (via shared `docRouteParams`); code/external links keep
  `window.open(toolboxUrl(...))`. Doc links visually keep the book icon + chevron.
- **Deep-link replace in place:** in-content doc->doc navigation uses `XH.navigate(..., {replace: true})`;
  `DocViewModel.updateDocFromRoute` reacts and reloads, so one `DocsPage` instance serves all docs and back
  still returns to the example.

## State management

- Per-doc transient state (`activeDoc`, `content`, `sections`, `activeSection`, `pendingScrollSection`)
  lives in the `DocViewModel`. Nothing is persisted in Phase 1 (no per-user doc prefs). The URL is the
  durable record of "which doc" and supports refresh/deep-link.

## Theming

- Inherits. `panel`, `markdown`, and tokenized styles render in both dark and light; code blocks use the
  Hoist mono token. No separate light work.

## Build order

1. **Extract shared layer** to `core/docs/` (types, utils, `DocViewModel`, `DocContent`); repoint
   `DocService` + `ToolboxLink`; rebase `DocsPanelModel`/`DocsTab` onto the shared pieces.
   **Verify desktop docs viewer is functionally identical** (browse, search, breadcrumb, deep-link,
   in-content links, feedback) before moving on.
2. **Mobile reader:** install `DocService`; add route + `docsPage`; build `DocsPageModel` + `DocsPage`
   (header, breadcrumb context, "On this page", shared `docContent`).
3. **Wire Resources links** in `ExampleScreen` to deep-link `.md` into the reader.
4. **Code-block tap-to-copy** in `docContent` (shared, so desktop gains it too - confirm that's welcome;
   if not, gate to mobile).
5. **Verify on device** (and desktop regression): deep-link from an example, section jump, in-content
   doc->doc link, external link to browser, copy, back-to-example, light/dark.

## Verification

- `tsc --noEmit`, ESLint, Stylelint, Prettier clean on changed files.
- Manual: desktop docs viewer parity (regression) + mobile reader flows above, on a physical device per the
  branch's established testing practice.
- **Closing review:** a dedicated code-review subagent that first reads the hoist-core / hoist-react
  best-practice docs, then reviews the change for correctness and for expression of Hoist conventions, with
  special attention to the shared/platform code split.

## Risks & tradeoffs

- **Desktop refactor risk:** extracting `DocViewModel` + `docContent` touches working desktop code. Accepted
  deliberately (shared-code reuse is the point); mitigated by an explicit desktop regression pass after
  step 1, before mobile work.
- **`docContent` copy buttons on desktop:** sharing the body means desktop inherits code-copy too. Treated
  as a welcome enhancement; can be gated if undesired.
- **Phase 2 seams:** the `DocViewModel` already carries category/sibling computeds, so the Phase 2 browse
  experience can build on it without re-refactoring.
