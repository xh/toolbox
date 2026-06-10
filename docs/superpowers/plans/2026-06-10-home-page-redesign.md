# Toolbox Home Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the desktop app home tab as a DashCanvas dashboard with auto-updating widgets (releases feed, commits, team spotlight, feedback), remove the stale Roadmap end-to-end, and match the "summer glow-up" visual language.

**Architecture:** `HomeTabModel` swaps `DashContainerModel` → `DashCanvasModel` (12-col grid, new persistence key). Backend `GitHubService.groovy` gains a GitHub Releases GraphQL fetch mirroring its commits pipeline (replicated cache, timer + webhook refresh, WebSocket push); client `GitHubService.ts` mirrors with an `allReleases` observable. Roadmap domain/controllers/admin-UI deleted. Spec: `docs/superpowers/specs/2026-06-10-home-page-redesign-design.md`.

**Tech Stack:** Hoist React (DashCanvas, GridModel, markdown cmp, Timer), Grails/hoist-core (BaseService, Cache, ConfigSpec/PreferenceSpec), GitHub GraphQL API.

**Verification:** Toolbox has no unit-test infrastructure. Each task verifies via TypeScript compile (`npx tsc --noEmit` from `client-app/`), `yarn lint:code`, Groovy compile (`./gradlew compileGroovy` from root), and live browser checks at milestones (backend running + `yarn start`, app at `http://localhost:3000/app/home`).

**Conventions:** Prettier 100-char, single quotes, no trailing commas, 4-space indent, no bracket spacing. Commit messages: single unwrapped lines, no hard-wrap. Feature branch `home-page-redesign` off `develop`; small commits, no force-push.

---

## File Structure

**Created:**
- `src/main/groovy/io/xh/toolbox/github/Release.groovy` — immutable release value object
- `client-app/src/desktop/tabs/home/HomeTab.scss` — tiled backdrop + card styling for the canvas
- `client-app/src/desktop/tabs/home/widgets/StartHereWidget.ts` + `.scss` — launchpad
- `client-app/src/desktop/tabs/home/widgets/releases/ReleasesWidget.ts` + `ReleasesWidgetModel.ts` + `.scss`
- `client-app/src/desktop/tabs/home/widgets/meetxh/MeetXhWidget.ts` + `MeetXhWidgetModel.ts` + `.scss`
- `client-app/src/desktop/tabs/home/widgets/UnderTheHoodWidget.ts` + `.scss` — slimmed About
- `client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidget.ts` + `FeedbackWidgetModel.ts` + `.scss`

**Modified:**
- `grails-app/services/io/xh/toolbox/app/GitHubService.groovy` — releases fetch/cache
- `grails-app/controllers/io/xh/toolbox/github/GitHubController.groovy` — `allReleases` endpoint
- `grails-app/init/io/xh/toolbox/BootStrap.groovy` — `gitHubReleaseRepos` config, `homeFeedback` pref
- `client-app/src/core/svc/GitHubService.ts` — `allReleases` observable
- `client-app/src/desktop/tabs/home/HomeTabModel.ts` — DashCanvasModel rewrite
- `client-app/src/desktop/tabs/home/HomeTab.ts` — dashCanvas + tiled frame
- `client-app/src/desktop/tabs/home/widgets/WelcomeWidget.ts` + `.scss` — hero rewrite
- `client-app/src/desktop/tabs/home/widgets/activity/ActivityWidgetModel.ts` — slimmed columns + stats
- `client-app/src/desktop/tabs/home/widgets/activity/ActivityWidget.ts` — stat header
- `client-app/src/admin/AppModel.ts` — remove roadmap routes/tab
- `CHANGELOG.md` — 9.0-SNAPSHOT entries

**Deleted:**
- `client-app/src/desktop/tabs/home/widgets/roadmap/` (4 files)
- `client-app/src/desktop/tabs/home/widgets/AboutToolboxWidget.ts` + `.scss` (replaced by UnderTheHood)
- `client-app/src/admin/roadmap/` (3 files)
- `grails-app/domain/io/xh/toolbox/roadmap/` (Phase, Project)
- `grails-app/services/io/xh/toolbox/roadmap/RoadmapService.groovy`
- `grails-app/controllers/io/xh/toolbox/roadmap/RoadmapController.groovy`
- `grails-app/controllers/io/xh/toolbox/admin/PhaseRestController.groovy` + `ProjectRestController.groovy`

---

### Task 1: Branch setup

- [ ] **Step 1.1:** From `/Users/amcclain/dev/toolbox`, confirm clean tree and create branch:

```bash
git status --short && git checkout develop && git pull && git checkout -b home-page-redesign
```

Expected: no uncommitted changes, new branch created.

---

### Task 2: Backend — `Release` value object

**Files:** Create `src/main/groovy/io/xh/toolbox/github/Release.groovy`

- [ ] **Step 2.1:** Create the file, mirroring sibling `Commit.groovy`:

```groovy
package io.xh.toolbox.github

import io.xh.hoist.json.JSONFormatCached

import java.time.Instant
import java.time.format.DateTimeFormatter

/**
 * Immutable value object for a published GitHub release, as fetched by GitHubService.
 */
class Release extends JSONFormatCached {

    final String id
    final String repo
    final String tagName
    final String name
    final String description
    final String publishedAtStr
    final Date publishedAt
    final String url

    Release(Map mp) {
        id = "${mp.repo}-${mp.tagName}"
        repo = mp.repo
        tagName = mp.tagName
        name = mp.name
        description = mp.description
        publishedAtStr = mp.publishedAt
        publishedAt = parseDate(publishedAtStr)
        url = mp.url
    }

    String toString() {id}
    int hashCode() {Objects.hashCode(id)}
    boolean equals(Object other) {other instanceof Release && Objects.equals(other.id, id)}

    private Date parseDate(String dateStr) {
        return Date.from(Instant.from(DateTimeFormatter.ISO_INSTANT.parse(dateStr)))
    }

    Map formatForJSON() {
        return [
            id: id,
            repo: repo,
            tagName: tagName,
            name: name,
            description: description,
            publishedAt: publishedAt,
            url: url
        ]
    }
}
```

- [ ] **Step 2.2:** Verify compile: `./gradlew compileGroovy` → BUILD SUCCESSFUL.

- [ ] **Step 2.3:** Commit: `git add src/main/groovy/io/xh/toolbox/github/Release.groovy && git commit -m "Add Release value object for GitHub releases feed"`

---

### Task 3: Backend — releases fetch in `GitHubService`

**Files:** Modify `grails-app/services/io/xh/toolbox/app/GitHubService.groovy`

- [ ] **Step 3.1:** Add import for `Release` (already in package `io.xh.toolbox.github`, alongside existing `Commit`/`CommitHistory` imports):

```groovy
import io.xh.toolbox.github.Release
```

- [ ] **Step 3.2:** Update `clearCachesConfigs` (line ~38) to include the new config:

```groovy
static clearCachesConfigs = ['gitHubRepos', 'gitHubReleaseRepos', 'gitHubAccessToken', 'gitHubMaxPagesPerLoad']
```

- [ ] **Step 3.3:** Add a second cache below `commitsByRepoCache` (line ~50):

```groovy
/**
 * Non-expiring, replicated cache of published (non-draft, non-prerelease) releases by repo
 * name, most recent first. Populated via the same primaryOnly timer as commits.
 */
private Cache<String, List<Release>> releasesByRepoCache = createCache(
    name: 'releasesByRepo',
    replicate: true
)
```

- [ ] **Step 3.4:** Point the timer at a new wrapper fn and rename it (in `init()`, line ~55):

