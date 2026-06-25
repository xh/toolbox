# Changelog

## 10.0-SNAPSHOT - unreleased

## 9.2.0 - 2026-06-25

### Technical

* Adopted hoist-react's new `JsonInput` `autoFormat` prop in the column-filter test panels, dropping manual `JSON.stringify` pre-indentation now that readonly inputs format their content for display automatically.
* Demoed hoist-react's windowed `Select` / `SelectEditor` menu auto-sizing: the Forms > Select "Large list (windowed)" example now uses varied-length labels, and the Grids > Inline Editing `category` editor uses a windowed dropdown in a narrow cell so the menu visibly grows to fit its widest option.
* Wired up the Other > Format Numbers demo to exercise `fmtQuantity`'s new `lossless` option (with `useMillions` / `useBillions` switches) and `fmtNumber`'s `null` full-precision handling, with sample values that show the lossless cutoff collapsing to m/b units only when no precision is lost.
* Removed Toolbox's bespoke vertical sub-tab switcher styling now that hoist-react provides the rounded-pill treatment by default, retaining only the app-specific fixed rail width.

### Libraries

* @xh/hoist `86.1.0 → 86.2.0`

## 9.1.1 - 2026-06-24

### Bug Fixes

* Fixed the mobile App Menu button to always render as the user's profile pic, so it no longer appears as a second hamburger alongside the nav-blade button when the (desktop-only) "profile pic menu" preference is off.

## 9.1.0 - 2026-06-24

### New Features

* Promoted the mobile documentation viewer to a top-level Docs section: a library-chooser landing (hoist-react and hoist-core as cards plus recently-viewed shortcuts), iOS-style push drill-down through categories and documents, and a search screen with recent searches and library-grouped, highlighted results - all routing into the existing single-doc reader.

### Technical

* Extended Toolbox's use of hoist-core's `TypedConfigMap` typed soft-config pattern, for more accurate typing and validation of map-style JSON soft configs with known keys.

### Libraries

* @xh/hoist `86.1.0`
* hoist-core `40.1.0`

## 9.0.0 - 2026-06-22

### New Features

* Carried the desktop redesign to the mobile (phone) client, fronted by a new left navigation blade - a drawer grouping the example catalog into expandable categories with theme and settings docked in its footer.
* Gave every mobile example a consistent screen pattern: the demo stays full-bleed while a pull-up sheet surfaces Info, Options, and Resources.
* Replaced the static mobile home page with a personalizable widget dashboard of collapsible cards (Welcome, Start Here, Hoist Releases, Recent Commits, Meet XH, Enjoying Hoist?) mirroring desktop, with a "Manage widgets" sheet to toggle and drag-reorder widgets.
* Expanded the mobile example library: new Inputs, Select, Badge, Mask, and Tabs screens, a filterable tap-to-copy Icons gallery, Forms recast as a validated candidate-intake form, and expanded runtime display options across examples.
* Added an in-app documentation reader to the mobile client - tapping a "Docs" resource link opens that doc inside Toolbox with rendered markdown, an "On this page" section jump, tap-to-copy code blocks, and in-content doc-to-doc links; its platform-neutral core code is shared by both clients.
* Added Slack as a second channel for home-page user feedback: feedback now posts a Block Kit message to a configurable Slack channel alongside the existing email notification, demonstrating an outbound Slack integration via the Slack Web API.
* Improved the formatting on pre-existing Slack alerts for client error and status monitor reporting.

### Technical

* The feedback widget now coalesces each interaction (sentiment click plus optional comment) into a single activity-tracking entry on the client, using a typing-reset inactivity timer plus a page-teardown flush that reacts to `XH.pageState` and relies on `TrackService`'s keepalive flush - eliminating duplicate feedback emails/Slack posts and capturing reliably on unload.
* Typed the `slackAlertConfig` soft config with hoist-core's `TypedConfigMap`, adding per-notification-type enable flags.
* Instrumented `SlackAlertService`'s send path with a Hoist `ObservedRun` counter (`toolbox.slack.messagesSent`, tagged by message type and an automatic success/failure outcome), demonstrating the framework's OTEL metrics builder alongside its tracing.

