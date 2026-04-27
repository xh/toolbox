# CLAUDE.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Toolbox is a full-stack Hoist application by Extremely Heavy Industries (XH) that serves as the
primary demo, test, and reference implementation for the **Hoist UI framework**. It includes
desktop, mobile, and admin apps plus several standalone example applications (contact, todo,
portfolio, news, recalls, filemanager).

Toolbox is also the primary development and testing vehicle for the Hoist framework itself. XH
developers commonly work with local sibling checkouts of the framework libraries (`../hoist-react`
and `../hoist-core`), using `yarn startWithHoist` and `runHoistInline=true` to develop framework
features inline and test them in Toolbox. Two framework plugins are central to work in this repo:

- **`@xh/hoist`** (hoist-react) — the client-side React/MobX framework
- **`hoist-core`** — the server-side Grails/Spring Boot framework

Understanding these frameworks is essential to writing correct, idiomatic code in this application.

## Hoist Framework Documentation — READ THIS FIRST

### hoist-react (client-side)

Read the Architecture Primer below, then use the Hoist Developer Tools for full documentation on
any package.

#### Architecture Primer

Hoist applications are built around three artifact types:

| Artifact | Base Class | Purpose | Lifecycle |
|----------|------------|---------|-----------|
| **Component** | `hoistCmp.factory` | UI rendering (React) | Transient — mount/unmount with views |
| **Model** | `HoistModel` | Observable state + business logic | Varies — linked to component or standalone |
| **Service** | `HoistService` | App-wide data access + shared state | Singleton — lives for app lifetime |

**Element factories over JSX.** Hoist uses element factory functions, not JSX:
```typescript
// ✅ Hoist style
panel({title: 'Users', items: [grid(), button({text: 'Refresh'})]})

// ❌ Not used in Hoist
<Panel title="Users"><Grid /><Button text="Refresh" /></Panel>
```

**Components** are created with `hoistCmp.factory`. Each component declares its model relationship:
```typescript
export const userList = hoistCmp.factory({
    model: creates(UserListModel),  // Component creates and owns this model
    render({model}) {
        return panel({title: 'Users', item: grid()});
    }
});
```

**Model wiring — `creates()` vs `uses()`:**
- `creates(ModelClass)` — component instantiates, owns, and destroys the model on unmount.
- `uses(ModelClass)` — component receives model from a parent via context or explicit prop.

**Context-based model lookup** eliminates prop drilling. When a component `creates()` a model, that
model is published to React context. Child components using `uses(ModelClass)` automatically find
the nearest matching model in the ancestor tree. All public properties of ancestor models are
searched — so if `PanelModel` has a `gridModel: GridModel` property, a child `grid()` call
resolves it automatically. (Note: `@managed` is unrelated to lookup — it controls cleanup on
destroy. A property does not need `@managed` to be found via context lookup.)

When multiple models of the same type exist in context (e.g. two `GridModel` instances), pass the
model explicitly: `grid({model: model.leftGridModel})`.

**HoistModel** — the core state holder:
```typescript
class UserListModel extends HoistModel {
    @observable.ref users: User[] = [];
    @bindable selectedUserId: string = null;
    @managed detailModel = new UserDetailModel();

    constructor() {
        super();
        makeObservable(this);  // Required when class adds new observables
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const users = await XH.fetchJson({url: 'api/users', loadSpec});
        runInAction(() => this.users = users);
    }
}
```

**Key decorators:**

| Decorator | Purpose |
|-----------|---------|
| `@observable` / `@observable.ref` | MobX observable state |
| `@bindable` | Observable + auto-generated action-wrapped setter |
| `@managed` | Mark child object for automatic cleanup on `destroy()` |
| `@persist` | Sync property with a persistence provider (requires `persistWith`) |
| `@lookup(ModelClass)` | Inject ancestor model (linked models only, available after `onLinked`) |
| `@computed` | Cached derived value |
| `@action` | Mark method as state-modifying |

**`makeObservable(this)`** must be called in the constructor of any class that introduces new
`@observable`, `@bindable`, or `@computed` properties. The base class call does not cover subclass
decorators. Forgetting this is the most common Hoist bug.

**`doLoadAsync(loadSpec)`** — implement this template method to opt into managed data loading.
Call `model.loadAsync()` or `model.refreshAsync()` to trigger — never call `doLoadAsync` directly.
Linked models with `doLoadAsync` are loaded automatically on mount.

