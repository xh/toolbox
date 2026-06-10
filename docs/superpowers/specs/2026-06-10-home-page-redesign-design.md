# Toolbox Home Page Redesign — Design Spec

**Date:** 2026-06-10 · **Status:** Approved direction, pending final copy refinement
**Target:** Toolbox 9.0 release

## Context & Goals

The desktop app home tab is the last major surface untouched by the "summer glow-up" redesign of
the example tabs. It currently renders a `DashContainer` with four widgets (Welcome, About
Toolbox, Hoist Roadmap, Hoist Commits). The Roadmap widget is badly stale (items last updated
5–6 years ago on prod) and actively undermines the message of an actively developed framework.

**Concept: "Front door + live pulse."** The redesigned home page does three jobs:

1. **Orient first-time visitors** — concrete, actionable next steps (docs, demos, source).
2. **Prove the framework is alive** — auto-updating feeds of hoist-react/hoist-core commits and
   releases. Backward-looking proof replaces forward-looking promises (Roadmap removed).
3. **Connect visitors to XH** — real team faces and contact channels, teasing the Contact demo.

**Audiences:** developers (XH internal, partner, recruits) and IT decision-makers (current and
potential clients).

**Hard constraint on content freshness:** every widget is either fully auto-updating (GitHub
feeds, env/version info, contacts config) or changes only when the app itself changes (launchpad
links, hero copy). No widget requires ongoing editorial upkeep.

## Confirmed Decisions

- Layout moves from `DashContainer` to **`DashCanvas`** (modern, mobile-friendly, and itself a
  demo of the newer component — same pattern as the Weather example).
- **Roadmap removed completely** — client widget, backend domain, admin UI (see Removal Scope).
- **Feedback widget is in** — lightweight "Enjoying Hoist?" rating card.
- **Releases feed covers core libraries only**: hoist-react and hoist-core.
- Hero copy drafted by Claude, refined with Anselm.

## Architecture

### Dash layout

`HomeTabModel` holds a `DashCanvasModel`:

- `columns: 12`, `rowHeight: ~50` (tune visually), `compact: 'vertical'`, `margin: [12, 12]`.
- `persistWith: {localStorageKey: 'homeDashCanvas'}` — new key; the old `homeDashboard`
  (DashContainer state) key is simply orphaned.
- "Restore Default Layout" affordance via the Dash model's built-in restore/default-state support.
- All viewSpecs `unique: true`. All widgets removable/re-addable (notably the feedback widget).

**Default layout** (12-col grid; x/width × height in rows — starting point, tune in browser):

| Widget | Position |
|---|---|
| Welcome (hero) | x0 w7 × h6 |
| Start Here | x7 w5 × h6 |
| Releases | x0 w4 × h7 |
| Hoist Activity (commits) | x4 w8 × h7 |
| Meet XH | x0 w5 × h5 |
| Under the Hood | x5 w4 × h5 |
| Enjoying Hoist? | x9 w3 × h5 |

### Visual design

Match the glow-up language defined in `desktop/common/Wrapper.scss`, `core/XhTilePatterns.scss`,
and `desktop/App.scss`:

- XH monogram tile backdrop behind the canvas; widgets float as cards with theme-aware shadows
  (light `0 2px 10px rgba(0,0,0,0.06)`, dark `0 3px 12px rgba(0,0,0,0.28)`), 8–10px radius.
- Hoist CSS vars for spacing/colors/intents throughout. Both themes verified.
- Hero and feedback widgets use `hidePanelHeader` for a cleaner card look; data widgets keep
  panel headers with icons (consistent with dash widget idiom).

## Widgets

### 1. Welcome (hero) — refreshed

Purpose: the pitch. XH + Hoist branding (existing logo treatment), tightened copy, inline CTAs.

**Draft copy (to refine together):**

