# Playwright Port — Running Log

Branch: `atm/playwright-setup`
Started: 2026-05-20 (overnight session)
Operator: Claude (autonomous, auto mode)

## Goal

Port JobSite's Playwright E2E testing setup to Toolbox so Toolbox can become the central place
for Playwright-based testing of Hoist / hoist-react. Tomorrow we'll discuss building out a
dedicated harness sub-app for component/integration tests, but the goal tonight is to get the
basic machinery in place with a sensible foundation and an independent expert review.

## In Scope Tonight

1. Read every relevant JobSite file (playwright/, auth bootstrap, env wiring, README).
2. Survey Toolbox auth + bootstrap so the port can be tailored.
3. Create `playwright/` in Toolbox mirroring JobSite layout (config, hoist helpers, fixtures).
4. Add backend pieces for password-only login bootstrap + test users.
5. Write `auth.setup.ts` + a `smoke.spec.ts` adapted to Toolbox.
6. Sketch design proposal for a dedicated "Playwright host" sub-app in `client-app/`.
7. Run an independent Playwright reviewer agent.
8. Document everything in CLAUDE.md + CHANGELOG.

## Discoveries / Notes

### JobSite Playwright setup (reference)

- Standalone npm project at `jobsite/playwright/` — own `package.json`, its own `node_modules`,
  not part of the Yarn workspace under `client-app/`.
- `playwright.config.ts` loads `../.env` via `dotenv` and refuses to start unless
  `APP_JOBSITE_HARVEST_READ_ONLY=true`. baseURL pinned to `http://localhost:3000/app`.
- Two projects:
  - `setup` runs `tests/auth.setup.ts` once per run, logging in three users via the Hoist login
    panel and writing storageState JSON files to `.auth/{partner,clientA,clientB}.json`.
  - `chromium` runs the actual specs, with `dependencies: ['setup']` so all specs get cached
    storage state.
- `fullyParallel: false` (one worker), `timeout: 5min`, `globalTimeout: 1h`. Junit reporter.
- `tsconfig.json` uses path mappings into `../client-app/node_modules/@xh/hoist/*` and
  `../client-app/src/*` so tests can `import type` Jobsite models without bundling anything.
- `hoist/` toolkit is **deliberately app-agnostic** — `HoistPage`, `GridHelper`, `FormHelper`,
  `ApiHelper`, `Types`, `Utils`. JobSite README explicitly mentions extracting this into
  hoist-react or a `@xh/hoist-testing` package eventually — bringing it into Toolbox is the
  natural next step.
- `HoistPage.initAsync()` does four important things:
  1. Subscribes to `page.on('console')` and promotes errors to test failures with a small allowlist.
  2. Injects three browser-side globals via `page.addInitScript`: `getModel<T>(name)`,
     `getSvc<T>(name)`, and `wait(ms)`. These are usable inside any `page.evaluate()` callback.
  3. Navigates to baseURL.
  4. Polls `window.XH.appState === 'RUNNING'` (60s timeout) before returning.
- `getModel` is **strict** — it throws if `XH.getModels(name)` returns >1 match, surfacing leaked
  models. This is a useful pattern that JobSite added on top of the raw Hoist API.
- The `JobsiteApp` fixture adds two small navigation helpers (`switchToTopLevelTab`,
  `getVisibleTabIds`) plus three role-scoped fixtures (`partner`, `clientA`, `clientB`) and one
  HTTP fixture (`partnerApi`). Each browser fixture creates a fresh `BrowserContext` with the
  pre-authenticated storageState — no per-test login.
- `ApiHelper` authenticates via Hoist's `/xh/login` form endpoint and keeps `JSESSIONID` for
  subsequent requests. Available as a test fixture for backend tests.

### JobSite backend support

- `BootStrap.groovy` calls `ensureTestUsersCreated()` (only in `isLocalDevelopment`) when
  `testUserPassword` instance config is set. Creates 3 users with the shared password. Then
  `grantTestUserRoles()` (also dev-only) assigns 3 different business roles via
  `roleService.assignRole(user, roleName)`.
