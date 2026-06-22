# Mobile Docs Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a mobile user tap a Resources "Docs" link and read that doc inside Toolbox (parity with desktop), by extracting a shared platform-neutral doc layer (`core/docs/`) and building a mobile single-doc viewer on top of it.

**Architecture:** Pull the platform-neutral core out of the desktop viewer into `core/docs/`: doc types, link/section utilities, a headless `DocViewModel` base, and a shared `docContent` markdown-body component. Desktop's `DocsPanelModel`/`DocsTab` rebase onto these (must stay functionally identical). Mobile adds a thin `DocsPageModel`/`DocsPage` Navigator page that reuses the same base + component. The route name `default.docs.docRef` is identical on both platforms, so route<->doc sync is shared.

**Tech Stack:** TypeScript, React 18, MobX, `@xh/hoist` (desktop + mobile kits), Hoist element-factory style, Router5 (via Hoist routing), `@xh/hoist/cmp/markdown`.

## Global Constraints

- **Phone form factor only** for the mobile work; tablets load desktop unchanged.
- **Desktop must remain functionally identical** after the extraction (regression-verify before mobile work).
- **No em dashes** in any generated text (copy, comments, commit messages) - use a plain hyphen with spaces.
- **Code style:** 4-space indent (TS), single quotes, no bracket spacing (`{foo}`), avoid arrow parens (`x => x`), semicolons always, no trailing commas, 100-char width. Hoist **element factories**, not JSX.
- **Hoist conventions:** `makeObservable(this)` in the constructor of any class that introduces new observables (including subclasses, for their own new observables); mutate observables only in actions/`runInAction`/`@bindable`; never call `doLoadAsync` directly; use `model.setBindable('x', v)` for `@bindable` setters.
- **Tokens:** bind to real `--xh-*` tokens; brand orange is `--xh-orange`. Mono uses the Hoist mono token.
- **Verification model (no FE test runner exists):** each task ends green on `npx tsc --noEmit` (run from `client-app/`) and `yarn lint:code`; behavior is verified manually in-browser/on-device at the wiring points and in the final pass.
- **Telemetry:** if adding spans, use the `toolbox.*` namespace (the `DocService` already sets `telemetryPrefix = 'toolbox.client.docs'`).

---

## File Structure

**New shared module - `client-app/src/core/docs/`:**
- `types.ts` - `DocEntry`, `DocCategory`, `DocSourceInfo`, `DocSection`, `DocExampleLink` (moved from `desktop/tabs/docs/docRegistry.ts`).
- `DocUtils.ts` - `resolveDocLink`, `normalizePath`, `docRouteParams`, `extractSections`, `slugify`, `stripInlineMarkdown` (lifted from `docRegistry.ts`, `ToolboxLink.ts`, `DocsPanelModel.ts`).
- `DocViewModel.ts` - headless base `HoistModel`: shared viewer state + behavior + route<->doc sync.
- `DocContent.ts` (+ `DocContent.scss`) - shared `docContent` markdown-body component with anchors, scroll-spy, link interception, and code-block copy.

**Modified (desktop, rebase onto shared):**
- `desktop/tabs/docs/docRegistry.ts` - keep only the desktop-route `DOC_EXAMPLES` map + `getDocExamples`; re-export/import types from `core/docs/types`.
- `desktop/tabs/docs/DocsPanelModel.ts` - `extends DocViewModel`; keep only desktop-only members (grid nav, search, feedback dock, nav panel).
- `desktop/tabs/docs/DocsTab.ts` - render shared `docContent` for the body.
- `core/svc/DocService.ts` - import doc types from `core/docs/types`.
- `core/cmp/ToolboxLink.ts` - import `docRouteParams` from `core/docs/DocUtils`.

**New (mobile):**
- `mobile/docs/DocsPageModel.ts` - `extends DocViewModel`, thin.
- `mobile/docs/DocsPage.ts` (+ `DocsPage.scss`) - Navigator page: header (breadcrumb context + "On this page") + `docContent`.

**Modified (mobile wiring):**
- `mobile/AppModel.ts` - install `DocService`; add `docs`/`docRef` route; register `docsPage` in `NavigatorModel`.
- `mobile/cmp/example/ExampleScreen.ts` - Resources `.md` links deep-link into the reader.

---

## Task 1: Extract shared doc types + utils to `core/docs/`

Pure structural move - no behavior change. Desktop keeps working through repointed imports.

**Files:**
- Create: `client-app/src/core/docs/types.ts`
- Create: `client-app/src/core/docs/DocUtils.ts`
- Modify: `client-app/src/desktop/tabs/docs/docRegistry.ts`
- Modify: `client-app/src/core/svc/DocService.ts:4` (import path)
- Modify: `client-app/src/core/cmp/ToolboxLink.ts` (use shared `docRouteParams`)

**Interfaces:**
- Produces:
  - `types.ts`: `interface DocEntry {id; source; title; category; description; keywords}`, `interface DocCategory {id; title}`, `interface DocSourceInfo {label; categories: DocCategory[]; mode}`, `interface DocSection {id; title}`, `interface DocExampleLink {title; route}`.
  - `DocUtils.ts`:
    - `resolveDocLink(currentDoc: DocEntry, href: string): DocEntry | undefined`
    - `docRouteParams(url: string): {source: string; docId: string; section: string} | null`
    - `extractSections(content: string): DocSection[]`
    - `slugify(text: string): string`
    - (internal) `normalizePath`, `stripInlineMarkdown`

- [ ] **Step 1: Create `core/docs/types.ts`**

Move the type definitions verbatim from `desktop/tabs/docs/docRegistry.ts` (the `DocEntry`, `DocCategory`, `DocSourceInfo`, `DocExampleLink` interfaces) and add `DocSection` (currently declared in `DocsPanelModel.ts`):

