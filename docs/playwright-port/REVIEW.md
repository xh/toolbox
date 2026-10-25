# Independent Playwright Review

Reviewer: general-purpose subagent dispatched 2026-05-20 (overnight).
Scope: full `playwright/` scaffold, the backend bootstrap pieces, CLAUDE.md additions, and
the HARNESS_PROPOSAL.md sketch.

See `LOG.md` for which items were addressed in the same session and which are left for
tomorrow.

---

### Critical issues (would break the setup)

- **`npm install` does not download the Chromium binary.** README says `npm install && npm test`
  works end-to-end, but `package.json` has no `postinstall` hook
  (`/Users/amcclain/dev/toolbox/playwright/package.json`). The README does call out
  `npx playwright install chromium` as a separate "first time only" step, which contradicts the
  task description. Either keep the manual step (and remove "actually work end to end" from the
  README's pitch) or add `"postinstall": "playwright install chromium"`.
- **Stale model on `switchToChildTab` will misfire after Hoist auto-activates.**
  `/Users/amcclain/dev/toolbox/playwright/fixtures/ToolboxApp.ts:27-37` calls
  `activateTab(parentId)` and *synchronously* reads `parent.childContainerModel` from the same
  evaluate. Hoist's TabContainer lazily mounts child containers and the child activation can
  race against the parent's loadState/mask. Add `await waitForMaskToClear()` between the two
  calls, or split into two evaluates. Currently masked by the fact that the smoke test selects
  'standard', which happens to be the default child.
- **`isLocalDevelopment` gate may be too narrow for CI.** `BootStrap.groovy:79` returns early
  unless `isLocalDevelopment`. If/when the suite runs in CI against a fresh Grails boot,
  `APP_TOOLBOX_ENVIRONMENT=Development` must be guaranteed there, not just locally. Worth
  documenting; not broken today.
- **`onConsoleError` allowlist is far too permissive** — `text.includes('401')` and
  `Failed to load resource` will swallow real auth bugs (e.g. a permissions regression on the
  admin user that drops to a 401 mid-test will pass silently). Tighten to URL-based matching
  or remove. Ported verbatim from JobSite but not appropriate for Hoist framework testing.

### High-value improvements

- **No `webServer` block.** Tests fail-fast with a confusing connection error if Grails or
  `yarn start` isn't running. Add `webServer: [{command, url, reuseExistingServer: true}]` for
  `yarn start` (port 3000) at minimum. Backend health-check (`/ping` or `/xh/xhAppEnvironment`)
  would be even better. Big QoL win for both devs and CI.
- **`fullyParallel: false` + `workers: 1` on CI is conservative.** With per-test BrowserContext
  + separate storageState per role, there's no shared state forcing serial execution. JobSite
  needed this because of Harvest write protection; Toolbox doesn't. Try `fullyParallel: true`
  and `workers: 50%`.
- **`retries: 0` is fine locally but bites in CI.** Recommend `retries: process.env.CI ? 2 : 0`.
  Same for `trace: 'on-first-retry'` — flip to `retain-on-failure` so the first CI failure has
  a trace.
- **No type augmentation for `getModel` / `getSvc` / `wait` at the spec level.**
  `HoistPage.ts:280-308` declares globals, but the declarations only exist *inside* the file
  scope unless something imports it. Specs that use `getModel` inside `page.evaluate` without
  importing `HoistPage` won't typecheck. Move globals to a `globals.d.ts` listed in
  `tsconfig.include`.
- **`HoistPage.activeTab(tabId)`** (`HoistPage.ts:82`) is dead code — references
  `tabContainerModel` (JobSite name) not `tabModel` (Toolbox). Either delete or fix.
- **`tsconfig.json` drops `../client-app/src/AppTypes.d.ts`** that JobSite includes. Likely
  unintentional, and if Toolbox grows app-side global types (Window augmentations etc.) you'll
  want this.
- **`ApiHelper.loginAsync()` doesn't verify auth posture.** It assumes form login at
  `/xh/login` — works only when `OAUTH_PROVIDER=NONE`. Add a single guard at construction time,
  or have it throw a clearer error than "Login failed".
- **Smoke test #1 logs `console.log('Activating tab:', tabId)`** — fine for now, but if you
  flip to parallel workers this becomes noisy. Use `test.step()` instead — gives you per-tab
  traces in the HTML report.
- **`prettier` is dev-dep in Toolbox but app-dep in JobSite.** Good; keep it. But
  `core-js`/`lodash` are runtime deps for the test process — confirm they're actually needed.
  (`lodash` is used in `Utils.ts` and `HoistPage.ts`; `core-js` looks like cargo culted from
  JobSite — consider dropping.)

### Design feedback on HARNESS_PROPOSAL.md

The shape is sound and the phasing is realistic. Two concerns worth poking at tomorrow:

**Singleton-service mutation is the design's real risk, not a footnote.** Open Question #1
understates it. Hoist apps wire services into a singleton XH registry on `XH.installServicesAsync`;
once installed, they can't be cleanly torn down without a full app reload. If a scenario
triggers a real `XH.fetchService` race or installs a reaction on `ConfigService`, the next
scenario inherits it. Recommend making this a **hard invariant** of the host: scenarios may
only mutate state inside their own `HoistModel` tree, never services. Enforce by lint or by
code review — but don't allow service mutation behind a `resetScenarioAsync` escape hatch. The
reset semantics on shared services aren't safe enough to support.

**Side-effect registration + `require.context` is fragile under Vite/esbuild.** Toolbox is
webpack today via hoist-dev-utils, so `require.context` works — but if XH ever moves to Vite
(likely on the roadmap), this breaks silently. Consider Phase A using an explicit
`scenarios/index.ts` barrel with `import './grid/columnFilteringScenario'` lines. Less
ergonomic, dramatically more portable. A codegen step from a glob could split the difference.

**Missing: scenario lifecycle hooks.** The example scenario shows `model:
ColumnFilteringScenarioModel` but no `setupAsync` / `teardownAsync`. Many useful scenarios need
pre-seeded data, mocked fetch responses, or a fake clock. Bake the hooks into the `Scenario`
interface from day one — adding them later forces every existing scenario to migrate.

**Missing: scenario-scoped logging / OTEL tagging.** Since you'll want CI debug surface, every
scenario navigation should automatically tag spans with `scenario=<id>` so the trace view
groups by scenario. Cheap to add up front.

**Decision on auth posture** — agree with "any authenticated user" default, but explicitly add
a `requiresAdmin: true` flag to the `Scenario` interface so admin-gated framework features
(admin console widgets, monitor cards) can opt in.

### Nice-to-haves

- Add `playwright/.prettierignore` for `test-results/`, `playwright-report/`, `.auth/`.
- ESLint config for the playwright project — it has its own `tsconfig` already.
- `package.json` script: `"test:debug": "PWDEBUG=1 playwright test"`.
- `expect.poll` default timeout is 5s. Several places (`HoistPage.waitForAppState`,
  `auth.setup.ts`) raise to 60s — make this a named constant `APP_RUNNING_TIMEOUT` so future
  maintainers don't drift them apart.
- Per `HoistPage.ts:228`, `waitForMaskToClear()` uses `toHaveCount(0, {timeout: 30000})`. Hoist
  sometimes nests masks (panel + grid). Consider `expect(this.getMask()).toBeHidden()` to be
  robust against ephemeral masks that appear after the check starts.
- README's "App URLs" table in CLAUDE.md mentions `/admin` — worth adding `adminApp` fixture
  using `baseURL: 'http://localhost:3000/admin'` for the inevitable admin-console specs, since
  most of `HOIST_ADMIN`-gated behavior is there.
- LOG.md Open Question #3 ("BOOTSTRAP_TEST_USERS env var") — current single-env-var approach is
  the right call, drop the question.
- Consider an early `tsc --noEmit` script (`"typecheck": "tsc --noEmit"`) in
  `playwright/package.json` and run it in CI before `npm test`. Catches type drift between
  toolbox client-side types and the specs cheaper than a Playwright run.