### Libraries

* @xh/hoist `86.0 → 87.0`

## 8.5.0 - 2026-06-12

### New Features

* Redesigned the desktop app home page as a modern `DashCanvas` dashboard - featuring an updated welcome, a Start Here launchpad for first-time visitors, an auto-updating feed of hoist-react and hoist-core GitHub releases, a refreshed commit-activity grid with live stats floated into its title, a Team Spotlight introducing XH's engineers via the Contact app's data, live version info, and a lightweight "Enjoying Hoist?" feedback widget built on Hoist's activity tracking.
* Redesigned the desktop component-demo `Wrapper`: a collapsible left info rail now unifies each tab's title, intro text, and reference links (replacing the full-width description band and the docked links panel), and redundant breadcrumb titles were removed from the demo panels.
* Consolidated each example's scattered display-option controls into the Wrapper rail's new Options section via shared `wrapperOption` / `wrapperAction` helpers, with on-hover disclosure of the underlying Hoist API (e.g. `GridConfig.stripeRows`) each option maps to.
* Polished nearly every desktop example tab - layout, copy, icons, controls, and assorted bug fixes - to more clearly showcase idiomatic Hoist usage for developers and prospective clients evaluating the framework.
* Replaced the dated mobile-tab screenshots with a theme-aware CSS device frame, and refreshed the DashCanvas / DashContainer examples with a live random-walk Chart widget and a stateful `SegmentedControl` Options widget.
* Added an IBM Plex Sans font preference to the desktop app, selectable alongside the theme via new macOS-style card pickers in the Options dialog.
* Overhauled the News example with cleaner card image handling, a master-detail reading pane, and a refreshed set of working NewsAPI sources.

### Technical

* Extended the server-side `GitHubService` to fetch published GitHub releases alongside commits via the GraphQL API, cached and replicated cluster-wide and pushed to clients over WebSockets (using the existing `gitHubRepos` config).
* Removed the long-stale Hoist Roadmap widget, its admin console editor, and backing `Phase`/`Project` domain classes - the auto-updating Releases and Commits feeds now tell that story without manual curation.
* Downgraded toolbox build toolchain back to JDK 21 - JDK 25 is not currently usable out of the box (Gradle 8.x caps its compatible JVM at version 24) and requires advanced setup not recommended for most production apps.
* Added a `majorJavaVersion` property to `gradle.properties` to centralize JVM version control, this is a good pattern to have in client apps.

### Libraries

* @xh/hoist `85.0 → 86.0`
* @xh/hoist-dev-utils `12.2 → 13.0` - breaking: `.md` imports now resolve to raw text content (was a URL to fetch).
* hoist-core `39.0 → 41.0`
* ag-Grid `34.2 → 35.3`

## 8.4.0 - 2026-04-30

### Libraries

* hoist-core 39.0.0
* @xh/hoist 85.0.0

## 8.3.3 - 2026-04-20

### Technical

* Upgraded build toolchain to JDK 25. Toolbox now uses JDK 25 for local development and CI.
* Fixed bug in buildRelease workflow - client appVersion was not being set to release version.

### Libraries

* Grails 7.1.0
* MySQL Connector/J 8.4.0

## 8.3.2 - 2026-04-20

### Libraries

* @xh/hoist 84.0.1

## 8.3.1 - 2026-04-16

### Bug Fixes

* Fix `ArrayIndexOutOfBoundsException` in portfolio push updates

### Libraries

* hoist-core 38.0.0
* @xh/hoist 84.0.0

## 8.3.0 - 2026-04-08

### New Features

* Added hoist-core documentation to the Docs tab alongside existing hoist-react docs. The viewer now shows both frameworks in a two-level tree (source > category > doc) with source badges in search results.
* Moved Docs content to a server-side API (`DocsService`) that dynamically resolves content from either a local sibling repo checkout or a GitHub tarball, replacing the previous webpack static asset approach.