**HoistService** — singleton services installed during app init and accessed via `XH`:
```typescript
XH.tradeService.submitTradeAsync(trade);  // Custom service
XH.fetchJson({url: 'api/data'});          // FetchService alias
XH.getConf('featureFlag', false);         // ConfigService alias
XH.getPref('pageSize', 50);              // PrefService alias
```

**XH singleton** — the top-level API entry point. Provides service access, data fetching
(`fetchJson`, `postJson`), user interaction (`toast`, `confirm`, `prompt`, `handleException`),
navigation (`navigate`, `appendRoute`), and app state (`appState`, `darkTheme`).

**Critical pitfalls:**
1. **Forgetting `makeObservable(this)`** — observables silently won't react.
2. **Managing objects you don't own** — only `@managed` objects your class creates. Objects passed
   in from outside are owned by the provider.
3. **Mutating observables outside actions** — use `runInAction()`, `@action`, or `@bindable`.
4. **Calling `lookupModel()` too early** — only works during or after `onLinked()`.
5. **Calling `doLoadAsync()` directly** — use `loadAsync()` / `refreshAsync()` entry points.

#### Quick Reference — MCP Doc IDs by Task

Use `hoist-search-docs` with the doc ID for full documentation on any topic.

| If you need to... | Doc ID |
|---|---|
| Understand the component/model/service pattern | `core` |
| Work with Stores, Records, Fields, or Filters | `data` |
| Fetch data, read configuration, or manage preferences | `svc` |
| Build or configure a data grid | `cmp/grid` |
| Build a form with validation | `cmp/form` |
| Understand input change/commit lifecycle | `cmp/input` |
| Use layout containers (Box, HBox, VBox) | `cmp/layout` |
| Create a tabbed interface | `cmp/tab` |
| Save and restore named view configurations | `cmp/viewmanager` |
| Build a configurable dashboard with draggable widgets | `desktop/cmp/dash` |
| Configure a desktop panel (toolbars, masks, collapse) | `desktop/cmp/panel` |
| Build a mobile app | `mobile` |
| Format numbers, dates, or currencies | `format` |
| Understand app lifecycle and startup sequence | `lifecycle-app` |
| Understand model/service lifecycles and loading | `lifecycle-models-and-services` |
| Add authentication (OAuth, login) | `authentication` |
| Persist UI state (columns, filters, panel sizes) | `persistence` |
| Check roles, gates, or app access | `authorization` |
| Configure client-side routing | `routing` |
| Handle exceptions and display errors | `error-handling` |
| Add testId selectors for test automation | `test-automation` |
| Use Promises with error handling and tracking | `promise` |
| Work with MobX observables and `@bindable` | `mobx` |
| Use timers, decorators, or utility functions | `utils` |
| Configure the app shell, dialogs, toasts, or theming | `appcontainer` |
| Use icons in buttons, menus, and grids | `icon` |
| Configure OAuth with Auth0 or Microsoft Entra | `security` |

#### Hoist Developer Tools

For full documentation beyond this primer, use the hoist-react developer tools. Two interfaces are
available. Both share the same underlying registries and produce identical output:

**MCP Server (hoist-react)** — If a hoist-react MCP server is configured in your environment, use
the `hoist-search-docs`, `hoist-list-docs`, `hoist-search-symbols`, `hoist-get-symbol`, and
`hoist-get-members` tools, plus `hoist://docs/{id}` resources for direct document access.

**CLI Tools** — For environments without MCP support, or when you prefer shell commands. These are
`bin` entries in the hoist-react `package.json` and are available via `npx` in any project that
depends on hoist-react. **You must run these from the `client-app/` directory** (where hoist-react is
installed as a dependency) — they will not resolve from the project root. Ensure `yarn install` has
been run in `client-app/` first.

```bash
cd client-app

# Documentation
npx hoist-docs search "grid sorting"         # Search all docs by keyword
npx hoist-docs read cmp/grid                 # Read a specific doc by ID
npx hoist-docs list                          # List all available docs
npx hoist-docs conventions                   # Print coding conventions
npx hoist-docs index                         # Print the documentation catalog

# TypeScript symbols and types
npx hoist-ts search GridModel                # Search for symbols and class members
npx hoist-ts symbol GridModel                # Get detailed type info for a symbol
npx hoist-ts members GridModel               # List all members of a class/interface
```

**Use `search` for discovery** — it does case-insensitive fuzzy matching across both symbol names
and class members. Use `symbol` and `members` only when you already know the exact PascalCase name.
Run `npx hoist-docs --help` and `npx hoist-ts --help` for full usage.