```typescript
/** Types for the multi-source documentation viewer (shared desktop + mobile). */

export interface DocEntry {
    /** Unique identifier AND relative file path (e.g. 'docs/base-classes.md'). */
    id: string;
    source: string;
    title: string;
    category: string;
    description: string;
    keywords: string[];
}

export interface DocCategory {
    id: string;
    title: string;
}

export interface DocSourceInfo {
    label: string;
    categories: DocCategory[];
    mode: string;
}

export interface DocSection {
    id: string;
    title: string;
}

export interface DocExampleLink {
    title: string;
    /** Full Router5 route name, e.g. 'default.grids.standard'. */
    route: string;
}
```

- [ ] **Step 2: Create `core/docs/DocUtils.ts`**

Move `resolveDocLink` + `normalizePath` from `docRegistry.ts`, `docRouteParams` from `ToolboxLink.ts`, and `extractSections` + `slugify` + `stripInlineMarkdown` from `DocsPanelModel.ts`. `resolveDocLink` references `DocService.instance` - import it. Note `docRouteParams` uses the source tokens `$HR`->`hoist-react`, `$HC`->`hoist-core`.

```typescript
import {DocService} from '../svc/DocService';
import {DocEntry, DocSection} from './types';

// --- Source repo tokens (matching `$HR`/`$HC` url prefixes) -> doc viewer source names. ---
const DOC_SOURCE_TOKENS: Record<string, string> = {
    $HR: 'hoist-react',
    $HC: 'hoist-core'
};

/**
 * Parse a Markdown doc url (e.g. `$HR/cmp/grid/README.md#tree-grids`) into the params needed to
 * route into the document viewer: the `source` repo, the `docId` (file path, with `/` encoded as
 * `~` for the route), and an optional `section` (an H2 slug). Returns null for any url that is not
 * a repo-relative `.md` doc, so source-code and external links fall through to external handling.
 */
export function docRouteParams(
    url: string
): {source: string; docId: string; section: string} | null {
    const [token, ...rest] = url.split('/');
    const source = DOC_SOURCE_TOKENS[token];
    if (!source || rest.length === 0) return null;

    const [path, section] = rest.join('/').split('#');
    if (!path.endsWith('.md')) return null;

    return {source, docId: path.replaceAll('/', '~'), section: section ?? null};
}

/**
 * Resolve a relative link from one doc to another. Given the current doc entry and a relative href
 * (e.g. '../core/README.md'), returns the matching DocEntry, or undefined if not found.
 */
export function resolveDocLink(currentDoc: DocEntry, href: string): DocEntry | undefined {
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
        return undefined;
    }

    const cleanHref = href.split('#')[0];
    if (!cleanHref) return undefined;

    const docService = DocService.instance;

    const currentDir = currentDoc.id.substring(0, currentDoc.id.lastIndexOf('/') + 1);
    const resolved = normalizePath(currentDir + cleanHref);

    const sameSourceDoc = docService.registry.find(
        e => e.source === currentDoc.source && e.id === resolved
    );
    if (sameSourceDoc) return sameSourceDoc;

    if (currentDoc.source === 'hoist-react') {
        const coreMatch = resolved.match(/^(?:\.\.\/)*hoist-core\/(.+)$/);
        if (coreMatch) {
            return docService.registry.find(
                e => e.source === 'hoist-core' && e.id === coreMatch[1]
            );
        }
    }

    if (currentDoc.source === 'hoist-core') {
        const reactMatch = cleanHref.match(/^(?:\.\.\/)*hoist-react\/(.+)$/);
        if (reactMatch) {
            return docService.registry.find(
                e => e.source === 'hoist-react' && e.id === reactMatch[1]
            );
        }
    }

    return undefined;
}

/** Normalize a path by resolving `.` and `..` segments. */
function normalizePath(path: string): string {
    const parts = path.split('/');
    const result: string[] = [];
    for (const part of parts) {
        if (part === '.' || part === '') continue;
        if (part === '..') {
            result.pop();
        } else {
            result.push(part);
        }
    }
    return result.join('/');
}

/** Parse H2 headings from raw markdown content into navigable sections. */
export function extractSections(content: string): DocSection[] {
    const regex = /^## (.+)$/gm;
    const sections: DocSection[] = [],
        slugCounts = new Map<string, number>();
    let match: RegExpExecArray;
    while ((match = regex.exec(content)) !== null) {
        const title = stripInlineMarkdown(match[1].trim());
        let id = slugify(title);
        const count = slugCounts.get(id) || 0;
        if (count > 0) id += `-${count}`;
        slugCounts.set(id, count + 1);
        sections.push({id, title});
    }
    return sections;
}

/** Remove inline markdown formatting (code, bold, italic, links) to get plain text. */
export function stripInlineMarkdown(text: string): string {
    return text
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\*\*([^*]*)\*\*/g, '$1')
        .replace(/\*([^*]*)\*/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .trim();
}

/** Convert text to a URL-safe slug: lowercase, strip special chars, hyphenate spaces. */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 3: Trim `desktop/tabs/docs/docRegistry.ts` to the desktop-route example map**

Replace the file so it imports types from `core/docs/types`, re-exports them for existing desktop importers, drops the moved `resolveDocLink`/`normalizePath`, and keeps `DOC_EXAMPLES` + `getDocExamples` unchanged. Re-export `resolveDocLink` from the new util so existing desktop imports of it from `docRegistry` keep resolving (or update those import sites in Step 4):