> ### Build serious web apps, fast.
>
> Hoist is [Extremely Heavy]'s full-stack toolkit for data-dense enterprise web applications — a
> curated React + MobX front end with industrial-strength grids, charts, dashboards, and forms,
> paired with a Grails / Spring Boot server framework. Refined over a decade of continuous
> development on demanding real-world apps.
>
> Toolbox is the live reference app: every component and pattern demoed here is the real
> framework, and the full [source code] is open for review.
>
> CTAs: **Read the Docs** · **Browse the Source** · **Meet the Team**

Data: static copy + `XH.getUser()` greeting retained or dropped per copy refinement.
Maintenance: rare copy edits only.

### 2. Start Here — new

Purpose: actionable launchpad for first-time visitors. A compact stack of clickable mini-cards
(Examples-tab card idiom, scaled down), each with icon, title, one-line blurb:

| Entry | Destination |
|---|---|
| New to Hoist? Core concepts | Docs tab (`docs` route, hoist-react core README) |
| Tour the grids | Grids tab |
| Browse the example apps | Example Apps tab |
| Read the source | github.com/xh/hoist-react (new window) |
| Run it locally | Toolbox repo `docs/running-locally.md` on GitHub (new window) |

Internal links via `XH.navigate`/router; external via new window. Maintenance: only when tabs
change.

### 3. Releases — new

Purpose: auto-updating release feed for hoist-react + hoist-core; proof of cadence.

- Chronological list (DataView or simple rendered list): repo chip (colored consistently with
  the commits grid), version tag, release name, relative date, markdown-rendered excerpt of the
  auto-generated GitHub release body (truncated, expandable or popover for full), link to the
  GitHub release page.
- Header stat: "N releases in the last 90 days" across both repos.
- **Backend** (`GitHubService.groovy`): extend the existing GraphQL integration with a releases
  query (`releases(first: N, orderBy: CREATED_AT DESC) { tagName name description publishedAt
  url isPrerelease isDraft }`), filtering drafts/prereleases. New immutable `Release` value
  object + replicated Hazelcast cache `releasesByRepo`, refreshed by the same primary-node timer
  and webhook `forceRefresh()` as commits. New endpoint `GET /github/allReleases`
  (`@AccessAll`, `DataNotAvailableException` when unloaded — mirrors `allCommits`).
- New JSON config `gitHubReleaseRepos`, bootstrap default `["hoist-react", "hoist-core"]`
  (decoupled from `gitHubRepos`, which also tracks toolbox/hoist-dev-utils commits).
- **Client** (`core/svc/GitHubService.ts`): add `allReleases` observable, loaded on init and on
  the existing `gitHubUpdate` WebSocket message.

Zero curation; fully auto-updating.

### 4. Hoist Activity (commits) — kept, refreshed

- Keep the grid (demos Grid-in-dashboard) with day grouping, release-row highlighting (now
  cross-referencing the Releases widget), and filter field.
- Slim default columns to: repo, subject, author, committed date (others available via column
  chooser).
- Add compact stat header: total commits + commits this month.
- Data flow unchanged (already auto-updating via poll + webhook + WebSocket).

### 5. Meet XH (Team Spotlight) — new

Purpose: real humans behind the framework; teaser for the Contact demo.

- Fetches the same `/contacts` endpoint as the Contact app (real XH staff on prod, 13 engineers
  with photos, bios, locations, and tags).
- **Spotlight format**: features one randomly-selected team member — photo (from
  `/contact-images/`), name, location, tag chips, first paragraph of bio. Random pick per load
  means repeat visitors meet someone new, with zero curation.
- **Rotation**: gentle crossfade to another random member every ~20–30s while visible, plus an
  explicit shuffle/next button. Mini avatar row of the rest of the team along the bottom —
  click any face to spotlight that person.