### Technical

* Updated FileManager example to use hoist-react's new `downloadBlob` utility, removing the `downloadjs` dependency.
* Deferred portfolio data generation to run async after startup and optimized `HistoricalPriceGenerationService`, reducing total generation time from ~11s to ~3s. Added timing logs and expanded `PortfolioService` admin stats.
* Migrated CI/CD from TeamCity to GitHub Actions. New workflows handle CI validation, snapshot builds, release builds, and deployment to AWS ECS. Snapshot images are built and deployed automatically on pushes to `develop` and on upstream hoist-core/hoist-react snapshot publishes. Release builds are manually triggered with strict semver validation. See `docs/build-and-deploy.md` for details.
* Added some null values to city and profit_loss in TradeService data feed, to ensure grid fields display the "[blank]" value.

### Libraries

* hoist-core 37.0.2
* @xh/hoist 83.1.0

## 8.2.2 - 2026-03-02

### Libraries

* @xh/hoist 82.0.3

## 8.2.1 - 2026-02-28

### New Features

* Added a built-in Docs tab — an integrated viewer for all hoist-react documentation, rendered directly within the Toolbox app. Features a navigable tree sidebar, full-text search across all docs with ranked results, inter-document link navigation, and deep-linking via route parameters (e.g. `/app/docs/core`).
* Added Forms > Picker example sub-tab — demos the new `Picker` component with single/multi-select modes, custom renderers, badge counts, intent variants, and compact toolbar usage.
* Added Forms > Select example sub-tab — a dedicated 3-column showcase of the `Select` component covering single/multi-select, async queries, creatable entries, grouped options, custom renderers, windowed rendering, and appearance/behavior options.
* Updated `DashCanvas` example to demo the new `DashCanvasWidgetChooser` component.
* Added Other > Markdown example tab — demos the `markdown` component with a live editor, GFM support, and a toggleable custom CSS class showcasing opt-in styling for rendered markdown content.

### Technical

* Converted `.tsx` example/demo files to `.ts`, replacing JSX with hoist element factory functions. Aligns all examples with the project's established "no JSX" convention.

### Libraries

* hoist-core 36.3.1
* @xh/hoist 82.0.1

## 8.1.0 - 2026-02-12

### New Features

* Added Weather Dashboard example app — a full-stack weather dashboard backed by the OpenWeatherMap API, featuring a `DashCanvas` layout with multiple chart types and a grid summary view. Server-side caching via Hoist `Cache`, city persistence via `@persist`, and `ViewManager` support for saved layouts. This example was coded entirely by AI (Claude) without any human-written application code.
* Added Layout > Card example page showcasing the new `Card` component with titles, icons, intent-based styling, and collapsibility.
* Updated Forms example to demonstrate `formFieldSet` for visually grouping related form fields.
* Updated `LeftRightChooser` example to demo new `matchMode` filter options (`start`, `startWord`, `any`).

### Libraries

* @xh/hoist 81.0.2

## 8.0.0 - 2026-02-03

### New Features

* Added app option to use new `AppMenuButton.renderWithUserProfile` option. Toolbox includes a customized renderer to display your user profile image when enabled.

### Libraries

* hoist-core 36.1.0
* @xh/hoist 80.0.1

## 7.0.0 - 2025-11-21

### Libraries

* hoist-core 34.0.0
* @xh/hoist 78.0.0

### Technical

* Removed extraneous News example status monitors. Several monitors were all calling into the same lazily-populated cached value at the same time, causing a small storm of requests that could result in rate-limiting from the news API and regular monitor failures.

## 6.6.0 - 2025-10-22

### Libraries

* hoist-core 33.0.0
* @xh/hoist 76.2.0

## 6.5.1 - 2025-08-15

### Technical