```typescript
/**
 * Desktop-only doc -> Toolbox example tab mappings. Shared doc types and link/section utilities now
 * live in `core/docs`; this file retains the desktop-route example map.
 */
import {DocExampleLink} from '../../../core/docs/types';

export type {DocEntry, DocCategory, DocSourceInfo, DocExampleLink} from '../../../core/docs/types';
export {resolveDocLink} from '../../../core/docs/DocUtils';

const R = 'default';

const DOC_EXAMPLES: Record<string, DocExampleLink[]> = {
    // ... keep the existing map body verbatim ...
};

/** Get example links for a given doc, or an empty array if none. */
export function getDocExamples(docId: string): DocExampleLink[] {
    return DOC_EXAMPLES[docId] ?? [];
}
```

(Preserve the full existing `DOC_EXAMPLES` object contents from the current file.)

- [ ] **Step 4: Repoint `DocService` and `ToolboxLink` imports**

In `core/svc/DocService.ts:4`, change the type import to the new module:

```typescript
import {DocCategory, DocEntry, DocSourceInfo} from '../docs/types';
```

In `core/cmp/ToolboxLink.ts`, delete the local `docRouteParams` + `DOC_SOURCE_TOKENS` definitions and import the shared one; keep `DOCS_ROUTE`, `toolboxUrl`, `createDefaultText` local:

```typescript
import {docRouteParams} from '../docs/DocUtils';
```

- [ ] **Step 5: Typecheck + lint**

Run (from `client-app/`):
```bash
npx tsc --noEmit && yarn lint:code
```
Expected: 0 errors. Fix any remaining import sites the compiler flags (e.g. other files importing `resolveDocLink`/types from `docRegistry` still resolve via the re-exports).

- [ ] **Step 6: Commit**

```bash
git add client-app/src/core/docs client-app/src/desktop/tabs/docs/docRegistry.ts client-app/src/core/svc/DocService.ts client-app/src/core/cmp/ToolboxLink.ts
git commit -m "Extract shared doc types and utils to core/docs"
```

---

## Task 2: Extract `DocViewModel` base; rebase `DocsPanelModel` onto it

**Files:**
- Create: `client-app/src/core/docs/DocViewModel.ts`
- Modify: `client-app/src/desktop/tabs/docs/DocsPanelModel.ts`

**Interfaces:**
- Consumes: `core/docs/types`, `core/docs/DocUtils` (Task 1); `DocService` (`core/svc`).
- Produces - `DocViewModel` (abstract-ish base `HoistModel`), public surface:
  - observables: `activeDoc: DocEntry`, `content: string`, `activeSection: string`, `pendingScrollSection: string`; `loadContentTask: TaskObserver`.
  - computeds: `sections: DocSection[]`, `activeSource: string`, `activeCategory: DocCategory`, `activeCategorySiblings: DocEntry[]`, `activeSourceCategories: DocCategory[]`.
  - methods: `navigateToDoc(docId: string, source?: string, section?: string): void`, `navigateToCategory(source, categoryId): void`, `setActiveSection(id): void`, `clearPendingScrollSection(): void`, `resolveContentLink(href: string): DocEntry | undefined`.
  - protected: `loadInitialDocFromRoute(): void`, `onDocActivated(entry: DocEntry): void` (subclass hook, default no-op), `BASE_ROUTE = 'default.docs'`, `get docService(): DocService`.

- [ ] **Step 1: Create `core/docs/DocViewModel.ts`**

Move the shared state, computeds, `navigateToDoc`/`navigateToCategory`, route<->doc sync, content load, and section parsing out of `DocsPanelModel`. `navigateToDoc` calls a `onDocActivated(entry)` hook so desktop can sync grid selection. The constructor sets up the route reaction and `makeObservable(this)`.

