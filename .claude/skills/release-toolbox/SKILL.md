---
name: release-toolbox
description: Cut a versioned production release of Toolbox - swap Hoist libraries from their working SNAPSHOTs to the latest official releases (hoist-core + @xh/hoist), finalize the CHANGELOG, commit on develop, ff-merge develop into master, trigger and watch the Build Release + Deploy Release GitHub Actions through to a successful prod deploy, then restore develop to its working-SNAPSHOT state. Use this skill whenever the developer wants to release Toolbox, cut a new Toolbox version, do a Toolbox prod release, ship a versioned build, or asks "let's release" / "release a new version" in this repo - even if they don't name every step. This is the authoritative runbook for the Toolbox release process; do not improvise the steps from memory.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, mcp__hoist-react__hoist-search-docs, mcp__hoist-react__hoist-read-doc
---

# Release Toolbox

The authoritative runbook for cutting a versioned production release of Toolbox. Follow the phases
in order. Each phase that mutates files, git state, or remote/cloud state has an explicit
confirmation gate - **never push, merge, or trigger a build without the developer's explicit go.**

## Mental model - read this first

Toolbox is XH's canary app: `develop` is kept on **working SNAPSHOT** versions of the Hoist
libraries so we dogfood unreleased framework changes. But we **ship** Toolbox against the latest
**official, versioned** Hoist releases. A release is therefore a brief, deliberate excursion from
SNAPSHOTs to releases and back:

```
develop (snaps) --[swap to releases + finalize CHANGELOG, commit]--> develop (release-pinned)
                --[ff-merge develop -> master]--> master  ──[Build Release from master]──> prod
                --[back on develop: restore snaps + new CHANGELOG header, commit]--> develop (snaps)
```

Three invariants that drive the whole process - keep them in mind:

1. **The app's release version is never written into code.** The version (e.g. `10.0.0`) is passed
   to the build only as `-PxhAppVersion`. `gradle.properties` `xhAppVersion` and
   `client-app/package.json` `version` stay on their working `x.y-SNAPSHOT` value across the
   release. The git tag deliberately points at a SNAPSHOT commit - that's expected, not a bug.

2. **The app SNAPSHOT version lives in three places that must stay in sync** - `gradle.properties`
   `xhAppVersion`, `client-app/package.json` `version`, and the `CHANGELOG.md` unreleased header.
   All three use the 2-part Maven form `x.y-SNAPSHOT` (e.g. `10.0-SNAPSHOT`). By the Java
   convention, the snap is always `(latest_released_major + 1).0-SNAPSHOT`.

3. **hoist-dev-utils stays on its release version** (`@xh/hoist-dev-utils`, currently a `13.x`
   range). Only `@xh/hoist` (hoist-react) and `hoistCoreVersion` (hoist-core) swap between SNAPSHOT
   and release. Leave hoist-dev-utils alone unless the developer specifically asks otherwise.

## gh is a core tool

This skill drives the GitHub Actions via the `gh` CLI (`gh workflow run`, `gh run watch`,
`gh run list`). `gh` is considered core to XH's AI automation and is expected to be installed,
configured, and authenticated. If a `gh` command fails with an auth/install error, **stop and
prompt the developer to fix it** (`brew install gh`, `gh auth login`) rather than silently working
around it. The GitHub Actions UI (Actions tab -> Build Release -> Run workflow) is a fallback to
mention only if the developer asks or `gh` is genuinely unavailable.

---

## Phase 1: Preconditions

Gather state and surface any concerns. **These are strong warnings, not hard gates** - the
developer can always override (they may be on a hotfix branch, or knowingly releasing off an
unusual state). Present problems clearly and ask before proceeding; do not block.

Run these checks:

1. **On `develop`?** `git rev-parse --abbrev-ref HEAD`. The standard path runs on `develop`. If on
   another branch, this may be a hotfix (see Phase 3's hotfix note) - confirm with the developer.
2. **Clean working tree?** `git status --porcelain`. If dirty, warn strongly - the release adds
   commits and a clean tree gives a clean rollback point.
3. **Synced with origin?** `git fetch origin` then compare `develop` to `origin/develop`
   (`git rev-list --left-right --count develop...origin/develop`). Warn strongly if behind/ahead.
4. **CI green on `develop`?** `gh run list --branch develop --workflow ci.yml --limit 1`. Warn
   strongly if the latest CI run is failing or in progress.
5. **App-version 3-way sync?** Quickly confirm the snap version agrees across `gradle.properties`
   (`xhAppVersion`), `client-app/package.json` (`version`), and the `CHANGELOG.md` unreleased
   header. They should normally match; if they don't, just note it in passing - the restore step
   (Phase 9) rewrites all three in sync and self-heals it. No special handling needed.

Summarize findings. If anything is off, ask: "Proceed anyway?" Wait for confirmation.

---

## Phase 2: Determine the Hoist release targets

Toolbox ships against the latest **official** releases of hoist-core and @xh/hoist. Discover them,
classify the situation, and confirm with the developer before changing anything.

### 1. Read current SNAPSHOT versions

- `@xh/hoist`: `client-app/package.json` dependencies (e.g. `^87.0.0-SNAPSHOT` -> snap major 87).
- `hoistCoreVersion`: `gradle.properties` (e.g. `41.0-SNAPSHOT` -> snap major 41).

### 2. Discover the latest published releases

- **hoist-react** (npm): `npm view @xh/hoist dist-tags --json`. Use the `latest` tag - that is the
  newest stable release (the `next` tag points at the current SNAPSHOT and must be ignored).
- **hoist-core** (Maven Central): `curl -s https://repo1.maven.org/maven2/io/xh/hoist-core/maven-metadata.xml`
  and read the `<release>` element - the newest non-SNAPSHOT version. (SNAPSHOTs live in a separate
  repo and won't appear here.)

### 3. Classify each library against its snap major

For each library, compare the latest release to the current snap major (snap = next-major):

- **"Major just released" case** - a release exists matching the snap major (e.g. snap `87-SNAP`
  and `87.0.0` is published). This means the Hoist major was just released (and Hoist itself has
  already moved to `88-SNAP`). **Take that matching release** (e.g. `87.0.0`). This is the clean
  catch-up case.
- **"Still developing the major" case** - the latest release is behind the snap major (e.g. snap
  `87-SNAP` but latest release is `86.1.0`). Toolbox is dogfooding an unreleased major.
  **Take the latest release of the prior line** (e.g. `86.1.0`) - **but only after confirming
  Toolbox actually runs on it** (next step). Never silently downgrade.

### 4. Confirm Toolbox runs on the chosen release (critical in the "still developing" case)

When taking a release behind the current snap major, Toolbox may have already adapted to **breaking
changes** introduced in the unreleased snapshot - code that compiles against the snap but would
break against the latest release. Before pinning, assess this:

- Read Toolbox's own `CHANGELOG.md` (current unreleased section) for entries that mention adapting
  to new framework APIs.
- Check recent commits: `git log --oneline -30` for framework-adaptation work.
- Consult the hoist-react changelog / upgrade notes for what changed between the latest release and
  the snap (the hoist-react reference tools or the sibling `../hoist-react` checkout if present).

If there is any sign Toolbox has adapted to not-yet-released breaking changes, **stop and ask the
developer.** Two possibilities:
- This should wait for the matching Hoist release, or
- This is actually a **hotfix release** (see the hotfix note in Phase 3).

In the clean cases (matching release exists, or no breaking-change adaptation), proceed.

### 5. Propose and confirm

State the proposed target versions plainly and **always confirm with the developer** before
applying - e.g. "Proposing hoist-core `40.1.0` and @xh/hoist `86.1.0` (both 'still developing the
next major' - latest releases of the current lines; Toolbox looks compatible). OK?" Wait for go.

---

## Phase 3: Apply the library version swaps

Once the developer confirms the targets, edit the two files:

- **`client-app/package.json`**: set `@xh/hoist` to the **exact** release version, no caret or
  range (e.g. `"@xh/hoist": "86.1.0"`). We pin exact because we revert to SNAPSHOT immediately
  after the release, so a range buys nothing.
- **`gradle.properties`**: set `hoistCoreVersion` to the **full semver** release (e.g.
  `hoistCoreVersion=40.1.0`).
- **Leave `@xh/hoist-dev-utils` unchanged.**

Then refresh the client lockfile so the build is reproducible:

```bash
cd client-app && yarn install
```

(Do not run `startWithHoist` / `runHoistInline` - the release must build against the published
libraries, not local sibling checkouts.)

Optionally sanity-check that the client still lints/builds against the release
(`cd client-app && yarn lint`); surface any failure to the developer - it likely indicates the
breaking-change-adaptation problem from Phase 2.4 and may mean this should be a hotfix.

> **Hotfix note (non-standard path - detect and defer, do not automate).** The hotfix situation
> arises when Toolbox on `develop` has already adopted breaking changes for an unreleased Hoist
> snapshot, so `develop` *cannot* take a versioned Hoist release. The resolution is to branch off
> `master`, cherry-pick only the changes to ship, and run Build Release with **`is-hotfix=true`**
> from that branch. This skill focuses on the standard path. If Phase 2.4 or the lint/build check
> reveals this situation, surface it and sketch the branch-off-master / cherry-pick / `is-hotfix`
> approach, then defer to the developer - they should already be operating in that mode.

---

## Phase 4: Finalize the CHANGELOG

The `CHANGELOG.md` is parsed at build time and shown in-app, so correctness and formatting matter.
Read `CLAUDE.md` ("Changelog" section) for the full conventions; the essentials:

### 1. Choose the release version (semver)

The unreleased header's number is a working placeholder, **not** authoritative. Decide the real
version from what actually changed, and **suggest** a level to the developer:

- **Major** - a large set of feature work or a reorg/redesign (developer's discretion).
- **Minor** - a notable Hoist library bump with Toolbox otherwise steady.
- **Patch** - a Hoist patch release or Toolbox bugfixes only.

Validate the choice: the Build Release action requires the version be **exactly one increment**
(major, minor, or patch) from the latest existing release tag. Find the latest tag with
`git tag --list 'v*' --sort=-v:refname | head -1` (or `gh release list --limit 1`). Confirm the
proposed version is a valid single increment (e.g. latest `9.0.0` -> valid: `10.0.0`, `9.1.0`,
`9.0.1`). **Confirm the final version with the developer.**

### 2. Finalize the entries

- Change the top header from `## x.y...-SNAPSHOT - unreleased` to `## <chosen-version> - <today>`
  using the **full 3-part semver** for the released version and today's date (`YYYY-MM-DD`).
- Review the accumulated entries for completeness - scan commits since the last release tag
  (`git log <last-tag>..HEAD --oneline`) for material features, bug fixes, or technical changes not
  yet captured. Add what's missing under the right category (`New Features`, `Bug Fixes`,
  `Technical`, `Breaking Changes`).
- Add/confirm a **`Libraries`** entry recording the Hoist bump, e.g. `* @xh/hoist \`86.0 -> 86.1\``
  (and hoist-core if it moved). Follow the form already used in the file.
- **Formatting is critical**: every bullet must be a **single line** (the parser drops wrapped
  continuation lines and nested sub-bullets silently). No matter how long, one bullet = one line.
- **No em dashes** anywhere in the copy (per user/global style) - use a plain hyphen.

---

## Phase 5: Commit on develop

Stage the library swaps, the lockfile, and the finalized CHANGELOG, and commit on `develop`:

```bash
git add gradle.properties client-app/package.json client-app/yarn.lock CHANGELOG.md
git commit -m "Toolbox <version> - release against Hoist <core-ver> / hoist-react <hr-ver>"
```

Match the repo's commit-message conventions (no hard wrapping in the body, no AI attribution
trailer). Show the developer the staged diff before committing if there's any ambiguity.

---

## Phase 6: Merge develop into master

Toolbox does versioned releases from `master`. Move the just-finalized commit onto `master` with a
**fast-forward-only** merge so master lands exactly on the release commit:

Propose and confirm, then run:

```bash
git checkout master
git merge --ff-only develop
```

If the ff-merge fails (master has diverged), **stop and ask** - do not force or create a non-ff
merge without the developer's direction.

---

## Phase 7: Push (ask first - never assume)

**Do not assume pushing is allowed or wanted.** Many developers (the default posture here) push
themselves as a final human checkpoint. Surface the exact commands and ask whether the developer
wants you to push or will do it themselves:

```bash
git push origin master
git push origin develop
```

Only run them on an explicit go. If the developer pushes themselves, wait for them to confirm both
branches are pushed before continuing - Build Release runs from the pushed `master`.

---

## Phase 8: Build Release + Deploy Release

Both the build and the prod deploy run as GitHub Actions. **Deploy Release is automatic** - it
triggers on a successful Build Release (`workflow_run`) and deploys to the `toolbox-prod` ECS
service. So you trigger one workflow and watch two.

### 0. Confirm this runbook still matches the build/deploy docs

Before triggering anything, read `docs/build-and-deploy.md` (from the repo root - the
"Build Release", "Deploy Release", and AWS sections) and verify it still confirms the specifics
this phase relies on - they can drift if the workflows are edited:

- Workflow filenames (`buildRelease.yml`, `deployRelease.yml`) and their inputs (`version`,
  `is-hotfix`).
- Build Release is manually triggered **from `master`** (the `validate` job rejects `develop`).
- Deploy Release fires **automatically** on a successful Build Release and targets the
  **`toolbox-prod`** ECS service (cluster `toolbox`).

If the doc - or the actual workflow files in `.github/workflows/` - disagrees with the steps below
(different inputs, branch rules, a manual rather than automatic prod deploy, a different service),
**stop and alert the developer** with the specific discrepancy rather than running a stale command.
The mechanics, not this skill's prose, are authoritative; flag the mismatch so both can be brought
back in sync.

### 1. Trigger Build Release (from master)

Confirm the version with the developer one last time, then:

```bash
gh workflow run buildRelease.yml --ref master -f version=<version> -f is-hotfix=false
```

(`--ref master` is required - the workflow's `validate` job refuses to run a standard release from
`develop`.)

### 2. Watch Build Release

Find the run and follow it:

```bash
gh run list --workflow buildRelease.yml --limit 1
gh run watch <run-id> --exit-status
```

Build Release validates the version, builds the tomcat (WAR via `-PxhAppVersion`) and nginx
(client) images in parallel, pushes them to ECR with `:<version>` and `:latest` tags, then creates
the `v<version>` git tag and a GitHub Release. If `validate` fails, read the logs
(`gh run view <run-id> --log-failed`) - the most common cause is a version that isn't a valid
single increment, or running from the wrong branch.

### 3. Watch Deploy Release (auto-triggered)

After Build Release succeeds, Deploy Release fires automatically. Find and watch it:

```bash
gh run list --workflow deployRelease.yml --limit 1
gh run watch <run-id> --exit-status
```

It forces a new ECS deployment of `toolbox-prod`. Confirm it completes successfully. (The ECS
rollout itself - tasks turning healthy - happens on AWS after the action's `update-service` call
returns; if the developer wants to verify the live app, point them at the prod URL or the AWS
runbook in `docs/aws-access.md`.)

### 4. Confirm success

Report: Build Release succeeded, the `v<version>` tag + GitHub Release exist, and Deploy Release
succeeded. **Only proceed to restore once the release is confirmed successful.** If anything
failed, stop and work the failure with the developer - do not restore develop over a broken
release.

---

## Phase 9: Restore develop to working SNAPSHOTs

With the release confirmed, return `develop` to its canary state. Switch back first:

```bash
git checkout develop
```

### 1. Restore the Hoist libraries to SNAPSHOTs

Reset the two libraries (leave hoist-dev-utils on its release version). The target snap depends on
the Phase 2 case for each library:

- **"Major just released" case** (you shipped the matching major, e.g. `87.0.0`): advance to the
  **next** major snap - `88.0.0-SNAPSHOT` for hoist-react, the matching next-major
  `x.y-SNAPSHOT` for hoist-core. Hoist itself has already moved there, so **verify it exists**
  before pinning (`npm view @xh/hoist@<ver> version`, or the snapshot Maven repo for core). If the
  expected next snap is missing, stop and ask.
- **"Still developing the major" case** (you shipped a prior-line release, e.g. `86.1.0` while on
  `87-SNAP`): restore to the **same snap you started from** (`^87.0.0-SNAPSHOT` for hoist-react,
  `41.0-SNAPSHOT` for hoist-core). You're still developing that major.

Restore the original version-string form (hoist-react typically a caret range like
`^87.0.0-SNAPSHOT`; hoist-core the `x.y-SNAPSHOT` form), then `cd client-app && yarn install` to
update the lockfile.

### 2. Advance the app SNAPSHOT version (all three places, in sync)

By the Java convention the working snap is always `(just_released_major + 1).0-SNAPSHOT`. Write that
2-part value to **all three** locations so they stay in sync:

- `gradle.properties` -> `xhAppVersion=<next-major>.0-SNAPSHOT`
- `client-app/package.json` -> `"version": "<next-major>.0-SNAPSHOT"`
- `CHANGELOG.md` -> a fresh top header `## <next-major>.0-SNAPSHOT - unreleased`

Examples: shipped `10.0.0` -> `11.0-SNAPSHOT`; shipped `10.1.1` -> `11.0-SNAPSHOT`; shipped a
minor/patch of the prior line such as `9.1.0` while snap was already `10.0-SNAPSHOT` -> stays
`10.0-SNAPSHOT` (the formula `(9+1)` reproduces the existing snap - a no-op). Writing all three
unconditionally also self-heals any prior drift found in Phase 1.5.

Leave the new CHANGELOG section empty (no category sub-headers) - entries accumulate as new work
lands.

### 3. Commit and push (ask first)

```bash
git add gradle.properties client-app/package.json client-app/yarn.lock CHANGELOG.md
git commit -m "Restore Hoist SNAPSHOTs and open <next-major>.0-SNAPSHOT for development"
```

Then, **same as Phase 7, ask before pushing** - do not assume:

```bash
git push origin develop
```

---

## Done

Summarize for the developer: released version, the Hoist versions shipped, the GitHub Release link,
prod deploy status, and the new working SNAPSHOT state of `develop`. Note anything that still needs
their attention (e.g. branches not yet pushed if they opted to push themselves).