* Updated desktop and admin `AppModel` to utilize updates to `TabModel` API for in-place `childTabs` definition, enabling full tab trees to be declared in one file and removing redundant nested tab boilerplate.

## 6.5.0 - 2025-08-08

### Libraries

* hoist-core 31.1.0
* @xh/hoist 75.0.0

## 6.4.0 - 2025-07-07

### New Features

* Added example usages of newly customizable chart context menus.

### Libraries

* hoist-core 31.0.3
* @xh/hoist 74.1.2

## 6.3.0 - 2025-05-21

### Libraries

* hoist-core 31.0.1
* @xh/hoist 73.0.1
* typescript 5.8

## 6.2.0 - 2025-04-08

### New Features

* Enabled support for testing OAuth flows against Azure / Entra ID, in addition to Auth0. To support switching, the prior `useOauth` instance config has been replaced with a new `oauthProvider` config - aka `APP_TOOLBOX_OAUTH_PROVIDER` in your `.env` file for local development.

### Libraries

* hoist-core 29.1.0
* @xh/hoist 72.3.0

## 6.1.0 - 2025-02-14

### Libraries

* hoist-core 28.1.0
* @xh/hoist 72.1.0

## 6.0.0 - 2025-01-08

### New Features

* Added the new Hoist `ViewManager` component to the Portfolio example, as well as an in-depth test page hosted within the Admin Console.
* Refactored and updated the Portfolio example for clarity and to better demonstrate potential usages of saved layouts via `ViewManager`.

### Libraries

* hoist-core 27.0.0
* @xh/hoist 71.0.0
* @xh/hoist-dev-utils 10.0.0

## 5.3.0 - 2024-10-17

### Libraries

* hoist-core 24.0.0
* @xh/hoist 69.0.0

## 5.2.0 - 2024-09-27

### New Features

* Enabled new Correlation ID tracking support in Hoist.

### Bug Fixes

* Fixed `InputsPanel` "Set Focus" popover.

### Libraries

* hoist-core 23.0.0
* @xh/hoist 68.1.0

## 5.1.0 - 2024-06-21

### Libraries

* hoist-core 20.1.0

## 5.0.2 - 2024-06-20

### Libraries

* hoist-core 20.0.2
* @xh/hoist 64.0.5

## 5.0.1 - 2024-05-19

### Libraries

* @xh/hoist 64.0.1

## 5.0.0 - 2024-05-17

### New Features

* Support for new `mockDirectoryGroups` config - see `RoleService` for details.

### Libraries

* hoist-core 20.0 (multi-instance)
* @xh/hoist 64.0
* @ag-grid 31.2

## 4.0.0 - 2024-04-04

### New Features

* Simplified bootstrapping process to always use `Auth0` with `bootstrapAdminUser` for initial login.
* Added alternate option for setting `useOAuth:false` in instanceConfig to disable OAuth login and fallback to form-based approach (useful for local on-device testing).

### Libraries

* hoist-core 19.0.0
* @xh/hoist 63.0.0
* @xh/hoist-dev-utils 8.1.0

## 3.6.0 - 2024-01-19

### Libraries

* hoist-core 18.1.0
* @xh/hoist 60.1.0

## 3.5.0 - 2024-01-12

### New Features

* Migrate to built-in role management.

### Libraries

* hoist-core 18.0.0
* @xh/hoist 60.0.0

## 3.4.0 - 2023-11-09

### New Features

* Added `ZoneGrid` demos for desktop and mobile.
* Enhanced Layout > DockContainer page to showcase new `DockViewModel.onClose` hook
* Enhanced Column Groups Grid example to showcase `ColumnGroup.showLeftRightBorders` functionality.
* Updated Timestamp tab to expose all `RelativeTimestamp` options.

### Libraries

* hoist-core 18.0.0
* @xh/hoist 60.0.0

## 3.3.0 - 2023-09-20

### Libraries

* hoist-core 17.3.0
* @xh/hoist 59.1.0

## 3.2.1 - 2023-07-14

