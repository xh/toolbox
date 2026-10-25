# Checkpoint — 2026-05-21

Big multi-session push. This doc is the single resume point — read this first, then dive into
the other files in this directory.

## Branches

| Repo | Branch | State | Action needed |
|---|---|---|---|
| `xh/hoist-core` | `atm/remove-jasypt` | 8 clean commits on top of `develop`, 58 Spock tests green, `./gradlew clean build` succeeds | Push to remote, then open PR |
| `xh/toolbox` | `atm/playwright-setup` | 2 commits on top of `develop`, Playwright suite green when `runHoistInline=true` | Push to remote; do NOT merge before hoist-core 41.0 ships |

## What's in each branch

### `hoist-core/atm/remove-jasypt`

Removes the EOL `jasypt-1.9.3` dependency. Replaces its two internal uses in
`AppConfig.groovy` (symmetric encrypt of `pwd` config values; one-way digest for the admin
Config Diff UI) with pure-JDK code (`AesTextCipher` AES-256-GCM + PBKDF2, `ConfigValueDigester`
deterministic SHA-256), and exposes a new `HoistPasswordEncoder` (BCrypt via
`spring-security-crypto`) for consuming apps. `LegacyJasyptDecrypter` keeps existing prod DBs
upgradable without re-encryption — pinned against real jasypt-1.9.3 outputs across 26 test
fixtures (empty, ASCII, long, unicode NFC/NFD, whitespace+special).

First-ever `src/test/` tree in hoist-core; Spock plumbing + `src/test/groovy/README.md`
documenting the conventions.

Detail: `docs/playwright-port/JASYPT_REMOVAL_REPORT.md` (this repo, written from the bug-side).

### `toolbox/atm/playwright-setup`

**Commit 1 — Playwright E2E setup.** Standalone `playwright/` project (own `package.json`,
`node_modules`, tsconfig). Ported from JobSite verbatim where it makes sense (`hoist/`
toolkit deliberately app-agnostic, ready for extraction); app-specific layer is
`fixtures/ToolboxApp.ts` + `tests/auth.setup.ts`. Pre-flight checks in `playwright.config.ts` +
`globalSetup.ts`. Independent expert review documented in
`docs/playwright-port/REVIEW.md` with fixes applied. Design proposal for a dedicated
component-scenario "Playwright host" sub-app in `docs/playwright-port/HARNESS_PROPOSAL.md` —
that's the next conversation.

**Commit 2 — Bootstrap test users + `User.groovy` swap.** `BootStrap.groovy` creates
`test-admin@xh.io` (with `HOIST_ADMIN` via `RoleService`) and `test-user@xh.io` in local dev
when `APP_TOOLBOX_TEST_USER_PASSWORD` is set. `User.groovy` swapped to
`io.xh.hoist.security.HoistPasswordEncoder` (the new public utility from hoist-core 41.0).
`.env.template` updated. **Depends on hoist-core 41.0** — see Resume below.

## To resume work in a fresh session

```bash
cd /Users/amcclain/dev/toolbox
git checkout atm/playwright-setup

# Re-enable inline hoist-core for verification (it's reverted in the committed file):
sed -i '' 's/runHoistInline=false/runHoistInline=true/' gradle.properties

# Add to .env (gitignored, won't get committed):
cat >> .env <<EOF
APP_TOOLBOX_OAUTH_PROVIDER=NONE
APP_TOOLBOX_TEST_USER_PASSWORD=playwright-test
EOF

# Start backend + frontend in separate terminals:
./gradlew :bootRun
cd client-app && yarn start

# Run the suite:
cd ../playwright
npm install                        # one-time
npm test                           # 5 specs, ~12s
```

`./gradlew :bootRun` (note the `:`) — composite-build dispatch will otherwise forward `bootRun`
to hoist-core where it isn't defined and fail with "The bootRun task is not supported in
hoist-core."

## Open items for tomorrow (or whenever you pick up)

1. **Open the hoist-core PR.** Push `atm/remove-jasypt` and create a PR with a tight summary.
   The `JASYPT_REMOVAL_REPORT.md` in this directory is the diagnosis side; the v41 upgrade
   notes in hoist-core (`docs/upgrade-notes/v41-upgrade-notes.md`) are the consumer guide.
2. **Pre-deploy verification on a real prod DB.** `LegacyJasyptDecrypter` is pinned against
   synthetic jasypt-1.9.3 fixtures and against the algorithm defaults baked into jasypt 1.9.3.
   It hasn't been smoke-tested against an actual production DB dump (e.g. prod-jobsite's
   `harvestAccessToken` pwd config or any local-user password rows). Worth doing before
   cutting hoist-core 41.0.
3. **The Toolbox PR is blocked on hoist-core 41.0 release.** Either:
   - Merge the Playwright scaffold (commit 1) standalone now and hold commit 2 in a follow-up
     PR once 41.0 ships.
   - Or hold the whole branch until 41.0 is out and merge atomically.
   The atomic-merge path is simpler and is what I'd recommend, since commit 1 alone has no
   working tests (the suite requires the bootstrap users from commit 2).
4. **`HOIST_ADMIN` role not showing up on `test-admin@xh.io`'s identity payload** during
   manual verification (`curl /xh/getIdentity` returned `roles: []`). The `RoleService` grant
   in `ensureRequiredConfigAndRolesCreated` runs, but it didn't reflect in the identity check.
   Smoke specs don't assert on roles so didn't catch it. Investigate before relying on it for
   admin-gated specs.
5. **The four reviewer-flagged items on `HARNESS_PROPOSAL.md`** (singleton-service mutation as
   hard invariant, `require.context` portability, scenario lifecycle hooks, OTEL tagging) —
   fold into the proposal before Phase A starts.

## Reading order if you have 10 minutes

1. This file.
2. `LOG.md` — running log of decisions + open questions.
3. `REVIEW.md` — independent expert review of the Playwright setup (most still applies).
4. `JASYPT_REMOVAL_REPORT.md` — context for the hoist-core branch.
5. `HARNESS_PROPOSAL.md` — only if discussing the component-scenario host sub-app.