**Skipping the docs risks producing code that conflicts with established patterns or misses
built-in functionality.**

### hoist-core (server-side)

The hoist-core repository has comprehensive documentation covering server-side architecture,
services, and conventions across 20+ feature docs and upgrade notes. Use the **hoist-core MCP
tools** (`hoist-core-search-docs`, `hoist-core-list-docs`, `hoist-core-search-symbols`,
`hoist-core-get-symbol`, `hoist-core-get-members`) to search and browse this documentation and
inspect Groovy/Java symbols — just as you would use the hoist-react MCP tools for client-side work.

For direct browsing, the docs are also available via the public GitHub repository at
https://github.com/xh/hoist-core/tree/develop/docs or a local sibling checkout (`../hoist-core`).
For topics not yet covered by docs, refer to the existing source code in `grails-app/`.

## MCP Servers

This project configures MCP (Model Context Protocol) servers in `.mcp.json` that provide additional
tools to AI coding agents. Servers must also be listed in `.claude/settings.json` under
`enabledMcpjsonServers` to be active.

### hoist-react (enabled by default)

A local Node.js process that exposes hoist-react framework documentation and symbol search. The
Architecture Primer above covers essential patterns inline; the MCP provides full documentation
for all packages and concepts. No additional setup is required; it runs directly from installed
`node_modules`.

### hoist-core (enabled by default)

A Groovy-based MCP server that exposes hoist-core framework documentation and Groovy/Java symbol
inspection. It provides documentation search across all feature docs and upgrade notes, plus
AST-based symbol search for classes, services, controllers, and their members. The server runs via
a bootstrap script that auto-builds from a local sibling checkout (when `runHoistInline=true` in
`gradle.properties`) or downloads a published JAR for the version specified in `gradle.properties`.
Requires Java 17+.

### github (opt-in)

A Docker-based server providing GitHub API tools (issues, PRs, code search, etc.) via the official
`github-mcp-server` image. This server is configured in `.mcp.json` but **not enabled by default**
— it requires Docker and a GitHub token, which not all developers will have running. If you work
with GitHub issues, PRs, or code search, enabling it is recommended. To do so:

1. Install and start **Docker**
2. Set the **`GITHUB_TOKEN`** environment variable to a GitHub Personal Access Token
3. Add `"github"` to `enabledMcpjsonServers` in `.claude/settings.local.json`:
   ```json
   {
     "enabledMcpjsonServers": ["hoist-react", "hoist-core", "github"]
   }
   ```

Local settings merge with the shared `settings.json`, so enabling it locally does not affect other
developers. If Docker is not running or the token is not set when the server is enabled, Claude
Code may show errors on startup — remove `"github"` from your local settings to resolve.

### jetbrains (opt-in)

A JetBrains MCP server is also configured in `.mcp.json`, providing tools for interacting with
the IntelliJ IDE (file navigation, code inspections, refactoring, terminal commands, etc.).
This server must be enabled within IntelliJ's settings and requires a running IDE instance to
connect. Add `"jetbrains"` to `enabledMcpjsonServers` in `.claude/settings.local.json` to
enable it for Claude Code.

## Plugins

### TypeScript LSP (enabled by default)

The `typescript-lsp` plugin is enabled in `.claude/settings.json` and provides code intelligence
(go-to-definition, find references, hover info, call hierarchy, etc.) for TypeScript and JavaScript
files via the LSP tool. The plugin is auto-installed by Claude Code, but it requires the
**`typescript-language-server`** binary to be installed on your machine:

```bash
npm install -g typescript-language-server typescript
```

If the binary is not installed, LSP tool calls will fail silently. Verify your install with
`typescript-language-server --version`.

### Java LSP (enabled by default)

The `jdtls-lsp` plugin is enabled in `.claude/settings.json` and provides code intelligence
(hover info, document symbols, find references, call hierarchy, etc.) for Java files via the LSP
tool. The plugin is auto-installed by Claude Code, but it requires the **`jdtls`** binary to be
installed on your machine:

```bash
brew install jdtls
```

If the binary is not installed, LSP tool calls will fail silently. Verify your install with
`jdtls --version`.