```typescript
import {HoistModel, TaskObserver, XH} from '@xh/hoist/core';
import {action, computed, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {DocService} from '../svc/DocService';
import {DocCategory, DocEntry, DocSection} from './types';
import {extractSections, resolveDocLink} from './DocUtils';

/**
 * Shared, platform-neutral base for the documentation viewer. Owns the active doc, its loaded
 * markdown content, parsed H2 sections, active/pending-scroll section state, and the bidirectional
 * sync between the active doc and the `default.docs.docRef` route (identical on desktop + mobile).
 *
 * Subclasses add platform-specific chrome (desktop: tree-grid nav, search, feedback dock; mobile:
 * a Navigator page) and may override `onDocActivated` to react to doc changes.
 */
export class DocViewModel extends HoistModel {
    protected readonly BASE_ROUTE = 'default.docs';

    @observable.ref activeDoc: DocEntry = null;
    @observable.ref content: string = null;
    @observable activeSection: string = null;

    /**
     * Section slug a deep-link requested we scroll to once content renders. Consumed and cleared by
     * the view; not persisted to the URL (sections are scroll-to-on-arrival targets).
     */
    @observable pendingScrollSection: string = null;

    loadContentTask: TaskObserver = TaskObserver.trackLast();

    protected get docService(): DocService {
        return DocService.instance;
    }

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => XH.routerState.params,
            run: () => this.updateDocFromRoute()
        });
    }

    /** H2-level sections parsed from the current document content. */
    @computed
    get sections(): DocSection[] {
        return this.content ? extractSections(this.content) : [];
    }

    @computed
    get activeSource(): string | null {
        return this.activeDoc?.source ?? null;
    }

    @computed
    get activeCategory(): DocCategory | null {
        if (!this.activeDoc) return null;
        const cats = this.docService.getCategories(this.activeDoc.source);
        return cats.find(c => c.id === this.activeDoc.category) ?? null;
    }

    @computed
    get activeCategorySiblings(): DocEntry[] {
        if (!this.activeDoc) return [];
        return this.docService.getDocsByCategory(this.activeDoc.source, this.activeDoc.category);
    }

    @computed
    get activeSourceCategories(): DocCategory[] {
        if (!this.activeDoc) return [];
        const {source} = this.activeDoc;
        return this.docService
            .getCategories(source)
            .filter(cat => this.docService.getDocsByCategory(source, cat.id).length > 0);
    }

    /**
     * Navigate to a specific doc by source + ID, optionally scrolling to a section (an H2 slug).
     * If the requested doc is already active, only the section scroll is (re)triggered.
     */
    @action
    navigateToDoc(docId: string, source?: string, section?: string) {
        const entry = source
            ? this.docService.getDocEntry(docId, source)
            : this.docService.getDocEntry(docId);
        if (!entry) return;

        const sameDoc = entry.id === this.activeDoc?.id && entry.source === this.activeDoc?.source;
        if (sameDoc) {
            if (section) this.pendingScrollSection = section;
            return;
        }

        this.activeDoc = entry;
        this.activeSection = null;
        this.pendingScrollSection = section ?? null;
        this.onDocActivated(entry);
        this.loadContentAsync(entry);
        this.updateRouteFromDoc();
    }

    /** Navigate to the first doc in a given source + category. */
    navigateToCategory(source: string, categoryId: string) {
        const firstDoc = this.docService.getDocsByCategory(source, categoryId)[0];
        if (firstDoc) this.navigateToDoc(firstDoc.id, firstDoc.source);
    }

    @action
    setActiveSection(sectionId: string) {
        this.activeSection = sectionId;
    }

    @action
    clearPendingScrollSection() {
        this.pendingScrollSection = null;
    }

    /** Resolve an in-content relative href to another doc entry (or undefined). */
    resolveContentLink(href: string): DocEntry | undefined {
        return this.activeDoc ? resolveDocLink(this.activeDoc, href) : undefined;
    }

    //------------------
    // Subclass hooks / route sync
    //------------------
    /** Hook for subclasses to react when a new doc becomes active (default no-op). */
    protected onDocActivated(entry: DocEntry) {}

    /** Read the current route and activate the doc it references, if any. */
    protected loadInitialDocFromRoute() {
        const ref = this.docRefFromRoute(XH.routerState.params);
        if (ref) this.navigateToDoc(ref.docId, ref.source, ref.section);
    }

    private updateDocFromRoute() {
        const {name, params} = XH.routerState;
        if (!name.startsWith(this.BASE_ROUTE)) return;
        const ref = this.docRefFromRoute(params);
        if (ref) this.navigateToDoc(ref.docId, ref.source, ref.section);
    }

    private updateRouteFromDoc() {
        const {activeDoc, BASE_ROUTE} = this,
            {name} = XH.routerState;
        if (!name.startsWith(BASE_ROUTE)) return;

        if (activeDoc) {
            XH.navigate(
                `${BASE_ROUTE}.docRef`,
                {source: activeDoc.source, docId: this.docIdToRoute(activeDoc.id)},
                {replace: true}
            );
        } else {
            XH.navigate(BASE_ROUTE, {replace: true});
        }
    }

    private docIdToRoute(docId: string): string {
        return docId.replaceAll('/', '~');
    }

    protected docRefFromRoute(params: Record<string, string>): {
        source: string;
        docId: string;
        section: string;
    } {
        const {source, docId, section} = params;
        if (!source || !docId) return null;
        return {source, docId: docId.replaceAll('~', '/'), section: section ?? null};
    }

    private async loadContentAsync(entry: DocEntry) {
        runInAction(() => (this.content = null));
        try {
            const content = await this.docService
                .fetchContentAsync(entry.source, entry.id)
                .linkTo(this.loadContentTask);
            runInAction(() => (this.content = content));
        } catch (e) {
            runInAction(() => {
                this.content = `## Error Loading Document\n\nFailed to load **${entry.title}**.\n\n\`${e.message}\``;
            });
            XH.handleException(e, {showAlert: false});
        }
    }
}
```

- [ ] **Step 2: Rebase `DocsPanelModel` to extend `DocViewModel`**

In `desktop/tabs/docs/DocsPanelModel.ts`: change the class to `extends DocViewModel`; delete the members now inherited (the `activeDoc`/`content`/`activeSection`/`pendingScrollSection` observables, `loadContentTask`, the `docService` getter, the five computeds, `navigateToDoc`, `navigateToCategory`, `setActiveSection`, `clearPendingScrollSection`, `updateDocFromRoute`, `updateRouteFromDoc`, `docIdToRoute`, `docRefFromRoute`, `loadContentAsync`, and the module-level `extractSections`/`stripInlineMarkdown`/`slugify` + the `DocSection` interface). Keep the desktop-only members: `gridModel`, `dockContainerModel`, `navPanelModel`, search state + methods, feedback methods, `buildTreeData`/`getCategoryIcon`/`getSourceIcon`, `onSelectionChange`, `loadNav`. Implement the grid-selection side effect via the `onDocActivated` hook, and drop search-mode exit into navigate by overriding `navigateToDoc`.

Resulting key changes:

```typescript
import {DocViewModel} from '../../../core/docs/DocViewModel';
import {DocCategory, DocEntry, DocExampleLink, getDocExamples} from './docRegistry';
// ...keep GridModel, DockContainerModel, PanelModel, Icon, mobx, DocSearchResult/DocService imports...

export class DocsPanelModel extends DocViewModel {
    // desktop-only observables/managed members stay (gridModel, dockContainerModel, navPanelModel,
    // searchQuery, searchMode, searchResults, selectedSearchIdx, feedbackMessage)

    constructor() {
        super();
        makeObservable(this);            // for the desktop-only observables added here
        this.gridModel = this.createGridModel();
        this.addReaction(
            {track: () => this.searchQuery, run: query => this.runSearch(query), debounce: 200},
            {track: () => this.searchResults, run: () => (this.selectedSearchIdx = -1)},
            {track: () => this.gridModel.selectedRecord, run: rec => this.onSelectionChange(rec)}
        );
    }