### Libraries

* hoist-core 16.4.1
* @xh/hoist 58.0.1

## 3.2.0 - 2023-07-07

### New Features

* Enhance Other > Number Formats page to showcase expanded `NumberFormatOptions.colorSpec` functionality

### Libraries

* hoist-core 16.4.0
* @xh/hoist 58.0.0

## 3.0.3 - 2023-06-20

### Libraries

* hoist-core 16.3.0
* @xh/hoist 57.0.0
* @xh/hoist-dev-utils 6.3.0

## 3.0.2 - 2023-06-01

### Libraries

* @xh/hoist 56.6.0
* @xh/hoist-dev-utils 6.2.0

## 3.0.1 - 2023-05-26

### New Features

* Added support for running Toolbox with an in-memory H2 DB, with all needed configs and preferences pre-loaded — useful for quickly checking out the project without creating a database. See the "instance config file" section in README.md for setup.

### Libraries

* hoist-core 16.2.0
* @xh/hoist 56.5.0

## 3.0.0 - 2022-12-31

### New Features

* Toolbox has been completely rewritten in TypeScript.
* New application permission role: `HOIST_ADMIN_READER`.
* All Hoist Framework Admin tabs are now readable (read only) by users who have this new role: `HOIST_ADMIN_READER`.
* `CustomLogSupportConverter` added as an example of an alternative log output format. Applied to Monitor log file.

### Libraries

* hoist-core 15.0.0
* @xh/hoist 54.0.0

## 2.20.1 - 2022-10-17

### Bug Fixes

* Improve Slack status monitor alert formatting.

### Libraries

* @xh/hoist 52.0.2

## 2.20.0 - 2022-10-10

### New Features

* Added Other > Inspector tab to demo the new Hoist Inspector tool.
* Added example of grid sparklines rendering within the Portfolio example app.
* `SlackAlertService` to post status monitor and client error report alerts to the XH Slack channel for monitoring.

### Libraries

* hoist-core 14.3.1
* @xh/hoist 52.0.0

## 2.19.0 - 2022-07-30

### New Features

* Demos for new `ModalSupport` feature introduced in hoist-react v50.

### Libraries

* hoist-core 14.1.0
* @xh/hoist 50.1.0
* @xh/hoist-dev-utils 6.0.0 - includes upgraded build toolchain with Webpack v5

## 2.18.0 - 2022-05-24

### Libraries

* @xh/hoist 49.0.0

## 2.17.1 - 2022-04-22

### Libraries

* @xh/hoist 48.0.1

## 2.17.0 - 2022-04-21

### New Features

* New examples for Exceptions, DashCanvas, and more.

### Libraries

* @xh/hoist 48.0.0

## 2.16.0 - 2022-03-26

### New Features

* Improved Examples tab displays available desktop examples using an inline iFrame, for easier browsing and preview of each demo app.
* Demo new `cancelAlign` option supported by `XH.message()` and variants.

### Libraries

* @xh/hoist 47.1.1

## 2.15.0 - 2022-02-08

### Bug Fixes

* Auth0 OAuth login flow no longer leaves a gap at bottom of the viewport when Toolbox is opened in iOS fullscreen mode.
* Fixes to contact example app.

### Libraries

* hoist-core 13.1.0
* @xh/hoist 46.1.0

## 2.14.0 - 2022-01-17

### Technical

* MySQL driver and datasource properties tweaked and updated to MySQL v8.

### Libraries

* hoist-core 13.0.6
* mysql-connector-java 8.0.27
* @xh/hoist 45.0.2

## 2.13.0 - 2022-01-11

### New Features

* New mobile buttons page shows off the many variations of newly upgraded mobile buttons.

### Libraries

* hoist-core 13.0.5
* @xh/hoist 45.0.1
* grails 5.1.1

## 2.12.0 - 2021-12-29

### Libraries

* hoist-core 11.0.3
* @xh/hoist 44.3.0