In this mixed Java/Groovy project, jdtls works well for Java-specific operations within `.java`
files — hover, document symbols, find references, and call hierarchy all return useful results.
However, **go-to-definition does not resolve Groovy classes** (e.g. services and domain objects
defined in `.groovy` files), and **workspace symbol search may return empty results** since the
server only indexes Java source. For navigating into Groovy code, use Grep/Glob tools instead.

## Tech Stack

- **Frontend**: TypeScript, React 18, MobX, AG Grid, Highcharts, `@xh/hoist` framework
- **Backend**: Grails 7 (Groovy/Spring Boot), `hoist-core` framework
- **JDK**: Java 25 is required for local development and CI. The Gradle toolchain in
  `build.gradle` pins the language level to 25. (Note that `hoist-core` itself is separately
  pinned to Java 17 bytecode so its published JAR remains runnable by client apps on JDK 17+.)
- **Database**: MySQL (or H2 in-memory for quick local dev via `APP_TOOLBOX_USE_H2=true`)
- **Package Manager**: Yarn 1.22 (frontend), Gradle via wrapper (backend)

## Common Commands

### Frontend (run from `client-app/`)
```bash
yarn install              # Install dependencies
yarn start                # Dev server on port 3000
yarn build                # Production build
yarn lint                 # Run ESLint + Stylelint
yarn lint:code            # ESLint only
yarn lint:styles          # Stylelint only
yarn startWithHoist       # Dev server using local sibling hoist-react
```

### Backend (run from project root)
```bash
./gradlew bootRun     # Start Grails server on port 8080
./gradlew console     # Grails interactive console
```

### Local Development
Run both simultaneously:
- Terminal 1: `./gradlew bootRun`
- Terminal 2: `cd client-app && yarn start`

### App URLs during Local Development

The webpack dev server runs on **`http://localhost:3000`**. Each file in `client-app/src/apps/`
defines an entry point, and its filename (minus the extension) becomes the URL path. For example,
`apps/app.ts` → `http://localhost:3000/app`.