```groovy
refreshTimer = createTimer(
    name: 'loadGitHubData',
    runFn: this.&loadAllGitHubData,
    interval: 'gitHubCommitsRefreshMins',
    intervalUnits: MINUTES,
    primaryOnly: true
)
```

- [ ] **Step 3.5:** Add public getter below `getCommitsForRepo()` (line ~77):

```groovy
/** Return map of all available published releases, keyed by repo name. */
Map<String, List<Release>> getReleasesByRepo() {
    releasesByRepoCache.map
}
```

- [ ] **Step 3.6:** Add the wrapper + release loaders at the top of the Implementation section (above `loadCommitsForAllRepos`):

```groovy
private void loadAllGitHubData() {
    loadCommitsForAllRepos()
    loadReleasesForAllRepos()
}

private void loadReleasesForAllRepos() {
    if (configService.getString('gitHubAccessToken', 'none') == 'none') {
        logWarn('Required "gitHubAccessToken" config not present or set to "none" - no releases will be loaded from GitHub.')
        return
    }

    def repos = configService.getList('gitHubReleaseRepos', []),
        changed = false

    span('getReleases')
        .logInfo("Refreshing GitHub releases for ${repos.size()} configured repositories")
        .run {
            repos.each {
                def repoName = it as String,
                    newReleases = loadReleasesForRepo(repoName)

                // Null indicates a fetch/parse error - leave any cached data in place.
                if (newReleases != null) {
                    def prior = releasesByRepoCache.get(repoName)
                    if (prior*.id != newReleases*.id) changed = true
                    releasesByRepoCache.put(repoName, newReleases)
                }
            }

            if (changed) {
                logDebug('Found new or changed releases - pushing update...')
                pushUpdate()
            }
        }
}

private List<Release> loadReleasesForRepo(String repoName) {
    try {
        def response = fetchReleases(repoName)
        if (response?.data?.repository?.name != repoName) {
            throw new RuntimeException("JSON returned by GitHub API not in expected format")
        }

        def rawReleases = response.data.repository.releases.nodes as List<Map>
        return rawReleases
            .findAll {!it.isDraft && !it.isPrerelease}
            .collect {raw ->
                new Release(
                    repo: repoName,
                    tagName: raw.tagName,
                    name: raw.name,
                    description: raw.description,
                    publishedAt: raw.publishedAt,
                    url: raw.url
                )
            }
    } catch (e) {
        logError("Failure fetching releases for $repoName", e)
        return null
    }
}

private Map fetchReleases(String repoName) {
    def query = """
query XHRepoReleases {
    repository(owner: "xh", name: "$repoName") {
        name
        releases(first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
                tagName
                name
                description
                publishedAt
                url
                isPrerelease
                isDraft
            }
        }
    }
}
"""
    def post = new HttpPost('https://api.github.com/graphql')
    post.setHeader('Accept', 'application/json')
    post.setHeader('Content-type', 'application/json')
    post.setHeader('Authorization', "bearer ${configService.getString('gitHubAccessToken')}")
    post.setEntity(new StringEntity(JSONSerializer.serialize([query: query])))

    jsonClient.executeAsMap(post)
}
```

- [ ] **Step 3.7:** Update `clearCaches()` to clear the new cache (line ~241):

```groovy
void clearCaches() {
    _jsonClient = null
    if (isPrimary) {
        commitsByRepoCache.clear()
        releasesByRepoCache.clear()
        forceRefresh()
    }
    super.clearCaches()
}
```

- [ ] **Step 3.8:** Update `getAdminStats()` config list (line ~250):

```groovy
config: configForAdminStats('gitHubAccessToken', 'gitHubRepos', 'gitHubReleaseRepos', 'gitHubMaxPagesPerLoad')
```

- [ ] **Step 3.9:** Verify compile: `./gradlew compileGroovy` → BUILD SUCCESSFUL.

- [ ] **Step 3.10:** Commit: `git add grails-app/services/io/xh/toolbox/app/GitHubService.groovy && git commit -m "Extend GitHubService to fetch published GitHub releases alongside commits"`