    override onLinked() {
        this.loadNav();                  // builds tree, then selects doc from route or registry[0]
    }

    /** Sync grid selection + exit search whenever a doc is activated. */
    protected override onDocActivated(entry: DocEntry) {
        const recId = `${entry.source}:${entry.id}`;
        this.gridModel.selectAsync(recId, {ensureVisible: true});
        this.searchMode = false;
    }

    @computed
    get activeDocExamples(): DocExampleLink[] {
        return this.activeDoc ? getDocExamples(this.activeDoc.id) : [];
    }

    // keep: enterSearchMode/exitSearchMode/toggleSearchMode/selectSearchResult/moveSearchSelection/
    // confirmSearchSelection/onSearchKeyDown/runSearch, feedback methods, buildTreeData, loadNav,
    // createGridModel, getCategoryIcon, getSourceIcon, onSelectionChange.
}
```

Note: `loadNav` currently calls `navigateToDoc` directly for the initial/default doc - that still works (inherited). The old `navigateToDoc` set `searchMode=false` and grid selection inline; both now happen via `onDocActivated`. Verify `loadNav`'s `registry[0]` default path still selects on first load.

- [ ] **Step 3: Typecheck + lint**

```bash
npx tsc --noEmit && yarn lint:code
```
Expected: 0 errors.

- [ ] **Step 4: Desktop regression - manual smoke (deferred to Task 5's shared verification if running headless now)**

If a dev server is up, load `http://localhost:3000/app`, open the Docs tab, and confirm: tree nav selects docs, breadcrumb dropdowns work, search (Shift+S) works, deep-link via a Resources doc link still opens the right doc + section. (Full regression is the gate at the end of Task 4.)

- [ ] **Step 5: Commit**

```bash
git add client-app/src/core/docs/DocViewModel.ts client-app/src/desktop/tabs/docs/DocsPanelModel.ts
git commit -m "Extract headless DocViewModel base; rebase desktop DocsPanelModel onto it"
```

---

## Task 3: Extract shared `docContent` component (with code-block copy); use it on desktop

**Files:**
- Create: `client-app/src/core/docs/DocContent.ts`
- Create: `client-app/src/core/docs/DocContent.scss`
- Modify: `client-app/src/desktop/tabs/docs/DocsTab.ts` (replace inlined `contentBody` with shared `docContent`)
- Modify: `client-app/src/desktop/tabs/docs/DocsTab.scss` (move/adjust body styles if needed)

**Interfaces:**
- Consumes: `DocViewModel` (Task 2).
- Produces: `docContent` - `hoistCmp.factory<DocViewModel>` rendering the scrollable markdown body. Takes the model via context or explicit `model` prop. Self-contained: H2 anchor assignment, scroll-spy (`setActiveSection`), link interception (anchor scroll / `resolveContentLink` -> `navigateToDoc` / external `window.open`), and a copy button per fenced code block.

- [ ] **Step 1: Create `core/docs/DocContent.ts`**

Lift the desktop `contentBody` logic (`DocsTab.ts:420-530`) into a shared factory keyed on `DocViewModel`. Add code-block copy: after content renders, for each `pre > code` block, inject a small copy button that writes `code.textContent` to the clipboard and toasts. Use platform-neutral imports only (`@xh/hoist/cmp/layout`, `@xh/hoist/cmp/markdown`, `@xh/hoist/core`, `@xh/hoist/icon`, `react`).

