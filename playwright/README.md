# Toolbox Playwright Tests

End-to-end tests for Toolbox, written in [Playwright](https://playwright.dev/) with TypeScript.
This directory is a **standalone npm project** that drives a real, running Toolbox instance
(frontend + Grails backend + MySQL/H2) and interacts with it both as a browser user and through
the live Hoist runtime in `page.evaluate()`.

This setup is **ported directly from the [Jobsite](https://github.com/xh/jobsite) Playwright
suite**, with the goal of making Toolbox the central place for evolving and demonstrating
Hoist-aware Playwright testing — including the in-progress "Playwright host" sub-app for
component-level coverage (see `docs/playwright-port/HARNESS_PROPOSAL.md`).

## Overview

**What it tests today.** A smoke suite — app load, login, top-level tab navigation, basic child
tab activation. The harness is the point; meaningful per-feature specs come next.

**Audience.** XH developers and reviewers working on Toolbox and on hoist-react / hoist-core.
Because Toolbox already serves as the framework's primary demo/reference app, putting Playwright
tests here gives them broad coverage of Hoist patterns: grids, dashboards, forms, tabs,
ViewManager, charts, OAuth-vs-password login, the admin console, etc.

**Why live-backend E2E.** Hoist apps coordinate observable models, services, persistence, and
the Hoist runtime in ways that unit-style component harnesses cannot model. Driving a real built
app (or, eventually, an isolated harness route within the same built app) catches the bugs that
actually ship.

## Quick Start

### Prerequisites

- Node 20+ and npm.
- A checked-out Toolbox repo with a populated `.env` (see project-root `.env.template`).
- A running backend (`./gradlew bootRun`) and frontend (`cd client-app && yarn start`).

### Required `.env` keys

Add these to the project-root `.env` before running the suite:

| Key                              | Value                  | Purpose                                                          |
|----------------------------------|------------------------|------------------------------------------------------------------|
| `APP_TOOLBOX_OAUTH_PROVIDER`     | `NONE`                 | Disables OAuth, enables the Hoist password login form            |
| `APP_TOOLBOX_TEST_USER_PASSWORD` | e.g. `playwright-test` | Shared password for the bootstrapped test users                  |

Two test users are created automatically in local dev mode when `APP_TOOLBOX_TEST_USER_PASSWORD`
is set (see `grails-app/init/io/xh/toolbox/BootStrap.groovy`):

- `test-admin@xh.io` — granted `HOIST_ADMIN` via `RoleService` extension
- `test-user@xh.io` — no admin role, represents an unprivileged user

### Running the suite

```bash
cd playwright
npm install                       # one-time — `postinstall` also downloads the chromium binary

npm test                          # headless full suite
npm run testWithUI                # Playwright UI — single-test stepping, time travel, network
npm run testHeaded                # headed Chrome, useful for visual debugging
npm run testDebug                 # PWDEBUG=1 — pauses on each action for step-through debugging
npm run typecheck                 # tsc --noEmit; cheap CI gate before running specs
```

`playwright.config.ts` throws at startup if `APP_TOOLBOX_OAUTH_PROVIDER` isn't set to `NONE`
or `APP_TOOLBOX_TEST_USER_PASSWORD` is missing. `globalSetup.ts` runs once before the suite
and confirms both the Grails backend (`localhost:8080/ping`) and the webpack dev server
(`localhost:3000/`) are reachable, failing fast with an actionable message if not.

## Architecture

```
playwright/
├── playwright.config.ts       # Playwright config + pre-flight safety checks
├── tsconfig.json              # Path mappings into client-app for type-only imports
├── .auth/                     # Cached storageState per user (gitignored)
├── fixtures/
│   └── ToolboxApp.ts          # App-specific fixture + role-scoped `test` extension
├── hoist/                     # App-agnostic Hoist testing toolkit — ported verbatim from Jobsite
│   ├── HoistPage.ts           # Base page object + browser-side helper injection
│   ├── GridHelper.ts          # GridModel-aware grid interactions
│   ├── FormHelper.ts          # FormModel-aware form interactions
│   ├── ApiHelper.ts           # Authenticated Grails backend requests (bypass browser)
│   ├── Utils.ts               # Shared utilities (wait, mergeTestId)
│   └── Types.ts               # Common query types (RecordQuery, FilterSelectQuery)
└── tests/
    ├── auth.setup.ts          # Logs in each test user once, caches storageState
    └── smoke.spec.ts          # App load + tab navigation
```

### Test execution flow

```
playwright test
    │
    │  reads playwright.config.ts
    │  → asserts APP_TOOLBOX_OAUTH_PROVIDER === 'NONE'
    │  → asserts APP_TOOLBOX_TEST_USER_PASSWORD is set
    │  → loads project-root .env
    │
    ▼
project "setup" (tests/auth.setup.ts)
    │  Logs in as each test user via the Hoist login form,
    │  saves storageState to .auth/{admin,user}.json
    │
    ▼
project "chromium" (tests/*.spec.ts, excluding setup)
    │  Each fixture (`admin`, `user`) boots a fresh BrowserContext
    │  with the pre-authenticated storageState — no per-test login cost.
    │  ToolboxApp.initAsync() injects browser-side helpers, navigates to
    │  the app, and blocks until XH.appState === 'RUNNING'.
```

## The `hoist/` toolkit (intentionally app-agnostic)

Everything under `hoist/` is portable across Hoist apps — it references only `@xh/hoist/...` types
and Playwright primitives. The intent is for this code to graduate out of an app and into
hoist-react itself (e.g. `@xh/hoist/test`) or a standalone `@xh/hoist-testing` npm package once
the API has stabilised across two consuming projects. Toolbox brings that to two.

### `HoistPage` — base page object

The foundation for all app-specific page objects. Responsibilities:

- **Injects browser-side helpers** via `page.addInitScript` so they're available inside every
  `page.evaluate()` call (see below).
- **Waits for `XH.appState === 'RUNNING'`** before returning control — tests never race the init
  sequence.
- **Promotes `console.error` to test failure**, with a narrow allowlist for benign noise (401s
  during login, blob/data-service fetches).
- **Provides a small locator + action API** built on Playwright's `getByTestId`, with
  affordances for Hoist's Select dropdowns, masks, and common form inputs.
- **Factory methods** for `GridHelper` and `FormHelper` keyed by testId.

### Browser-side helpers — `getModel`, `getSvc`, `wait`

Injected globally and usable inside every `page.evaluate()` callback:

```ts
await page.evaluate(() => {
    const model = getModel<MyModel>('MyModelClassName');   // strict: null if 0, throws if >1
    const svc   = getSvc<MyService>('myServiceName');      // typed alias for XH[name]
    await wait(200);                                       // Promise-based setTimeout
    return {...};
});
```

These matter because:

- `page.evaluate()` callbacks **cannot reference Node-side imports** — the callback is serialised
  and run in the browser. Anything it needs comes from globals, parameters, or injection.
- **Strict `getModel`** throws when `XH.getModels(name)` returns >1 match, surfacing test pollution
  early. Plain `XH.getModels(name)[0]` silently picks the first.
- **`wait()`** fills a gap — Hoist's own `wait()` utility can't be imported inside an evaluate.

### `GridHelper`, `FormHelper`, `ApiHelper`

Cover the patterns documented exhaustively in the Jobsite README — `getRecordCount`,
`selectRow({data})`, `getFieldValue`, `setValues`, authenticated `fetchJson` / `postJson` against
the Grails backend, etc. Until extracted into the framework, they live here and stay in sync
with the source in `jobsite/playwright/hoist/`.

## Test users & role-based fixtures

Two test users, bootstrapped by `BootStrap.groovy` when `APP_TOOLBOX_TEST_USER_PASSWORD` is set:

| Email                  | Roles        | Fixture | Use case                                  |
|------------------------|--------------|---------|-------------------------------------------|
| `test-admin@xh.io`     | `HOIST_ADMIN`| `admin` | Admin console + admin-gated controllers   |
| `test-user@xh.io`      | (none)       | `user`  | Standard user — verify non-admin views    |

`HOIST_ADMIN` is granted via `RoleService.ensureRequiredConfigAndRolesCreated()` — see
`grails-app/services/io/xh/toolbox/user/RoleService.groovy`.

## Conventions (copied from Jobsite)

### testIds — `parentComponent-element`

Add a `testId` prop to any component a test needs to locate. For framework-created models (e.g.
`GridModel`, `FormModel`), pass `testId` on the wrapping `grid()` / `form()` component so
`XH.getModelByTestId(...)` and the helpers built on it work.

### `.js-*` CSS class hooks

For DOM elements tests need to query that aren't HoistModels, use a `js-` prefixed className.
Carries no styling, exists solely as a stable test selector.

### Consolidate `page.evaluate()` calls

A single evaluate with `await wait(ms)` inside beats a sequence of evaluate/wait/evaluate. Each
roundtrip costs latency and readability.

### Type-only imports across the boundary

Import app-side model types in the spec file and use short aliases inside generics:

```ts
import type {PortfolioModel} from 'toolbox/examples/portfolio/PortfolioModel';
type PM = PortfolioModel;

await page.evaluate(() => getModel<PM>('PortfolioModel').gridModel.store.count);
```

The path mapping `"toolbox/*": ["../client-app/src/*"]` in `tsconfig.json` makes this work
without any runtime cost — the actual code always runs in the already-loaded browser instance
of the app.

## Safety guardrails

- **Pre-flight refusal** in `playwright.config.ts` for missing OAuth/password env vars (see
  Quick Start).
- **Console-error promotion** in `HoistPage.initAsync()` fails tests on unexpected runtime
  errors with a narrow allowlist.
- **No external-API guard** (cf. Jobsite's `APP_JOBSITE_HARVEST_READ_ONLY=true`) — Toolbox does
  not have a destructive external integration. If you add a spec that hits a real GitHub API
  mutation flow, weather POST endpoint, or similar, gate it on a new read-only env var and add
  the corresponding assertion to `playwright.config.ts`.

## Next steps

See `docs/playwright-port/HARNESS_PROPOSAL.md` for the in-flight design of a dedicated
"Playwright host" sub-app — a separate webpack entry point that mounts isolated test scenarios
for component-level / integration coverage of Hoist primitives, complementary to the desktop
app smoke coverage here.

Other planned extensions:

- **Per-feature specs.** Forms, grids (including column chooser, filtering), dashboards,
  ViewManager round-trip, charts, theming, masking.
- **Backend coverage.** Direct admin-endpoint tests via `ApiHelper`.
- **CI integration.** Currently set up to switch on `process.env.CI` for reporter selection
  and worker count; wire up to GitHub Actions once the harness sub-app lands.
- **Toolkit extraction.** Promote `hoist/` to a standalone npm package once stable.