**Note for executor:** If Hazelcast replication complains about serializing `List<Release>` at runtime (existing `CommitHistory` pattern suggests it won't), wrap the list in a small `ReleaseHistory` class mirroring `CommitHistory`.

---

### Task 4: Backend — `allReleases` endpoint + config/pref specs

**Files:** Modify `grails-app/controllers/io/xh/toolbox/github/GitHubController.groovy`, `grails-app/init/io/xh/toolbox/BootStrap.groovy`

- [ ] **Step 4.1:** Add endpoint to `GitHubController` below `allCommits()` (line ~27):

```groovy
def allReleases() {
    def ret = gitHubService.releasesByRepo
    if (ret.isEmpty()) {
        throw new DataNotAvailableException("GitHub releases have not been loaded on this Toolbox instance - the service might not be configured to run.")
    } else {
        renderJSON(ret)
    }
}
```

- [ ] **Step 4.2:** In `BootStrap.groovy`, add a `ConfigSpec` immediately after the `gitHubRepos` spec (after line ~178):

```groovy
new ConfigSpec(
    name: 'gitHubReleaseRepos',
    valueType: 'json',
    defaultValue: ['hoist-react', 'hoist-core'],
    clientVisible: true,
    groupName: 'GitHub Integration',
    note: 'List of repos from which Toolbox will pull published GitHub releases to display on its home page.'
),
```

- [ ] **Step 4.3:** In `BootStrap.groovy` `ensureRequiredPrefsCreated()` (line ~280), add a `PreferenceSpec` after the `font` spec:

```groovy
new PreferenceSpec(
    name: 'homeFeedback',
    type: 'json',
    defaultValue: [:],
    groupName: 'Toolbox',
    notes: 'Response state for the home page "Enjoying Hoist?" feedback widget.'
),
```

- [ ] **Step 4.4:** Verify compile: `./gradlew compileGroovy` → BUILD SUCCESSFUL.

- [ ] **Step 4.5:** Commit: `git add grails-app/controllers/io/xh/toolbox/github/GitHubController.groovy grails-app/init/io/xh/toolbox/BootStrap.groovy && git commit -m "Add gitHub/allReleases endpoint plus gitHubReleaseRepos config and homeFeedback pref specs"`

---

### Task 5: Backend — remove Roadmap

**Files:** Delete roadmap domain/service/controllers.

- [ ] **Step 5.1:** Delete the files:

```bash
git rm -r grails-app/domain/io/xh/toolbox/roadmap grails-app/services/io/xh/toolbox/roadmap grails-app/controllers/io/xh/toolbox/roadmap grails-app/controllers/io/xh/toolbox/admin/PhaseRestController.groovy grails-app/controllers/io/xh/toolbox/admin/ProjectRestController.groovy
```

- [ ] **Step 5.2:** Search for stragglers: `grep -rin "roadmap\|io.xh.toolbox.roadmap" grails-app/ src/main/ --include="*.groovy"` → expect no hits.

- [ ] **Step 5.3:** Verify compile: `./gradlew compileGroovy` → BUILD SUCCESSFUL.

- [ ] **Step 5.4:** Commit: `git commit -m "Remove Roadmap domain, service, and controllers - widget retired in favor of auto-updating GitHub feeds"`

---

### Task 6: Client — releases in `GitHubService.ts`

**Files:** Modify `client-app/src/core/svc/GitHubService.ts`

- [ ] **Step 6.1:** Add the `Release` interface below the existing `Commit` interface:

```typescript
export interface Release {
    id: string;
    repo: string;
    tagName: string;
    name: string;
    description: string;
    publishedAt: Date;
    url: string;
}
```

- [ ] **Step 6.2:** Add observable + computed to the service class, below `allCommits`:

```typescript
/** Loaded published releases, keyed by repoName. */
@observable.ref releasesByRepo: Record<string, Release[]> = {};

/** Loaded array of releases across all repositories, most recent first. */
@computed
get allReleases(): Release[] {
    const ret = [];
    forOwn(this.releasesByRepo, v => ret.push(...v));
    return sortBy(ret, it => -it.publishedAt);
}
```

- [ ] **Step 6.3:** Replace the single fetch in `doLoadAsync` with a parallel fetch of both endpoints. Each endpoint is individually caught so an unconfigured/failing feed degrades to empty without breaking the other (matches today's swallow-on-error behavior):

```typescript
override async doLoadAsync(loadSpec: LoadSpec) {
    await this.runner({loadSpec})
        .span('loadGitHubData')
        .track('Loaded GitHub commit and release history')
        .run(async ctx => {
            const priorCommitCount = this.allCommits.length,
                [commitHistories, releasesByRepo] = await Promise.all([
                    XH.fetchJson({url: 'gitHub/allCommits'}, ctx).catch(() => ({})),
                    XH.fetchJson({url: 'gitHub/allReleases'}, ctx).catch(() => ({}))
                ]);

            forOwn(commitHistories, v => {
                // Minor translations here on client for convenience.
                v.commits.forEach(it => {
                    it.authorEmail = it.author.email;
                    it.authorName = it.author.name || it.authorEmail;
                    it.committedDate = new Date(it.committedDate);
                    it.committedDay = LocalDate.from(it.committedDate);
                    it.isRelease =
                        it.authorEmail === 'techops@xh.io' &&
                        it.messageHeadline.startsWith('v');
                });
            });

            forOwn(releasesByRepo, v => {
                v.forEach(it => (it.publishedAt = new Date(it.publishedAt)));
            });

            runInAction(() => {
                this.commitHistories = commitHistories;
                this.releasesByRepo = releasesByRepo;
            });

            const newCommitCount = this.allCommits.length;
            if (priorCommitCount && newCommitCount > priorCommitCount) {
                XH.toast({
                    message: 'New Hoist commit detected!',
                    icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
                    intent: 'primary'
                });
            }
        })
        .catch(e => XH.handleException(e, {showAlert: false, showAsError: false}));
}
```

- [ ] **Step 6.4:** Verify: `cd client-app && npx tsc --noEmit` → clean (or pre-existing errors only).

- [ ] **Step 6.5:** Commit: `git add client-app/src/core/svc/GitHubService.ts && git commit -m "Add allReleases observable to client GitHubService"`

---

### Task 7: Home tab scaffold — DashCanvas + styling shell

**Files:** Rewrite `HomeTabModel.ts` + `HomeTab.ts`; create `HomeTab.scss`. Widgets that don't exist yet are stubbed into the layout in later tasks — at this stage, wire the three surviving widgets (welcome, about→ temporarily kept, activity) so the canvas is verifiable in-browser early.

- [ ] **Step 7.1:** Rewrite `client-app/src/desktop/tabs/home/HomeTabModel.ts`:

```typescript
import {br, fragment} from '@xh/hoist/cmp/layout';
import {managed, HoistModel, XH} from '@xh/hoist/core';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {Icon} from '@xh/hoist/icon';
import {aboutToolboxWidget} from './widgets/AboutToolboxWidget';
import {activityWidget} from './widgets/activity/ActivityWidget';
import {welcomeWidget} from './widgets/WelcomeWidget';

export class HomeTabModel extends HoistModel {
    @managed
    dashModel: DashCanvasModel;

    constructor() {
        super();
        this.dashModel = new DashCanvasModel({
            persistWith: {localStorageKey: 'homeDashCanvas'},
            columns: 12,
            rowHeight: 50,
            compact: 'vertical',
            margin: [12, 12],
            containerPadding: [16, 16],
            viewSpecDefaults: {unique: true},
            viewSpecs: [
                {
                    id: 'welcome',
                    title: 'Welcome',
                    icon: Icon.home(),
                    content: welcomeWidget,
                    hidePanelHeader: true
                },
                {
                    id: 'underTheHood',
                    title: 'Under the Hood',
                    icon: Icon.info(),
                    content: aboutToolboxWidget
                },
                {
                    id: 'activity',
                    title: 'Hoist Commits',
                    icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
                    content: activityWidget
                }
            ],
            initialState: [
                {viewSpecId: 'welcome', layout: {x: 0, y: 0, w: 7, h: 6}},
                {viewSpecId: 'underTheHood', layout: {x: 7, y: 0, w: 5, h: 6}},
                {viewSpecId: 'activity', layout: {x: 4, y: 6, w: 8, h: 7}}
            ],
            extraMenuItems: [
                {
                    text: 'Restore Default Layout',
                    icon: Icon.reset(),
                    actionFn: () => this.restoreDefaultsAsync()
                }
            ]
        });
    }

    private async restoreDefaultsAsync() {
        const confirmed = await XH.confirm({
            title: 'Please confirm...',
            message: fragment(
                'This will reset your home dashboard to its default layout, including any widget customizations.',
                br(),
                br(),
                'Are you sure you wish to continue?'
            ),
            confirmProps: {text: 'Yes, restore defaults'}
        });

        if (confirmed) this.dashModel.restoreDefaults();
    }
}
```

(Note: `underTheHood` viewSpec temporarily points at `aboutToolboxWidget`; Task 12 swaps in the new widget. Final `initialState` with all 7 widgets lands in Task 14.)

- [ ] **Step 7.2:** Rewrite `client-app/src/desktop/tabs/home/HomeTab.ts`:

```typescript
import {frame} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {dashCanvas} from '@xh/hoist/desktop/cmp/dash';
import {HomeTabModel} from './HomeTabModel';
import './HomeTab.scss';

export const homeTab = hoistCmp.factory({
    model: creates(HomeTabModel),
    render() {
        return frame({
            className: 'tb-home xh-tiled-bg',
            item: dashCanvas()
        });
    }
});
```

- [ ] **Step 7.3:** Create `client-app/src/desktop/tabs/home/HomeTab.scss` — float dash views as cards over the tiled backdrop, matching `Wrapper.scss`:

```scss
.tb-home {
  // Floating-card shadow shared with the example-tab Wrapper treatment (see Wrapper.scss).
  --tbox-card-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);

  .xh-dark & {
    --tbox-card-shadow: 0 3px 12px rgba(0, 0, 0, 0.28);
  }

  .xh-dash-tab {
    border: var(--xh-border-solid);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--tbox-card-shadow);
  }
}
```

- [ ] **Step 7.4:** Verify: `npx tsc --noEmit` + `yarn lint` from `client-app/` → clean.

- [ ] **Step 7.5:** Browser check (backend + dev server running): load `http://localhost:3000/app/home`. Expect: tiled backdrop visible in gutters, three widgets as floating cards, drag/resize works, layout persists across reload, "Restore Default Layout" in widget menus works. Both themes (toggle via Options).

- [ ] **Step 7.6:** Commit: `git add -A client-app/src/desktop/tabs/home && git commit -m "Rebuild home tab on DashCanvas with tiled backdrop and floating-card styling"`

---

### Task 8: Welcome hero widget

**Files:** Rewrite `widgets/WelcomeWidget.ts` + `.scss`

- [ ] **Step 8.1:** Rewrite `WelcomeWidget.ts` with the draft hero copy (flagged for review with Anselm before release):

```typescript
import {a, div, hbox, hframe, img, p} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
// @ts-ignore
import xhHoist from '../../../../core/img/xh+hoist.png';
import './WelcomeWidget.scss';

export const welcomeWidget = hoistCmp.factory({
    displayName: 'WelcomeWidget',
    render() {
        const link = (txt: string, url: string) => a({href: url, target: '_blank', item: txt});
        return panel({
            className: 'tb-welcome-widget',
            item: hframe(
                div({
                    className: 'tb-welcome-widget__logo',
                    item: img({src: xhHoist, alt: 'XH + Hoist'})
                }),
                div({
                    className: 'tb-welcome-widget__content',
                    items: [
                        div({
                            className: 'tb-welcome-widget__headline',
                            item: 'Build serious web apps, fast.'
                        }),
                        p(
                            'Hoist is ',
                            link('Extremely Heavy', 'https://xh.io'),
                            "'s full-stack toolkit for data-dense enterprise web applications — a curated React + MobX front end with industrial-strength grids, charts, dashboards, and forms, paired with a Grails / Spring Boot server framework. Refined over a decade of continuous development on demanding real-world apps."
                        ),
                        p(
                            'Toolbox is the live reference app: every component and pattern demoed here is the real framework, and the full ',
                            link('source code', 'https://github.com/xh/toolbox'),
                            ' is open for review.'
                        ),
                        hbox({
                            className: 'tb-welcome-widget__ctas',
                            items: [
                                button({
                                    text: 'Read the Docs',
                                    icon: Icon.book(),
                                    intent: 'primary',
                                    minimal: false,
                                    onClick: () => XH.navigate('default.docs')
                                }),
                                button({
                                    text: 'Browse the Source',
                                    icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
                                    minimal: false,
                                    onClick: () =>
                                        XH.openWindow('https://github.com/xh/hoist-react', 'gitlink')
                                }),
                                button({
                                    text: 'Meet the Team',
                                    icon: Icon.users(),
                                    minimal: false,
                                    onClick: () => XH.openWindow('/contact', 'contact')
                                })
                            ]
                        })
                    ]
                })
            )
        });
    }
});
```

- [ ] **Step 8.2:** Rewrite `WelcomeWidget.scss`:

```scss
.tb-welcome-widget {
  &__logo {
    padding: var(--xh-pad-double-px);
    display: flex;
    justify-content: center;
    flex-direction: column;
    width: 25%;
    min-width: 140px;

    img {
      object-fit: contain !important;
      max-width: 100%;
      max-height: 100%;
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--xh-pad-double-px);
    display: flex;
    flex-direction: column;
    gap: var(--xh-pad-px);

    p {
      margin: 0;
      font-size: var(--xh-font-size-large-px);
      line-height: 1.5;
    }
  }

  &__headline {
    font-size: 1.6em;
    font-weight: 600;
  }

  &__ctas {
    gap: var(--xh-pad-px);
    margin-top: var(--xh-pad-px);
    flex-wrap: wrap;
  }
}
```

- [ ] **Step 8.3:** Verify `Icon.users` exists: `grep -n "users:" /Users/amcclain/dev/hoist-react/icon/Icon.ts` (substitute `Icon.userGroup`/similar if missing). Run `npx tsc --noEmit`.

- [ ] **Step 8.4:** Browser check: hero renders header-less (hidePanelHeader), copy + CTAs correct, Docs CTA switches tab, both themes.

- [ ] **Step 8.5:** Commit: `git add -A client-app/src/desktop/tabs/home/widgets && git commit -m "Redesign Welcome widget as home page hero with new pitch copy and CTAs"`

---

### Task 9: Start Here widget

**Files:** Create `widgets/StartHereWidget.ts` + `.scss`

- [ ] **Step 9.1:** Create `StartHereWidget.ts`:

```typescript
import {div, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {ReactElement} from 'react';
import './StartHereWidget.scss';

interface StartHereItem {
    icon: ReactElement;
    title: string;
    blurb: string;
    onClick: () => void;
}

const ITEMS: StartHereItem[] = [
    {
        icon: Icon.book(),
        title: 'New to Hoist? Start with the docs',
        blurb: 'Core concepts, components, and patterns — searchable, right here in Toolbox.',
        onClick: () => XH.navigate('default.docs')
    },
    {
        icon: Icon.grid(),
        title: 'Tour the grids',
        blurb: "Hoist's flagship component — start with the standard grid and work up to tree maps.",
        onClick: () => XH.navigate('default.grids')
    },
    {
        icon: Icon.rocket(),
        title: 'Browse the example apps',
        blurb: 'Complete mini-apps — portfolio, weather, contacts, news, and more.',
        onClick: () => XH.navigate('default.examples')
    },
    {
        icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
        title: 'Read the source',
        blurb: 'hoist-react on GitHub — the entire framework, in the open.',
        onClick: () => XH.openWindow('https://github.com/xh/hoist-react', 'gitlink')
    },
    {
        icon: Icon.terminal(),
        title: 'Run it locally',
        blurb: 'Clone Toolbox and have the full stack running on your machine in minutes.',
        onClick: () =>
            XH.openWindow(
                'https://github.com/xh/toolbox/blob/develop/docs/running-locally.md',
                'gitlink'
            )
    }
];

export const startHereWidget = hoistCmp.factory({
    displayName: 'StartHereWidget',
    render() {
        return panel({
            className: 'tb-start-here',
            item: vbox({
                className: 'tb-start-here__items',
                items: ITEMS.map(it =>
                    div({
                        className: 'tb-start-here__item',
                        onClick: it.onClick,
                        items: [
                            div({className: 'tb-start-here__item-icon', item: it.icon}),
                            div({
                                className: 'tb-start-here__item-text',
                                items: [
                                    div({className: 'tb-start-here__item-title', item: it.title}),
                                    div({className: 'tb-start-here__item-blurb', item: it.blurb})
                                ]
                            }),
                            Icon.chevronRight({className: 'tb-start-here__item-caret'})
                        ]
                    })
                )
            })
        });
    }
});
```

- [ ] **Step 9.2:** Create `StartHereWidget.scss`:

```scss
.tb-start-here {
  &__items {
    padding: var(--xh-pad-px);
    gap: var(--xh-pad-half-px);
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--xh-pad-px);
    padding: var(--xh-pad-px);
    border: var(--xh-border-solid);
    border-radius: var(--xh-border-radius-px);
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background-color: var(--xh-bg-alt);
    }
  }

  &__item-icon {
    flex: none;
    width: 32px;
    text-align: center;
    font-size: var(--xh-font-size-large-px);
    color: var(--xh-text-color-accent);
  }

  &__item-text {
    flex: 1;
    min-width: 0;
  }

  &__item-title {
    font-weight: 600;
  }

  &__item-blurb {
    color: var(--xh-text-color-muted);
    font-size: var(--xh-font-size-small-px);
  }

  &__item-caret {
    color: var(--xh-text-color-muted);
  }
}
```

- [ ] **Step 9.3:** Verify `Icon.rocket` / `Icon.terminal` / `Icon.chevronRight` exist (`grep -n "rocket:\|terminal:\|chevronRight:" /Users/amcclain/dev/hoist-react/icon/Icon.ts`); substitute close equivalents if missing. Verify `--xh-text-color-accent` var exists (`grep -rn "text-color-accent" /Users/amcclain/dev/hoist-react/styles` — fall back to `--xh-blue`).

- [ ] **Step 9.4:** Register in `HomeTabModel.ts`: import `startHereWidget`, add viewSpec `{id: 'startHere', title: 'Start Here', icon: Icon.mapSigns(), content: startHereWidget}` and add `{viewSpecId: 'startHere', layout: {x: 7, y: 0, w: 5, h: 6}}` to `initialState` (adjusting the temporary `underTheHood` slot down — exact final layout lands in Task 14).

- [ ] **Step 9.5:** `npx tsc --noEmit` clean; browser check: items render, internal navigation switches tabs, external links open new windows.

- [ ] **Step 9.6:** Commit: `git add -A client-app/src/desktop/tabs/home && git commit -m "Add Start Here launchpad widget to home page"`

---

### Task 10: Releases widget

**Files:** Create `widgets/releases/ReleasesWidgetModel.ts`, `ReleasesWidget.ts`, `ReleasesWidget.scss`

- [ ] **Step 10.1:** Create `ReleasesWidgetModel.ts`:

```typescript
import {HoistModel, XH} from '@xh/hoist/core';
import {Release} from '../../../../../core/svc/GitHubService';
import {olderThan, DAYS} from '@xh/hoist/utils/datetime';

export class ReleasesWidgetModel extends HoistModel {
    get releases(): Release[] {
        return XH.gitHubService.allReleases;
    }

    get recentCount(): number {
        return this.releases.filter(it => !olderThan(it.publishedAt.getTime(), 90 * DAYS)).length;
    }
}
```

(Verify `olderThan`/`DAYS` exports via `grep -rn "olderThan" /Users/amcclain/dev/hoist-react/utils/datetime/` — otherwise compare against `Date.now() - 90 * 24 * 60 * 60 * 1000` directly. Verify the relative import depth of `GitHubService` resolves — widget dir is `client-app/src/desktop/tabs/home/widgets/releases/`.)

- [ ] **Step 10.2:** Create `ReleasesWidget.ts`:

```typescript
import {markdown} from '@xh/hoist/cmp/markdown';
import {div, filler, hbox, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {Release} from '../../../../../core/svc/GitHubService';
import './ReleasesWidget.scss';
import {ReleasesWidgetModel} from './ReleasesWidgetModel';

export const releasesWidget = hoistCmp.factory({
    displayName: 'ReleasesWidget',
    model: creates(ReleasesWidgetModel),
    render({model}) {
        const {releases, recentCount} = model;

        if (!releases.length) {
            return panel({
                className: 'tb-releases',
                item: placeholder(
                    Icon.icon({iconName: 'github', prefix: 'fab'}),
                    'GitHub release data unavailable.',
                    'Check the gitHubAccessToken config if running locally.'
                )
            });
        }

        return panel({
            className: 'tb-releases',
            tbar: toolbar({
                compact: true,
                items: [
                    Icon.tag(),
                    span(`${recentCount} releases in the last 90 days`),
                    filler()
                ]
            }),
            item: vbox({
                className: 'tb-releases__list',
                items: releases.map(it => releaseCard({release: it, key: it.id}))
            })
        });
    }
});

interface ReleaseCardProps {
    release: Release;
}

const releaseCard = hoistCmp.factory<ReleaseCardProps>(({release}) => {
    const {repo, tagName, publishedAt, description, url} = release;
    return div({
        className: 'tb-releases__card',
        onClick: () => XH.openWindow(url, 'gitlink'),
        items: [
            hbox({
                className: 'tb-releases__card-header',
                items: [
                    span({className: `tb-releases__repo tb-releases__repo--${repo}`, item: repo}),
                    span({className: 'tb-releases__tag', item: tagName}),
                    filler(),
                    relativeTimestamp({timestamp: publishedAt})
                ]
            }),
            description
                ? div({
                      className: 'tb-releases__card-body',
                      item: markdown({content: description})
                  })
                : null
        ]
    });
});
```

- [ ] **Step 10.3:** Create `ReleasesWidget.scss`:

```scss
.tb-releases {
  &__list {
    padding: var(--xh-pad-px);
    gap: var(--xh-pad-px);
    overflow-y: auto;
  }

  &__card {
    border: var(--xh-border-solid);
    border-radius: var(--xh-border-radius-px);
    padding: var(--xh-pad-px);
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background-color: var(--xh-bg-alt);
    }
  }

  &__card-header {
    align-items: center;
    gap: var(--xh-pad-px);
  }

  &__repo {
    font-weight: 600;
    border-radius: var(--xh-border-radius-px);
    padding: 0 var(--xh-pad-half-px);

    // Match repo accent colors used by the activity grid (see ActivityWidget.scss).
    &--hoist-react {
      background-color: var(--xh-intent-primary-trans1);
    }

    &--hoist-core {
      background-color: var(--xh-intent-success-trans1);
    }
  }

  &__tag {
    font-family: var(--xh-font-family-mono);
    font-weight: 600;
  }

  &__card-body {
    margin-top: var(--xh-pad-half-px);
    max-height: 80px;
    overflow: hidden;
    position: relative;
    font-size: var(--xh-font-size-small-px);
    color: var(--xh-text-color-muted);

    // Fade out clamped content.
    &::after {
      content: '';
      position: absolute;
      inset: auto 0 0 0;
      height: 24px;
      background: linear-gradient(transparent, var(--xh-bg));
    }

    h2,
    h3 {
      font-size: 1em;
      margin: 0 0 var(--xh-pad-half-px);
    }

    ul {
      margin: 0;
      padding-left: var(--xh-pad-double-px);
    }
  }
}
```

(Check `ActivityWidget.scss` for the existing repo accent colors and reuse the same vars/colors for consistency. Verify `--xh-intent-*-trans1` vars exist in hoist-react styles; fall back to explicit rgba.)

- [ ] **Step 10.4:** Register in `HomeTabModel.ts`: import, viewSpec `{id: 'releases', title: 'Hoist Releases', icon: Icon.tag(), content: releasesWidget}`. Add to `initialState` per Task 14 layout.

- [ ] **Step 10.5:** `npx tsc --noEmit` clean. Browser check: releases render with live data (needs configured `gitHubAccessToken` in local DB — if unavailable, verify the placeholder degraded state instead), markdown bodies clamped with fade, click opens GitHub, stat header correct. Reactivity: render reads `model.releases` → service `@computed` → updates on WebSocket-triggered reloads.

- [ ] **Step 10.6:** Commit: `git add -A client-app/src/desktop/tabs/home && git commit -m "Add auto-updating Hoist Releases widget backed by new gitHub/allReleases endpoint"`

---

### Task 11: Activity widget refresh

**Files:** Modify `widgets/activity/ActivityWidgetModel.ts` + `ActivityWidget.ts`

- [ ] **Step 11.1:** In `ActivityWidgetModel.ts`, slim default visible columns — add `hidden: true` to the `changedLines` colId config and the `changedFiles` field config (both remain available via the existing colChooser). Leave repo/messageHeadline/authorName/committedDate visible.

- [ ] **Step 11.2:** Add stat getters to `ActivityWidgetModel`:

```typescript
get commitCount(): number {
    return XH.gitHubService.allCommits.length;
}

get monthCommitCount(): number {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return XH.gitHubService.allCommits.filter(it => it.committedDate.getTime() > monthAgo).length;
}
```

- [ ] **Step 11.3:** In `ActivityWidget.ts`, add a compact `tbar` above the grid:

```typescript
import {filler, span} from '@xh/hoist/cmp/layout';
import {fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
// ...in render(), on the panel:
tbar: toolbar({
    compact: true,
    items: [
        Icon.icon({iconName: 'github', prefix: 'fab'}),
        span({
            className: 'tb-activity__stats',
            item: `${fmtNumber(model.commitCount, {precision: 0, asHtml: true})} commits · ${fmtNumber(model.monthCommitCount, {precision: 0, asHtml: true})} in the last 30 days`
        }),
        filler()
    ]
}),
```

(Verify `fmtNumber` signature/`asHtml` usage against other toolbox callers — `grep -rn "fmtNumber" client-app/src/desktop | head`; simplest correct form wins. Plain template strings may be fine since counts need no formatting beyond thousands separators.)

- [ ] **Step 11.4:** Update the widget's empty state — the existing `emptyText` already covers the no-token case; confirm it renders reasonably inside the canvas card.

- [ ] **Step 11.5:** `npx tsc --noEmit` + browser check: stat header counts render and the grid defaults to the slimmed column set (clear `localStorage` or use a fresh profile if persisted grid state interferes).

- [ ] **Step 11.6:** Commit: `git add -A client-app/src/desktop/tabs/home/widgets/activity && git commit -m "Refresh Hoist Commits widget with stat header and slimmer default columns"`

---

### Task 12: Under the Hood widget

**Files:** Create `widgets/UnderTheHoodWidget.ts` + `.scss`; delete `AboutToolboxWidget.ts` + `.scss`

- [ ] **Step 12.1:** Create `UnderTheHoodWidget.ts` — trimmed from `AboutToolboxWidget` (drop TZ rows and the feedback bbar; keep snapshot-version annotation):

```typescript
import {div, h2, span, table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtDateTime} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import './UnderTheHoodWidget.scss';

export const underTheHoodWidget = hoistCmp.factory({
    displayName: 'UnderTheHoodWidget',
    render() {
        const get = (str: string) => XH.environmentService.get(str),
            startupTime = get('startupTime'),
            row = (label: string, data) => {
                data = data || span({item: 'Not available', className: 'xh-text-color-muted'});
                return tr(th(label), td(data));
            };

        // Snapshot versions are tagged with a timestamp - show that in local time here
        // to aid in identifying when/if a snapshot has been updated.
        let hrVersion = get('hoistReactVersion');
        if (hrVersion.includes('SNAPSHOT.')) {
            const snapDate = new Date(parseInt(hrVersion.split('SNAPSHOT.')[1]));
            hrVersion += ` (${fmtDateTime(snapDate)})`;
        }

        return panel({
            className: 'tb-under-the-hood',
            item: div({
                className: 'tb-under-the-hood__inner',
                items: [
                    h2(Icon.info(), 'Deployment'),
                    table(
                        tbody(
                            row('Version', `${get('appVersion')} (build ${get('appBuild')})`),
                            row('Environment', get('appEnvironment')),
                            startupTime
                                ? row(
                                      'Server Uptime',
                                      relativeTimestamp({timestamp: startupTime, pastSuffix: ''})
                                  )
                                : null
                        )
                    ),
                    h2(Icon.server(), 'Server Stack'),
                    table(
                        tbody(
                            row('Hoist Core', get('hoistCoreVersion')),
                            row('Grails', get('grailsVersion')),
                            row('Java', get('javaVersion'))
                        )
                    ),
                    h2(Icon.window(), 'Client Stack'),
                    table(
                        tbody(
                            row('Hoist React', hrVersion),
                            row('React', get('reactVersion')),
                            row('AG Grid', get('agGridVersion')),
                            row('Blueprint Core', get('blueprintCoreVersion')),
                            row('MobX', get('mobxVersion'))
                        )
                    )
                ]
            })
        });
    }
});
```

- [ ] **Step 12.2:** Create `UnderTheHoodWidget.scss` by copying `AboutToolboxWidget.scss` and renaming the root class `tb-about-widget` → `tb-under-the-hood` (and `__inner` accordingly). Read the old file first and preserve its table/h2 styling.

- [ ] **Step 12.3:** Update `HomeTabModel.ts`: swap the `underTheHood` viewSpec content to `underTheHoodWidget`, then `git rm` the two `AboutToolboxWidget.*` files. Search for other refs: `grep -rn "AboutToolboxWidget\|aboutToolboxWidget" client-app/src` → expect none.

- [ ] **Step 12.4:** `npx tsc --noEmit` + browser check (tables render in both themes).

- [ ] **Step 12.5:** Commit: `git add -A client-app/src/desktop/tabs/home && git commit -m "Replace About Toolbox widget with slimmed Under the Hood version tables"`

---

### Task 13: Meet XH (Team Spotlight) + Feedback widgets

**Files:** Create `widgets/meetxh/MeetXhWidgetModel.ts`, `MeetXhWidget.ts`, `.scss`; `widgets/feedback/FeedbackWidgetModel.ts`, `FeedbackWidget.ts`, `.scss`

- [ ] **Step 13.1:** Create `MeetXhWidgetModel.ts`:

```typescript
import {HoistModel, LoadSpec, managed, XH} from '@xh/hoist/core';
import {action, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {Timer} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {sample} from 'lodash';

export interface XhContact {
    id: string;
    name: string;
    location: string;
    email: string;
    bio: string;
    profilePicture: string;
    tags: string[];
}

export class MeetXhWidgetModel extends HoistModel {
    @observable.ref contacts: XhContact[] = [];
    @observable spotlightId: string = null;

    @managed
    private rotateTimer: Timer;

    get spotlightContact(): XhContact {
        return this.contacts.find(it => it.id === this.spotlightId);
    }

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.rotateTimer = Timer.create({
            runFn: () => this.shuffle(),
            interval: 25 * SECONDS,
            delay: true
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        try {
            const contacts = await XH.fetchJson({url: 'contacts', loadSpec});
            runInAction(() => {
                this.contacts = contacts;
                this.spotlightId = sample(contacts)?.id;
            });
        } catch (e) {
            // Degrade gracefully - widget falls back to static contact CTAs.
            this.logError('Failed to load XH contacts', e);
        }
    }

    @action
    shuffle() {
        const {contacts, spotlightId} = this;
        if (contacts.length < 2) return;
        this.spotlightId = sample(contacts.filter(it => it.id !== spotlightId)).id;
    }

    @action
    spotlight(id: string) {
        this.spotlightId = id;
        // Reset the rotation clock so a manual pick isn't immediately rotated away.
        this.rotateTimer?.cancel();
        this.rotateTimer = Timer.create({
            runFn: () => this.shuffle(),
            interval: 25 * SECONDS,
            delay: true
        });
    }

    profilePicUrl(contact: XhContact): string {
        return `/public/contact-images/${contact.profilePicture ?? 'no-profile.png'}`;
    }
}
```

(Verify `Timer.cancel()` exists via `hoist-get-members Timer`; if Timer lacks cancel/recreate ergonomics, simplify: keep one Timer and accept that a manual pick may rotate within 25s. Verify the `/public/contact-images/` URL resolves in dev — the Contact example uses a relative `../../public/...` path; adjust to whatever actually serves, checking the Network tab.)

- [ ] **Step 13.2:** Create `MeetXhWidget.ts`:

```typescript
import {a, div, filler, hbox, img, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import './MeetXhWidget.scss';
import {MeetXhWidgetModel} from './MeetXhWidgetModel';

export const meetXhWidget = hoistCmp.factory({
    displayName: 'MeetXhWidget',
    model: creates(MeetXhWidgetModel),
    render({model}) {
        const {contacts, spotlightContact} = model;

        return panel({
            className: 'tb-meet-xh',
            items: [
                spotlightContact
                    ? spotlight()
                    : div({
                          className: 'tb-meet-xh__fallback',
                          item: 'Extremely Heavy is a boutique consultancy of experienced enterprise developers — and we are always happy to talk.'
                      }),
                contacts.length > 1 ? avatarRow() : null
            ],
            bbar: toolbar({
                compact: true,
                items: [
                    button({
                        text: 'Meet the team',
                        icon: Icon.users(),
                        onClick: () => XH.openWindow('/contact', 'contact')
                    }),
                    filler(),
                    button({
                        text: 'info@xh.io',
                        icon: Icon.mail(),
                        onClick: () => XH.openWindow('mailto:info@xh.io', '_self')
                    }),
                    button({
                        text: 'xh.io',
                        icon: Icon.globe(),
                        onClick: () => XH.openWindow('https://xh.io', 'xh')
                    })
                ]
            })
        });
    }
});

const spotlight = hoistCmp.factory<MeetXhWidgetModel>(({model}) => {
    const c = model.spotlightContact;
    return hbox({
        className: 'tb-meet-xh__spotlight',
        key: c.id, // re-key per contact to retrigger the fade-in animation
        items: [
            img({className: 'tb-meet-xh__photo', src: model.profilePicUrl(c), alt: c.name}),
            vbox({
                className: 'tb-meet-xh__details',
                items: [
                    div({className: 'tb-meet-xh__name', item: c.name}),
                    div({className: 'tb-meet-xh__location', item: c.location}),
                    hbox({
                        className: 'tb-meet-xh__tags',
                        items: (c.tags ?? []).map(t =>
                            span({className: 'tb-meet-xh__tag', item: t, key: t})
                        )
                    }),
                    div({
                        className: 'tb-meet-xh__bio',
                        item: c.bio?.split('\n')[0]
                    })
                ]
            }),
            button({
                className: 'tb-meet-xh__shuffle',
                icon: Icon.sync(),
                tooltip: 'Meet someone else',
                onClick: () => model.shuffle()
            })
        ]
    });
});

const avatarRow = hoistCmp.factory<MeetXhWidgetModel>(({model}) => {
    return hbox({
        className: 'tb-meet-xh__avatars',
        items: model.contacts
            .filter(it => it.id !== model.spotlightId)
            .map(c =>
                img({
                    className: 'tb-meet-xh__avatar',
                    key: c.id,
                    src: model.profilePicUrl(c),
                    alt: c.name,
                    title: c.name,
                    onClick: () => model.spotlight(c.id)
                })
            )
    });
});
```

- [ ] **Step 13.3:** Create `MeetXhWidget.scss`:

```scss
.tb-meet-xh {
  &__spotlight {
    flex: 1;
    padding: var(--xh-pad-double-px);
    gap: var(--xh-pad-double-px);
    overflow: hidden;
    animation: tb-meet-xh-fade 0.5s ease;
  }

  &__photo {
    flex: none;
    width: 110px;
    height: 110px;
    object-fit: cover;
    border-radius: 8px;
  }

  &__details {
    flex: 1;
    min-width: 0;
    gap: var(--xh-pad-half-px);
    overflow: hidden;
  }

  &__name {
    font-weight: 600;
    font-size: var(--xh-font-size-large-px);
  }

  &__location {
    color: var(--xh-text-color-muted);
    font-size: var(--xh-font-size-small-px);
  }

  &__tags {
    gap: var(--xh-pad-half-px);
    flex-wrap: wrap;
  }

  &__tag {
    background-color: var(--xh-bg-alt);
    border-radius: 10px;
    padding: 0 var(--xh-pad-px);
    font-size: var(--xh-font-size-small-px);
  }

  &__bio {
    font-size: var(--xh-font-size-small-px);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
  }

  &__shuffle {
    align-self: flex-start;
  }

  &__fallback {
    flex: 1;
    padding: var(--xh-pad-double-px);
  }

  &__avatars {
    flex: none;
    padding: var(--xh-pad-px) var(--xh-pad-double-px);
    gap: var(--xh-pad-half-px);
    flex-wrap: wrap;
    border-top: var(--xh-border-solid);
  }

  &__avatar {
    width: 28px;
    height: 28px;
    object-fit: cover;
    border-radius: 50%;
    cursor: pointer;
    opacity: 0.75;
    transition: opacity 0.15s ease;

    &:hover {
      opacity: 1;
    }
  }
}

@keyframes tb-meet-xh-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

- [ ] **Step 13.4:** Create `FeedbackWidgetModel.ts`:

```typescript
import {HoistModel, persist, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, runInAction} from '@xh/hoist/mobx';

export type HoistRating = 'negative' | 'neutral' | 'positive';

export class FeedbackWidgetModel extends HoistModel {
    override persistWith = {prefKey: 'homeFeedback'};

    @bindable @persist rating: HoistRating = null;
    @bindable @persist commentSent: boolean = false;
    @bindable comment: string = '';

    constructor() {
        super();
        makeObservable(this);
    }

    @action
    setRating(rating: HoistRating) {
        this.rating = rating;
        XH.track({
            category: 'Feedback',
            message: `Hoist sentiment: ${rating}`,
            logData: true
        });
    }

    async submitCommentAsync() {
        const {comment, rating} = this,
            userMessage = comment?.trim();
        if (!userMessage) {
            this.setBindable('commentSent', true);
            return;
        }

        XH.track({
            category: 'Feedback',
            message: 'User submitted feedback',
            data: {userMessage, rating},
            logData: true
        });
        await XH.trackService.pushPendingAsync();
        XH.successToast('Thank you — your feedback has been sent!');
        runInAction(() => {
            this.comment = '';
            this.commentSent = true;
        });
    }

    @action
    reset() {
        this.rating = null;
        this.commentSent = false;
        this.comment = '';
    }
}
```

- [ ] **Step 13.5:** Create `FeedbackWidget.ts`:

```typescript
import {div, filler, hbox, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {textArea} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import './FeedbackWidget.scss';
import {FeedbackWidgetModel} from './FeedbackWidgetModel';

export const feedbackWidget = hoistCmp.factory({
    displayName: 'FeedbackWidget',
    model: creates(FeedbackWidgetModel),
    render({model}) {
        const {rating, commentSent} = model;

        let body;
        if (!rating) {
            body = ratingPrompt();
        } else if (!commentSent) {
            body = commentPrompt();
        } else {
            body = thanks();
        }

        return panel({className: 'tb-feedback', item: body});
    }
});

const ratingPrompt = hoistCmp.factory<FeedbackWidgetModel>(({model}) => {
    return vbox({
        className: 'tb-feedback__inner',
        items: [
            div({className: 'tb-feedback__question', item: 'Enjoying Hoist?'}),
            div({
                className: 'tb-feedback__sub',
                item: 'One click — anonymous-ish, painless, and genuinely read by the team.'
            }),
            hbox({
                className: 'tb-feedback__ratings',
                items: [
                    button({
                        icon: Icon.thumbsDown({size: 'lg'}),
                        tooltip: 'Not really',
                        onClick: () => model.setRating('negative')
                    }),
                    button({
                        icon: Icon.icon({iconName: 'face-meh', size: 'lg'}),
                        tooltip: "It's OK",
                        onClick: () => model.setRating('neutral')
                    }),
                    button({
                        icon: Icon.thumbsUp({size: 'lg'}),
                        tooltip: 'Yes!',
                        onClick: () => model.setRating('positive')
                    })
                ]
            })
        ]
    });
});

const commentPrompt = hoistCmp.factory<FeedbackWidgetModel>(({model}) => {
    const negative = model.rating === 'negative';
    return vbox({
        className: 'tb-feedback__inner',
        items: [
            div({
                className: 'tb-feedback__question',
                item: negative ? 'Sorry to hear it — what could be better?' : 'Thanks! Anything to add?'
            }),
            textArea({
                bind: 'comment',
                placeholder: negative
                    ? 'What is missing, broken, or confusing?'
                    : 'Optional — a sentence or two is plenty.',
                flex: 1,
                width: '100%',
                autoFocus: negative
            }),
            hbox({
                className: 'tb-feedback__actions',
                items: [
                    filler(),
                    button({text: 'Skip', onClick: () => model.setBindable('commentSent', true)}),
                    button({
                        text: 'Send to XH',
                        icon: Icon.mail(),
                        intent: 'primary',
                        minimal: false,
                        onClick: () => model.submitCommentAsync()
                    })
                ]
            })
        ]
    });
});

const thanks = hoistCmp.factory<FeedbackWidgetModel>(({model}) => {
    return vbox({
        className: 'tb-feedback__inner tb-feedback__inner--thanks',
        items: [
            Icon.checkCircle({size: '2x', className: 'xh-intent-success'}),
            div({className: 'tb-feedback__question', item: 'Thanks for your feedback!'}),
            button({
                text: 'Update your rating',
                minimal: true,
                onClick: () => model.reset()
            })
        ]
    });
});
```

(Verify `face-meh` resolves via Hoist's FA registration — `Icon.icon({iconName: 'face-meh'})`. If not available in the registered icon set, fall back to `Icon.circle()` or register `faFaceMeh` from `@fortawesome/free-regular-svg-icons` via `library.add()` as `MarkdownPanel.ts` does with `faMarkdown`. Also verify `xh-intent-success` className renders green — otherwise use inline `style`/intent prop.)

- [ ] **Step 13.6:** Create `FeedbackWidget.scss`:

```scss
.tb-feedback {
  &__inner {
    flex: 1;
    padding: var(--xh-pad-double-px);
    gap: var(--xh-pad-px);
    align-items: center;
    justify-content: center;
    text-align: center;

    &--thanks {
      gap: var(--xh-pad-double-px);
    }
  }

  &__question {
    font-weight: 600;
    font-size: var(--xh-font-size-large-px);
  }

  &__sub {
    color: var(--xh-text-color-muted);
    font-size: var(--xh-font-size-small-px);
  }

  &__ratings {
    gap: var(--xh-pad-double-px);
    margin-top: var(--xh-pad-px);
  }

  &__actions {
    width: 100%;
    gap: var(--xh-pad-half-px);
  }
}
```

- [ ] **Step 13.7:** `npx tsc --noEmit` clean.

- [ ] **Step 13.8:** Browser check — Meet XH: spotlight renders with photo/bio/tags, rotates after ~25s with fade, shuffle + avatar-row clicks work, CTAs open correctly. Feedback: rating click → comment state → send → toast + thanks (check admin console Activity Tracking for both `Hoist sentiment:` and `User submitted feedback` entries); reload → thanks state persists (pref); "Update your rating" resets.

- [ ] **Step 13.9:** Commit: `git add -A client-app/src/desktop/tabs/home && git commit -m "Add Meet XH team spotlight and Enjoying Hoist feedback widgets"`

---

### Task 14: Final default layout + client roadmap removal

**Files:** Modify `HomeTabModel.ts`, `client-app/src/admin/AppModel.ts`; delete roadmap client dirs.

- [ ] **Step 14.1:** Set the final `initialState` in `HomeTabModel.ts` with all seven widgets:

```typescript
initialState: [
    {viewSpecId: 'welcome', layout: {x: 0, y: 0, w: 7, h: 6}},
    {viewSpecId: 'startHere', layout: {x: 7, y: 0, w: 5, h: 6}},
    {viewSpecId: 'releases', layout: {x: 0, y: 6, w: 4, h: 7}},
    {viewSpecId: 'activity', layout: {x: 4, y: 6, w: 8, h: 7}},
    {viewSpecId: 'meetXh', layout: {x: 0, y: 13, w: 5, h: 5}},
    {viewSpecId: 'underTheHood', layout: {x: 5, y: 13, w: 4, h: 5}},
    {viewSpecId: 'feedback', layout: {x: 9, y: 13, w: 3, h: 5}}
]
```

Complete viewSpec list (ids/titles/icons): `welcome`/Welcome/`Icon.home()` (hidePanelHeader), `startHere`/Start Here/`Icon.mapSigns()`, `releases`/Hoist Releases/`Icon.tag()`, `activity`/Hoist Commits/github fab, `meetXh`/Meet XH/`Icon.users()`, `underTheHood`/Under the Hood/`Icon.info()`, `feedback`/Enjoying Hoist?/`Icon.comment()` (hidePanelHeader).

- [ ] **Step 14.2:** Tune the layout in-browser (resize until balanced in a ~1500px window and a ~1200px window; adjust `h`/`w`/`rowHeight` values as needed; clear the `homeDashCanvas` localStorage key between tweaks). This is an explicitly iterative visual step — screenshot both themes when satisfied.

- [ ] **Step 14.3:** Delete roadmap client code:

```bash
git rm -r client-app/src/desktop/tabs/home/widgets/roadmap client-app/src/admin/roadmap
```

- [ ] **Step 14.4:** Edit `client-app/src/admin/AppModel.ts`: remove the `phaseRestPanel, projectRestPanel` import (line 6), the `roadmap` route object (lines ~37-44), and the `roadmap` tab object (lines ~71-82).

- [ ] **Step 14.5:** Search for stragglers: `grep -rin roadmap client-app/src` → expect no hits.

- [ ] **Step 14.6:** `npx tsc --noEmit` + `yarn lint` clean. Browser check: admin console (`/admin`) loads without the Roadmap tab; desktop home unaffected.

- [ ] **Step 14.7:** Commit: `git add -A client-app && git commit -m "Finalize home dashboard default layout and remove Roadmap widget and admin editor"`

---

### Task 15: Changelog, docs, and final verification

**Files:** Modify `CHANGELOG.md`

- [ ] **Step 15.1:** Add to the existing `## 9.0-SNAPSHOT - unreleased` section (single-line bullets, mandatory — the parser drops wrapped lines):

Under `### New Features`:

```
* Redesigned the desktop app home page as a modern `DashCanvas` dashboard — featuring a hero welcome, a Start Here launchpad for first-time visitors, an auto-updating feed of hoist-react and hoist-core GitHub releases, a refreshed commit-activity grid, a Team Spotlight introducing XH's engineers, live version info, and a lightweight "Enjoying Hoist?" feedback widget built on Hoist's activity tracking.
```

Under `### Technical`:

```
* Extended the server-side `GitHubService` to fetch published GitHub releases alongside commits via the GraphQL API, cached cluster-wide and pushed to clients over WebSockets (new `gitHubReleaseRepos` config).
* Removed the long-stale Hoist Roadmap widget, its admin console editor, and backing `Phase`/`Project` domain classes — the auto-updating Releases and Commits feeds now tell that story without manual curation.
```

- [ ] **Step 15.2:** Full verification sweep:
  - `./gradlew compileGroovy` → BUILD SUCCESSFUL
  - `cd client-app && npx tsc --noEmit && yarn lint` → clean
  - Restart backend; in browser: fresh-profile load of `/app/home` (default layout), drag/resize/remove/re-add widgets, reload persistence, restore-default flow, light + dark themes, releases + commits live data (or degraded placeholders), feedback round-trip visible in admin Activity Tracking, Meet XH rotation.
  - Confirm in-app changelog dialog renders the new entries un-truncated.

- [ ] **Step 15.3:** Commit: `git add CHANGELOG.md && git commit -m "Add changelog entries for home page redesign and roadmap removal"`

- [ ] **Step 15.4 (post-merge, deployed envs — note for Anselm, not code):** delete the `roadmapCategories` soft-config via admin console; optionally drop orphaned `phase`/`project` DB tables.

---

## Self-Review Notes

- **Spec coverage:** hero (T8), Start Here (T9), releases backend+client+widget (T2-4, 6, 10), activity refresh (T11), Meet XH spotlight w/ rotation (T13), Under the Hood (T12), feedback w/ pref persistence (T4, 13), DashCanvas + styling (T7), roadmap removal client+server (T5, 14), degraded states (T10 placeholder, T13 fallback, GitHubService catch-per-endpoint in T6), changelog (T15), deploy notes (T15.4). Mobile/admin-beyond-roadmap untouched per spec.
- **Known judgment points for the executor:** icon availability checks (T8-9, 13), `--xh-*` CSS var existence checks (T9-10), contact image URL path (T13), Timer cancel API (T13), Hazelcast list serialization fallback (T3), visual layout tuning (T14.2 — intentionally iterative).
- **Hero copy** is a draft to be refined with Anselm in-browser before release.