```typescript
import {div} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import React, {useCallback, useEffect, useRef} from 'react';
import {DocViewModel} from './DocViewModel';
import './DocContent.scss';

/**
 * Shared, platform-neutral document body: renders the active doc's markdown, assigns slug ids to
 * H2 headings, tracks the active section on scroll, intercepts in-content link clicks (anchor
 * scroll / internal doc navigation / external open), and adds a tap-to-copy control to each fenced
 * code block. Rendered by both the desktop Docs tab and the mobile Docs page inside their own shells.
 */
export const docContent = hoistCmp.factory<DocViewModel>({
    displayName: 'DocContent',
    model: uses(DocViewModel),
    className: 'xh-doc-content',

    render({model, className}) {
        const {content, activeDoc, pendingScrollSection} = model,
            scrollRef = useRef<HTMLDivElement>(null);

        // Scroll to top when the active doc changes.
        useEffect(() => {
            scrollRef.current?.scrollTo(0, 0);
        }, [activeDoc]);

        // After content renders: assign H2 slug ids, wire scroll-spy, and add copy buttons.
        useEffect(() => {
            const container = scrollRef.current;
            if (!container || !content) return;

            const headings = container.querySelectorAll('h2'),
                secs = model.sections;
            headings.forEach((h2, i) => {
                if (i < secs.length) h2.id = secs[i].id;
            });

            const cleanups = addCopyButtons(container);

            let ticking = false;
            const onScroll = () => {
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(() => {
                    const containerTop = container.getBoundingClientRect().top;
                    let activeId: string = null;
                    container.querySelectorAll('h2[id]').forEach(h2 => {
                        if (h2.getBoundingClientRect().top <= containerTop + 60) activeId = h2.id;
                    });
                    if (activeId !== model.activeSection) model.setActiveSection(activeId);
                    ticking = false;
                });
            };
            container.addEventListener('scroll', onScroll, {passive: true});

            return () => {
                container.removeEventListener('scroll', onScroll);
                cleanups.forEach(fn => fn());
            };
        }, [model, content]);

        // Honor a deep-link's requested section once content has rendered.
        useEffect(() => {
            if (!content || !pendingScrollSection) return;
            window.requestAnimationFrame(() => {
                const target = document.getElementById(pendingScrollSection);
                if (target) {
                    target.scrollIntoView({block: 'start'});
                    model.setActiveSection(pendingScrollSection);
                }
                model.clearPendingScrollSection();
            });
        }, [model, content, pendingScrollSection]);

        const handleLinkClick = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                const anchor = (e.target as HTMLElement).closest('a');
                if (!anchor) return;
                const href = anchor.getAttribute('href');
                if (!href) return;

                if (href.startsWith('#')) {
                    e.preventDefault();
                    const el = document.getElementById(href.slice(1));
                    if (el) {
                        el.scrollIntoView({behavior: 'smooth', block: 'start'});
                        model.setActiveSection(href.slice(1));
                    }
                    return;
                }

                if (model.activeDoc && !href.startsWith('http')) {
                    e.preventDefault();
                    const target = model.resolveContentLink(href);
                    if (target) model.navigateToDoc(target.id, target.source);
                    // Unresolved relative links (e.g. .ts source files) are silently consumed to
                    // prevent the browser from navigating away from the SPA.
                    return;
                }

                if (href.startsWith('http')) {
                    e.preventDefault();
                    window.open(href, '_blank', 'noopener');
                }
            },
            [model]
        );

        if (!content) return null;

        return div({
            className,
            ref: scrollRef,
            onClick: handleLinkClick,
            item: div({
                className: 'xh-doc-content__inner',
                item: markdown({content, lineBreaks: false})
            })
        });
    }
});

/**
 * Inject a copy button into each fenced code block. Returns cleanup fns to remove listeners. The
 * detail developers actually want on a phone: tap to copy a snippet rather than fighting selection.
 */
function addCopyButtons(container: HTMLElement): Array<() => void> {
    const cleanups: Array<() => void> = [];
    container.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.xh-doc-content__copy')) return;
        const code = pre.querySelector('code');
        if (!code) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'xh-doc-content__copy';
        btn.setAttribute('aria-label', 'Copy code');
        btn.textContent = 'Copy';
        const onClick = (e: MouseEvent) => {
            e.stopPropagation();
            const text = code.textContent ?? '';
            navigator.clipboard?.writeText(text).then(
                () => {
                    btn.textContent = 'Copied';
                    XH.toast({message: 'Copied to clipboard', intent: 'success'});
                    window.setTimeout(() => (btn.textContent = 'Copy'), 1500);
                },
                () => XH.toast({message: 'Copy failed', intent: 'danger'})
            );
        };
        btn.addEventListener('click', onClick);
        pre.appendChild(btn);
        cleanups.push(() => btn.removeEventListener('click', onClick));
    });
    return cleanups;
}
```

- [ ] **Step 2: Create `core/docs/DocContent.scss`**

Provide the body layout + copy-button styling, tokenized. Position `pre` relative so the copy button can anchor top-right. Reuse existing desktop body rules as a base (move the relevant `.tb-docs__content-body`/`-inner` rules here under the new class names) so desktop visual output is unchanged.

```scss
.xh-doc-content {
    flex: 1;
    overflow-y: auto;

    &__inner {
        max-width: 820px;
        margin: 0 auto;
        padding: var(--xh-pad-double-px);
    }

    pre {
        position: relative;
    }

    &__copy {
        position: absolute;
        top: var(--xh-pad-half-px);
        right: var(--xh-pad-half-px);
        font-size: var(--xh-font-size-small-px);
        padding: 2px 8px;
        border-radius: var(--xh-border-radius-px);
        border: var(--xh-border-solid);
        background: var(--xh-bg-alt);
        color: var(--xh-text-color-muted);
        cursor: pointer;
        opacity: 0.75;

        &:hover {
            opacity: 1;
            color: var(--xh-text-color);
        }
    }
}
```

(Adjust `max-width`/padding to match the current desktop `tb-docs__content-inner` values - copy them from `DocsTab.scss` so desktop is pixel-identical.)

- [ ] **Step 3: Use `docContent` in `DocsTab`**

In `desktop/tabs/docs/DocsTab.ts`: delete the inlined `contentBody` factory (lines ~420-530) and its now-unused imports; in `contentPanel`, set `item: docContent()`. Add `import {docContent} from '../../../core/docs/DocContent';`. Remove the body styles from `DocsTab.scss` that moved to `DocContent.scss` (keep nav/toolbar/breadcrumb/search styles).

```typescript
// in contentPanel render(), the panel body:
item: docContent(),
```

- [ ] **Step 4: Typecheck + lint**

```bash
npx tsc --noEmit && yarn lint:code
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add client-app/src/core/docs/DocContent.ts client-app/src/core/docs/DocContent.scss client-app/src/desktop/tabs/docs/DocsTab.ts client-app/src/desktop/tabs/docs/DocsTab.scss
git commit -m "Extract shared docContent component with code-block copy; adopt on desktop"
```

---

## Task 4: Desktop regression verification (gate before mobile work)

No code; a verification gate. The extraction must leave desktop functionally identical (plus the new copy buttons).

- [ ] **Step 1: Start the dev server** (if not already running) per Task 6's run setup, or reuse a running instance.

- [ ] **Step 2: Verify the desktop Docs viewer** at `http://localhost:3000/app` -> Docs tab:
  - Tree nav selects docs; breadcrumb category/doc/section dropdowns work.
  - Search (Shift+S) opens, returns ranked results, Enter/arrows/Escape work, selecting navigates.
  - "On this page" scroll + scroll-spy active-section highlight track correctly.
  - In-content doc->doc links navigate; external links open a new tab; `#` anchors scroll.
  - Deep-link: from a desktop example's Resources, click a `.md` doc link -> opens the right doc (+ section).
  - New: each code block shows a Copy button that copies and toasts.
  - Feedback ("Report Doc Issue") dock opens, composes, submits.
  - Console clean (no errors/warnings introduced).