- CTAs: "Meet the team" → opens `/contact` example (new window, consistent with example app
  launching), "Contact us" → `mailto:info@xh.io`, link to xh.io. No deep-linking to individual
  contacts (the Contact app doesn't support routed selection; out of scope here).
- Error/empty fallback (e.g. fetch failure): hide spotlight, keep the static contact CTAs.
  Local dev shows the fictional seed contacts — acceptable.

### 6. Under the Hood — slimmed About

- Compact version tables from `XH.environmentService`: app version/build/environment; server
  stack (Hoist Core, Grails, Java); client stack (Hoist React, React, AG Grid, Blueprint, MobX).
- Auto-accurate forever. Drop the old feedback button (superseded by the feedback widget).

### 7. Enjoying Hoist? — new

Purpose: frictionless sentiment capture, modeled on Claude Code's session-rating prompt; also
demos Hoist's activity-tracking-based feedback pattern.

- Compact card (`hidePanelHeader`): "Enjoying Hoist?" + three one-click rating buttons
  (negative / neutral / positive icons).
- On any click: immediately `XH.track({category: 'Feedback', message: 'Hoist sentiment: <x>',
  logData: true, ...})` (the same channel as Hoist's built-in `FeedbackDialogModel` — surfaces
  in the admin Activity Tracking view), then reveal an inline optional "Tell us more" textarea +
  send button (emphasized/auto-focused on a negative rating). Follow-up text tracked the same
  way; success toast on send.
- After responding, card collapses to a "Thanks for your feedback!" state with a quiet
  "update your rating" affordance. Responded/dismissed state + timestamp persisted in a new
  JSON user preference (bootstrap `PrefSpec`, e.g. `homeFeedback`) so it stays non-intrusive
  across visits and devices.
- Widget itself is removable from the canvas (and re-addable) like any other.
- No new backend — rides activity tracking end-to-end.

## Roadmap Removal Scope

**Client:**
- `client-app/src/desktop/tabs/home/widgets/roadmap/` (RoadmapWidget, RoadmapModel,
  RoadmapViewItem, scss) + viewSpec/layout refs in `HomeTabModel.ts`.
- Admin console: `client-app/src/admin/roadmap/` (PhaseRestPanel, ProjectRestPanel, index) +
  route/tab registration in `client-app/src/admin/AppModel.ts` (lines ~6, 38–39, 72–73).

**Server:**
- `grails-app/domain/io/xh/toolbox/roadmap/Phase.groovy`, `Project.groovy`
- `grails-app/services/io/xh/toolbox/roadmap/RoadmapService.groovy`
- `grails-app/controllers/io/xh/toolbox/roadmap/RoadmapController.groovy`
- `grails-app/controllers/io/xh/toolbox/admin/PhaseRestController.groovy`,
  `ProjectRestController.groovy`

**Config/data (deploy-time notes, not code):**
- `roadmapCategories` soft-config exists only in deployed envs (no bootstrap spec) — delete via
  admin console after release.
- Orphaned `phase`/`project` DB tables in deployed envs — optional manual drop.

## Error Handling & Degraded States

- **No GitHub token locally** (`gitHubAccessToken` = "none"/unset): `/github/allCommits` and
  `/allReleases` throw `DataNotAvailableException`. Both widgets must render a friendly inline
  placeholder ("GitHub data unavailable — see README for local config") — no error toasts/dialogs
  on home load.
- **Contacts fetch failure**: Meet XH degrades to static CTAs (above).
- Backend down entirely: standard Hoist exception handling; no special casing.

## Out of Scope

- Mobile app home and admin console (beyond roadmap tab removal).
- Examples/other desktop tabs.
- Any server-side feedback/email infrastructure (activity tracking suffices).

## Verification Plan

- Run locally (Grails backend + `yarn start`); confirm dev DB has a working `gitHubAccessToken`
  or exercise degraded states deliberately.
- Browser-verify in Chrome: default layout, both themes, widget drag/resize/remove/re-add,
  layout persistence across reload, restore-default.
- Feedback widget: ratings + follow-up appear in admin Activity Tracking; pref-backed state
  survives reload.
- Releases/commits: live data renders, release highlight rows match Releases widget entries.
- `yarn lint` + tsc (pre-commit hooks) clean.

## Changelog

Under `9.0-SNAPSHOT` (single-line bullets per repo convention):

- New Features: redesigned home page (DashCanvas, Start Here launchpad, Releases feed, Meet XH,
  feedback widget).
- Technical: removed the Hoist Roadmap widget, its admin editor, and backing domain.