**Primary entry points** (the ones you'll use most often for interactive testing):

| App | URL |
|-----|-----|
| Desktop app | http://localhost:3000/app |
| Admin console | http://localhost:3000/admin |
| Mobile app | http://localhost:3000/mobile |

**Example apps**: `/contact`, `/todo`, `/portfolio`, `/news`, `/recalls`, `/fileManager`, `/weather`
— each at `http://localhost:3000/<name>`.

### Pre-commit Hooks
Husky runs automatically on commit: `lint-staged` (prettier + eslint on staged files) and conditionally the TypeScript compiler if TS/JS/package files are staged.

## Code Style

- **Prettier**: 100 char width, single quotes, no trailing commas, 4-space indent (JS/TS), 2-space (SCSS/JSON)
- **No bracket spacing**: `{foo}` not `{ foo }`
- **Arrow parens**: avoid when possible (`x => x` not `(x) => x`)
- **Semicolons**: always
- **Trailing commas**: none

**Commit messages, PRs, and comments**: Do not hard-wrap lines at a fixed column width in commit
message bodies, pull request descriptions, or issue/PR comments — let the viewing tool handle
display wrapping. However, do use line breaks for structure: separate logical points into bullet
lists, use blank lines between paragraphs, and break after the subject line. Keep PR descriptions
concise — XH developers review these regularly, so favor brief summaries over exhaustive detail.
Bullet the key changes and let the diff and any upgrade notes speak for themselves.

**Feature branch workflow**: On feature branches, prefer multiple small commits over amending — PRs
are squash-merged into `develop`, so intermediate commits are collapsed automatically. Never
force-push a feature branch; if the branch falls behind `develop`, use a simple merge commit rather
than a rebase. Merge commits and extra commits are harmless on feature branches and are squashed out
on merge, while force-pushes risk losing work and complicate collaboration.


## Telemetry

**Span names**: When naming custom OTEL spans passed to `withSpanAsync` or `FetchOptions.span`,
use a dotted namespace of `toolbox.<sub-app>.<action>` for example apps (e.g.
`toolbox.weatherv2.loadViews`, `toolbox.weather.loadDashboardData`), or `toolbox.<action>` for
the main desktop/admin/mobile apps. The `xh.*` prefix is reserved for framework-owned spans per
the hoist-react v85 upgrade notes, so the `toolbox.*` prefix keeps app spans cleanly
distinguishable from framework spans in the trace view.


## Architecture

### Frontend (`client-app/src/`)
- **`apps/`** — Entry points for each app (app.ts, admin.ts, contact.ts, etc.). Each calls `XH.renderApp()`.
- **`desktop/`** — Main desktop app: `AppModel.ts` (state) + `AppComponent.tsx` (UI), organized into `tabs/` (home, forms, grids, charts, layout, panels, other, examples).
- **`mobile/`** — Mobile app variant.
- **`admin/`** — Admin console.
- **`examples/`** — Standalone example applications (contact, todo, portfolio, news, recalls, filemanager).
- **`core/`** — Shared services (`svc/`), auth (`AuthModel.ts`), column definitions.
- **`Bootstrap.ts`** — AG Grid & Highcharts license/module registration.

**Key pattern**: Apps follow Model + Component pairing. Models hold state (MobX observables), Components render UI. Services are singleton classes for data fetching and business logic. See the hoist-react docs (referenced above) for detailed coverage of this architecture.

### Backend (`grails-app/`)
- **`controllers/`** — REST controllers extending `BaseController` (from hoist-core). Package: `io.xh.toolbox.*`
- **`services/`** — Business logic extending `BaseService`. Support `CachedValue`, `clearCachesConfigs`.
- **`domain/`** — GORM domain classes.
- **`conf/`** — `application.groovy` and `runtime.groovy` configuration.
- **`init/`** — Bootstrap, security, logging setup.

### Instance Configuration
Environment variables loaded from `.env` file (copy `.env.template` to `.env`). Required: `APP_TOOLBOX_ENVIRONMENT`, `APP_TOOLBOX_DB_HOST`, `APP_TOOLBOX_DB_SCHEMA`, `APP_TOOLBOX_DB_USER`, `APP_TOOLBOX_DB_PASSWORD`.

## Changelog

Toolbox maintains a `CHANGELOG.md` that is parsed at build time by `changelog-parser` (via
hoist-dev-utils) and displayed in-app to users via Hoist's `ChangelogService`. Write entries for an
audience of developers and potential clients evaluating Hoist.

### Format

The file follows the [Keep a Changelog](https://keepachangelog.com/) structure:

```
# Changelog

## 9.0-SNAPSHOT - unreleased

### New Features

* Added Weather Dashboard example app backed by the OpenWeatherMap API.

### Libraries

* @xh/hoist 80.0.1
```

- **Version headings**: `## <version> - <date>` — no `v` prefix. Use `SNAPSHOT - unreleased` for
  the in-development version.
- **Adding a new SNAPSHOT version**: Before adding a changelog entry, check whether the topmost
  version in `CHANGELOG.md` has already been released. A version is released if it has a date
  (e.g. `## 8.1.0 - 2026-02-12`) or a matching `v<version>` git tag exists. If it has been
  released, create a new `## <next-major>.0-SNAPSHOT` heading above it (with no date) before
  adding your entry. Bump the major version number from the last release (e.g. after `8.1.0`,
  create `9.0-SNAPSHOT`).
- **Recognized categories** (used for styling in the in-app dialog): `Breaking Changes`,
  `New Features`, `Bug Fixes`, `Technical`, `Libraries`.

### Critical: single-line bullets only

The changelog parser works **line-by-line**. Bullet points are only recognized when a line starts
with `*` or `-`. Continuation lines, wrapped text, and nested sub-bullets are **silently dropped**
from the parsed output.

**Every bullet MUST be a single line — no matter how long.** Do not wrap, indent continuation text,
or use nested sub-bullets. A 300-character single line is correct; a neatly wrapped two-line bullet
is broken.

```
// GOOD — single line, renders completely in-app
* Added Weather Dashboard example app — a full-stack weather dashboard backed by the OpenWeatherMap API, featuring a `DashCanvas` layout with multiple chart types.

// BAD — continuation line will be silently dropped
* Added Weather Dashboard example app — a full-stack weather dashboard backed by the OpenWeatherMap
  API, featuring a `DashCanvas` layout with multiple chart types.
```

### Style

- Use past tense ("Added", "Fixed", "Removed" — not "Add", "Fix", "Remove").
- Be concise but specific about what changed and why.
- Use backticks for API names, component names, and config keys (e.g. `ViewManager`, `useOAuth`).

## Related Repositories

XH / Hoist framework developers can optionally check out the framework libraries as sibling
directories for inline development of the libraries. This is not required for app development.
- **`../hoist-core`** — Groovy/Java backend framework. Enable with `runHoistInline=true` in `gradle.properties`.
- **`../hoist-react`** — React frontend library. Enable with `yarn startWithHoist` from `client-app/`.