- [ ] **Step 3:** If any regression, fix before proceeding. Commit fixes with a clear message. Do not start mobile work until desktop is clean.

---

## Task 5: Mobile reader - model, page, route, service install

**Files:**
- Create: `client-app/src/mobile/docs/DocsPageModel.ts`
- Create: `client-app/src/mobile/docs/DocsPage.ts`
- Create: `client-app/src/mobile/docs/DocsPage.scss`
- Modify: `client-app/src/mobile/AppModel.ts` (service install + route + Navigator page)

**Interfaces:**
- Consumes: `DocViewModel`, `docContent` (Tasks 2-3); `DocService`; mobile kit (`panel`, `button`, `toolbar`); `NavigatorModel`.
- Produces: `docsPage` (Navigator page factory), `DocsPageModel`.

- [ ] **Step 1: Create `DocsPageModel`**

Thin subclass: reads initial route params on link, delegates everything to the base. Reads `source`/`docId`/`section` either from `componentProps` (Navigator passes route params as props) or via the inherited route reaction; calling `loadInitialDocFromRoute()` onLinked covers the first mount. Adds no new observables (so no `makeObservable` needed).

```typescript
import {DocViewModel} from '../../core/docs/DocViewModel';

/**
 * Mobile Docs reader model. The `default.docs.docRef` route is the source of truth for which doc is
 * shown, so this adds nothing to the shared `DocViewModel` beyond initializing from the route on mount.
 */
export class DocsPageModel extends DocViewModel {
    override onLinked() {
        this.loadInitialDocFromRoute();
    }
}
```

- [ ] **Step 2: Create `DocsPage`**

A Navigator page: mobile `panel` whose title is the active doc title (with a back-capable header - the Navigator provides the back button automatically for pushed pages), a header row showing breadcrumb context (source > category) and an "On this page" button that opens a section jump menu, and the shared `docContent` as the body. Use the mobile kit only.

```typescript
import {filler, hbox, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/mobile/cmp/button';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {docContent} from '../../core/docs/DocContent';
import {DocService} from '../../core/svc/DocService';
import {DocsPageModel} from './DocsPageModel';
import './DocsPage.scss';

export const docsPage = hoistCmp.factory({
    displayName: 'DocsPage',
    model: creates(DocsPageModel),

    render({model}) {
        const {activeDoc, loadContentTask} = model;
        return panel({
            className: 'tb-docs-page',
            title: activeDoc?.title ?? 'Docs',
            icon: Icon.book(),
            mask: loadContentTask,
            tbar: breadcrumbBar(),
            item: docContent({model})
        });
    }
});

/** Lightweight context row: source > category, plus an "On this page" section jump. */
const breadcrumbBar = hoistCmp.factory<DocsPageModel>({
    render({model}) {
        const {activeSource, activeCategory, sections} = model;
        if (!activeSource) return null;
        const sourceLabel = DocService.instance.getSourceLabel(activeSource);
        return hbox({
            className: 'tb-docs-page__crumb',
            items: [
                span({className: 'tb-docs-page__crumb-src', item: sourceLabel}),
                activeCategory
                    ? span({
                          className: 'tb-docs-page__crumb-sep',
                          item: Icon.chevronRight()
                      })
                    : null,
                activeCategory
                    ? span({className: 'tb-docs-page__crumb-cat', item: activeCategory.title})
                    : null,
                filler(),
                onThisPageButton({omit: !sections.length})
            ]
        });
    }
});

/** Opens a section jump menu (mobile menu/popover); selecting scrolls the body to that H2. */
const onThisPageButton = hoistCmp.factory<DocsPageModel>({
    render({model}) {
        return button({
            icon: Icon.list(),
            text: 'On this page',
            minimal: true,
            onClick: () => openSectionMenu(model)
        });
    }
});

function openSectionMenu(model: DocsPageModel) {
    // Implementation note: present model.sections as a tappable list. Use the mobile kit's
    // menu/popover or a compact selector; on select, scroll to the heading id and setActiveSection.
    // (Final widget chosen during implementation - see Step 3 for the scroll mechanics.)
}
```

Note: the precise "On this page" widget (mobile popover/menu vs. a compact bottom selector) is chosen during implementation from the available `@xh/hoist/mobile` kit - consult the hoist-react reference (`hoist-search-symbols` for mobile menu/popover) before building. The behavior is fixed: list `model.sections`, and on select scroll the rendered body to `document.getElementById(section.id)` and call `model.setActiveSection(id)`. If the kit lacks a suitable lightweight menu, fall back to a compact `pullUpSheet`-free list rendered in a small dialog/popover.

- [ ] **Step 3: Create `DocsPage.scss`**

```scss
.tb-docs-page {
    &__crumb {
        align-items: center;
        gap: var(--xh-pad-half-px);
        padding: 0 var(--xh-pad-px);
        font-size: var(--xh-font-size-small-px);
        color: var(--xh-text-color-muted);
    }

    &__crumb-sep {
        opacity: 0.6;
    }
}
```

- [ ] **Step 4: Wire mobile `AppModel`** - install service, add route, register page.

In `mobile/AppModel.ts`:
- import `DocService` and `docsPage`.
- add `DocService` to `installServicesAsync`:
```typescript
await XH.installServicesAsync([DocService, GitHubService, PortfolioService], ctx);
```
- register the Navigator page (add to `pages` array):
```typescript
{id: 'docs', content: docsPage},
```
- add the route as a child of `default` (alongside the existing children):
```typescript
{
    name: 'docs',
    path: '/docs',
    children: [{name: 'docRef', path: '/:source/:docId?section'}]
}
```

- [ ] **Step 5: Typecheck + lint**