## 2.11.0 - 2021-12-08

### Libraries

* hoist-core 11.0.2
* @xh/hoist 44.2.0

## 2.10.0 - 2021-10-04

### New Features

* New Grid > Column Filters tab added to demo column-based `GridFilterModel` with linked `FilterChooser`.
* Theme controls for `TreeMap` examples.
* Add newly supported `TreeStyle` options to shared grid example.
* Demo new `GridFindField` component within the desktop tree grid example.
* Demo new long-press (`GridModel.onCellContextMenu`) event handler on mobile tree grid example as an alternate drilldown gesture for parent rows.
* Use newly standardized support for app-wide (grid) sizing mode.

### Libraries

* @xh/hoist 43.0.0
* @xh/hoist-dev-utils 5.11.0

## 2.9.0 - 2021-08-13

### New Features

* New Tests for Hoist Column Filtering

### Libraries

* @xh/hoist 42.0.0

## 2.8.0 - 2021-07-23

### New Features

* Added demos for Badge (new) and Placeholder components.

### Libraries

* @xh/hoist 41.1.0

## 2.7.0 - 2021-07-01

### New Features

* New full-featured example applications 'Contact' and 'TODO'.
* New top-level Mobile tab (within the desktop app) highlights Hoist's support for mobile devices.

### Libraries

* @xh/hoist 41.0.0
* @xh/hoist-dev-utils 5.9.0

## 2.6.0 - 2021-04-22

### New Features

* Demo new support for displaying an in-app Changelog, with this changelog!
* Add example usage of new `XH.showBanner()` util.
* Enable built-in navigation tracking for the Toolbox mobile app.

### Libraries

* hoist-core 9.2.1
* @xh/hoist 40.0.0
* @xh/hoist-dev-utils 5.7.0

## 2.5.0 - 2021-03-23

### New Features

* Add new AsyncLoopPanel to Admin-only testing tools.
* Add example usage of enhanced `TreeMap` configs.
* Add example usage of `StoreFilterField.autoApply`.

### Libraries

* @xh/hoist 39.0.0
* ag-Grid 25.1.0

## 2.4.0 - 2021-02-28

### New Features

* Improvements to Admin-only (for the moment) Grid Performance test panel.

### Bug Fixes

* Fix broken links on Examples tab.

### Technical

* Update to latest async grid selection methods.

### Libraries

* @xh/hoist 38.1.1
* @xh/hoist-dev-utils 5.6.0

## 2.3.0 - 2021-02-04

### New Features

* Add new popover examples and enhanced menu system to mobile app.
* Add `expandCollapseButton` to mobile tree-grid example.

### Technical

* Update to Mobx6, new Hoist superclasses.

### Libraries

* hoist-core 9.1.1
* @xh/hoist 38.0.0
* ag-grid 25.0.1

## 2.2.0 - 2021-01-22

### New Features

* Add example usage of new `ErrorMessage` component.

### Libraries

* @xh/hoist 37.2.0

## 2.1.0 - 2020-12-25

### New Features

* Demo pattern for publishing a custom JS package w/Hoist integration - `@xh/package-template`.
* Add example usage of new `Placeholder` component.
* Add example usage of new `GroupingChooser` component.
* Add example usage of new focus APIs on `FormField`.

### Bug Fixes

* Fix broken customer tab switcher example.
* Fix to validation on `Form` example.

### Technical

* Add CSP headers to nginx config as a security best-practice.

### Libraries

* @xh/hoist 37.0.0
* @xh/hoist-dev-utils 5.5.0
* ag-grid 24.1.0
* react 17.0.1

## 2.0.0 - 2020-10-28

### New Features

* Made the home tab a Dashboard container with new example widgets, including a live feed from the XH GitHub repos.
* Enable OAuth login for visitors via Auth0.
* Add example usage of enhanced `TabContainerModel` APIs.
* Add example usage of new built-in styling options for tree grids.

### Libraries

* @xh/hoist 36.6.0