- `AuthenticationService.getUseOAuth()` reads `useOAuth` instance config and returns `false`
  only when explicitly set to `'false'` — i.e. OAuth on by default.

### Toolbox state

- **Auth.** Toolbox already supports password-only login via `APP_TOOLBOX_OAUTH_PROVIDER=NONE`.
  No backend wiring needed for this — JobSite invented `useOAuth` separately because it predates
  Toolbox's `oauthProvider` switch. **Decision: use the existing `OAUTH_PROVIDER=NONE` path.**
- **Roles.** Toolbox uses `DefaultRoleService`. There is no custom `RoleService.ensureRequiredConfigAndRolesCreated`
  override yet (compare JobSite which adds 30+ RoleSpecs there). Test admin will need to be a
  member of `HOIST_ADMIN`. Two ways:
  (a) Override `ensureRequiredConfigAndRolesCreated` to add the test admin user to HOIST_ADMIN.
  (b) Call `defaultRoleUpdateService.assignRole(user, 'HOIST_ADMIN')` from BootStrap after
      `parallelInit`. JobSite uses pattern (b) but Toolbox doesn't have a `RoleService` injected
      into BootStrap today; pattern (a) is simpler and follows the role-bootstrap idiom.
  **Decision: pattern (a) — extend Toolbox's RoleService.**
- **Existing bootstrap admin.** The `BOOTSTRAP_ADMIN_USER` mechanism already grants HOIST_ADMIN
  via Hoist Core's special-cased instance config. We can lean on that for the admin test user
  rather than adding a new role-management codepath. But for clarity and to mirror JobSite's
  multi-user setup, we'll create dedicated `test-admin@xh.io` and `test-user@xh.io` accounts.
- **No external API to guard.** Toolbox has no Harvest-equivalent external API that requires a
  read-only safety check. The pre-flight assertion in `playwright.config.ts` is therefore
  unnecessary — we'll leave a comment explaining the omission so future Toolbox tests against
  e.g. the GitHub API can re-introduce the guard.
- **App entry.** baseURL will be `http://localhost:3000/app` (the desktop app). AppModel's tab
  container is exposed via `appModel.tabModel` — same as JobSite — so `switchToTopLevelTab`
  ports verbatim.

## Decisions Log

- **`OAUTH_PROVIDER=NONE`** is the existing toggle for password-only login — don't introduce
  parallel `USE_OAUTH` env var.
- **Test users**: `test-admin@xh.io` (HOIST_ADMIN) and `test-user@xh.io` (no admin). One shared
  password from `APP_TOOLBOX_TEST_USER_PASSWORD`.
- **No external-API guard** in `playwright.config.ts` for first cut — Toolbox doesn't talk to
  destructive external APIs. Document the omission so it's not forgotten.
- **Vendor `hoist/` verbatim from JobSite.** Same intent: this code is library-grade and we want
  it sitting in a Hoist demo app so it's the natural place to evolve it before extraction.
- **Keep the project standalone** (separate `playwright/package.json`, no integration into the
  Yarn workspace at `client-app/`). Matches JobSite. Avoids polluting the app's deps with
  Playwright, and lets Playwright pick whatever Node toolchain it wants.

## Review + Fixes

An independent expert reviewer was dispatched after the initial scaffold landed. Full report in
[REVIEW.md](REVIEW.md). Summary of what was addressed *in the same session* vs. left for tomorrow.

### Fixed in-session (post-review)

- ✅ **Dead code `HoistPage.activeTab`** — referenced JobSite-only `tabContainerModel`. Removed.
- ✅ **`onConsoleError` allowlist too permissive** — dropped the text-based `'401'` /
  `'Failed to load resource'` matches that would swallow real auth regressions.
- ✅ **Race in `switchToChildTab`** — now activates parent + waits for mask before activating
  child, so the lazy mount of `childContainerModel` is complete.