```bash
npx tsc --noEmit && yarn lint:code
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add client-app/src/mobile/docs client-app/src/mobile/AppModel.ts
git commit -m "Add mobile Docs reader page, model, route, and service install"
```

---

## Task 6: Wire mobile Resources "Docs" links to the reader

**Files:**
- Modify: `client-app/src/mobile/cmp/example/ExampleScreen.ts` (`resourcesSegment` `onClick`)

**Interfaces:**
- Consumes: `docRouteParams` (Task 1), `XH.navigate`.

- [ ] **Step 1: Route `.md` links into the reader**

In `ExampleScreen.ts`, import `docRouteParams` from `core/docs/DocUtils`. In `resourcesSegment`, replace the unconditional `window.open(toolboxUrl(link.url), '_blank')` with: doc links navigate to `default.docs.docRef`; everything else keeps opening the browser.

```typescript
import {docRouteParams} from '../../../core/docs/DocUtils';

// inside resourcesSegment, the resource row onClick:
onClick: () => openResource(link.url),
```

Add the helper near the link helpers at the bottom of the file:

```typescript
/** Doc links deep-link into the in-app reader; code/external links open the system browser. */
function openResource(url: string) {
    const ref = docRouteParams(url);
    if (ref) {
        const params: Record<string, string> = {source: ref.source, docId: ref.docId};
        if (ref.section) params.section = ref.section;
        XH.navigate('default.docs.docRef', params);
        return;
    }
    window.open(toolboxUrl(url), '_blank');
}
```

Add `XH` to the `@xh/hoist/core` import in this file.

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && yarn lint:code
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add client-app/src/mobile/cmp/example/ExampleScreen.ts
git commit -m "Deep-link mobile Resources Docs links into the in-app reader"
```

---

## Task 7: Full verification (browser + on-device) and best-practices code review

**Files:** none (verification + review).

- [ ] **Step 1: Run the server on the local IP** (so the user can test on their phone). Backend on :8080, frontend bound to the LAN IP. See the run commands in the chat / `docs/running-locally.md`. Log in with the local-only test admin: `admin@xh.io`. Force portrait when testing the mobile app in a desktop browser (override `screen.orientation.type` to `portrait-primary` + dispatch `resize`).

- [ ] **Step 2: Mobile reader flows** (browser at `http://localhost:3000/mobile`, then on device):
  - From an example (e.g. Grid) open the Resources sheet, tap a "Docs" link -> the reader opens that doc inside the app (no browser tab).
  - Doc renders as markdown; code blocks show a working Copy button.
  - "On this page" lists H2 sections; tapping one scrolls to it.
  - An in-content doc->doc link navigates within the reader; an external/library link opens the browser; `#` anchors scroll.
  - Back returns to the originating example screen.
  - A link with a `#section` (e.g. `$HR/cmp/form/README.md#formmodel` from the Form example) lands scrolled to that section.
  - Light and dark themes both render correctly.
  - Console clean.

- [ ] **Step 3: Desktop regression re-confirm** (Task 4 checklist) - the shared extraction did not change desktop behavior.

- [ ] **Step 4: Final lint/typecheck sweep**

```bash
npx tsc --noEmit && yarn lint
```
Expected: 0 errors across code + styles.

- [ ] **Step 5: Best-practices code review (dedicated subagent)**

Dispatch a code-review subagent that FIRST reads the relevant hoist-core / hoist-react best-practice docs (via the `xh:using-hoist-react-reference` skill + `hoist-search-docs`/`hoist-search-symbols` tools), THEN reviews the full diff for (a) general correctness and (b) expression of Hoist coding conventions and best practices - with particular attention to the shared/platform code split in `core/docs/` (clean boundaries, no platform leakage, idiomatic model/component patterns, observable/action correctness, `makeObservable` placement). Capture findings, address actionable ones, and re-verify.

- [ ] **Step 6: Summary commit / changelog** - add a `CHANGELOG.md` entry under the current SNAPSHOT (single-line bullet) describing the in-app mobile docs reader + the shared `core/docs` extraction, and ensure all work is committed on `mobile-upgrade-docs-1`.

---

## Self-Review (against the spec)

- **Single-doc viewer, deep-link target:** Tasks 5-6. ✓
- **Render markdown, "On this page", breadcrumb context:** Task 5 (`DocsPage`, `breadcrumbBar`, `onThisPageButton`). ✓
- **Tap-to-copy code blocks:** Task 3 (`addCopyButtons` in shared `docContent`; desktop inherits per spec). ✓
- **In-content link handling (anchor/doc/external):** Task 3 (`handleLinkClick`) reusing `resolveContentLink`. ✓
- **Resources `.md` deep-link wiring:** Task 6. ✓
- **Shared `core/docs` split (types, utils, `DocViewModel`, `docContent`); `DocService` stays in core/svc:** Tasks 1-3. ✓
- **Route `default.docs.docRef`, Navigator page, service install:** Task 5. ✓
- **Desktop functionally identical (regression gate):** Tasks 2-4 + Task 7 step 3. ✓
- **No search / browse / related-examples / feedback on mobile (Phase 2 out of scope):** not implemented; `DocViewModel` retains category/sibling computeds to seed Phase 2. ✓
- **Theming dark+light:** Task 7 step 2. ✓
- **Closing best-practices-first review:** Task 7 step 5. ✓

Type-consistency note: `navigateToDoc(docId, source?, section?)`, `resolveContentLink(href)`, `setActiveSection(id)`, `clearPendingScrollSection()`, `sections`/`activeSection`/`pendingScrollSection`/`activeDoc`/`content` names are used identically across Tasks 2, 3, 5, 6. The `onDocActivated` hook (Task 2) is the single seam desktop uses for grid selection.