- ✅ **`getModel` / `getSvc` / `wait` globals not visible to specs** — moved into a dedicated
  `hoist/globals.d.ts` that is listed in `tsconfig.include`. Specs no longer need to import
  `HoistPage` to get the types.
- ✅ **No `webServer` / no pre-flight check on backend** — added `globalSetup.ts` that pings
  both servers before any spec and throws a clean, actionable error if either is missing.
- ✅ **`postinstall` for browser binary** — added `playwright install --with-deps chromium` so
  `npm install` is a complete onboarding step.
- ✅ **`typecheck` script + `testDebug` script** — added to `package.json`; runs cleanly.
- ✅ **`fullyParallel` + `retries` + `trace` defaults** — flipped to parallel, `retries: 2` on
  CI, `trace: 'retain-on-failure'`.
- ✅ **`core-js` runtime dep** — removed; was unused cargo-culted from JobSite.
- ✅ **Open Question #3 dropped** — confirmed single-env-var gate is the right call.

### Deferred to tomorrow

- ❌ **`isLocalDevelopment` gate for CI bootstrap** — currently fine because CI doesn't run yet,
  but the env var `APP_TOOLBOX_ENVIRONMENT=Development` must be set in CI when we wire it up.
  Worth a CLAUDE.md note.
- ❌ **`AppTypes.d.ts` include in tsconfig** — Toolbox does not have one today
  (`client-app/src/types.d.ts` is a different file, only declares `.md` imports). Revisit if/when
  Toolbox adds app-side global types.
- ❌ **`ApiHelper.loginAsync` posture guard** — relying on the playwright.config.ts pre-flight
  for now. Adding a constructor-side guard is cheap and worth doing tomorrow.
- ❌ **`test.step()` instead of `console.log`** — minor nit, easy adjustment in `smoke.spec.ts`.
- ❌ **Named timeout constant `APP_RUNNING_TIMEOUT`** — small refactor, do tomorrow if writing
  more specs.
- ❌ **`adminApp` fixture for `/admin` baseURL** — needed before the first admin-console spec.
- ❌ **`expect(mask).toBeHidden()` vs `toHaveCount(0)`** — solid suggestion, fold in when we
  hit our first nested-mask flake.
- ❌ **ESLint config for `playwright/`** — non-blocking; the existing root prettier covers
  formatting.
- ❌ **`.prettierignore`** — non-blocking.

### Design proposal feedback (HARNESS_PROPOSAL.md)

Reviewer flagged four concrete items to fold into the design discussion tomorrow:

1. **Singleton-service mutation must be a hard invariant**, not a deferable open question. The
   `resetScenarioAsync` escape hatch I floated is unsafe — Hoist services can't be cleanly torn
   down once `XH.installServicesAsync` has wired them in.
2. **`require.context` is webpack-only**. If/when XH moves to Vite, the side-effect glob
   registration breaks silently. Consider an explicit `scenarios/index.ts` barrel from day one.
3. **Bake `setupAsync` / `teardownAsync` into the `Scenario` interface from day one** — adding
   later forces every existing scenario to migrate.
4. **Auto-tag spans with `scenario=<id>`** for OTEL trace grouping; cheap to add up front.

All four belong in the proposal before Phase A starts. Edits queued for tomorrow.

## Open Questions for Tomorrow

1. Should the `hoist/` toolkit be lifted into the hoist-react package (e.g. as `@xh/hoist/test`)
   or a separate `@xh/hoist-testing` npm package? Toolbox is the cleanest place to do that
   extraction since it's a peer of hoist-react and used as the test app for framework work.
2. Revisit HARNESS_PROPOSAL.md with the four reviewer-flagged items folded in.
3. Do we want fixtures for both `test-admin` and `test-user`, or just one to start? Currently
   shipping both — the reviewer endorsed this.
4. CI wiring — when we add it, ensure `APP_TOOLBOX_ENVIRONMENT=Development` is set so the
   `ensureTestUsersCreated()` codepath runs against the CI database.
