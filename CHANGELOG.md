# Changelog

## v6.0-SNAPSHOT - unreleased

### New Features
* Enabled new Correlation ID tracking support in Hoist.

### Bug Fixes
* Fixed `InputsPanel` "Set Focus" popover.

## 5.1.0 - 2024-06-21

### 📚 Libraries
* hoist-core 20.1.0

## v5.0.2 - 2024-06-20

### 📚 Libraries
* hoist-core 20.0.2
* @xh/hoist 64.0.5

## v5.0.1 - 2024-05-19

### 📚 Libraries
* @xh/hoist 64.0.1

## v5.0.0 - 2024-05-17

### New Features
* Support for new `mockDirectoryGroups` config - see `RoleService` for details.

### 📚 Libraries
* hoist-core 20.0 (multi-instance)
* @xh/hoist 64.0
* @ag-grid 31.2

## v4.0.0 - 2024-04-04

### New Features
* Simplifies bootstrapping process to always use `Auth0` with `bootstrapAdminUser` for initial login.
* Provide alternate option for setting `useOAuth:false` in instanceConfig to disable OAuth login and fallback to form-based approach (useful for local on-device testing).

### Libraries
* hoist-core 19.0.0
* @xh/hoist 63.0.0
* @xh/hoist-dev-utils 8.1.0

## v3.6.0 - 2024-01-19

### Libraries
* hoist-core 18.1.0
* @xh/hoist 60.1.0

## v3.5.0 - 2024-01-12

### New Features
* Migrate to built-in role management.

### Libraries
* hoist-core 18.0.0
* @xh/hoist 60.0.0

## v3.4.0 - 2023-11-09

### New Features
* Added `ZoneGrid` demos for desktop and mobile.
* Enhanced Layout > DockContainer page to showcase new `DockViewModel.onClose` hook
* Enhanced Column Groups Grid example to showcase `ColumnGroup.showLeftRightBorders` functionality.
* Updated Timestamp tab to expose all `RelativeTimestamp` options.

### Libraries
* hoist-core 18.0.0
* @xh/hoist 60.0.0

## v3.3.0 - 2023-09-20

### Libraries
* hoist-core 17.3.0
* @xh/hoist 59.1.0

## v3.2.1 - 2023-07-14

### Libraries
* hoist-core 16.4.1
* @xh/hoist 58.0.1

## v3.2.0 - 2023-07-07

### New Features
* Enhance Other > Number Formats page to showcase expanded `NumberFormatOptions.colorSpec` functionality

### Libraries
* hoist-core 16.4.0
* @xh/hoist 58.0.0

## v3.0.3 - 2023-06-20

### Libraries
* hoist-core 16.3.0
* @xh/hoist 57.0.0
* @xh/hoist-dev-utils 6.3.0 

## v3.0.2 - 2023-06-01

### Libraries
* @xh/hoist 56.6.0
* @xh/hoist-dev-utils 6.2.0

## v3.0.1 - 2023-05-26

### New Features
* Toolbox can now be run with an in memory H2 DB, and all needed configs and preferences will be pre-loaded into this DB. 
  * Useful for devs who want to quickly check out the project and run it on their local development machine without going through the trouble of creating a database.
  * See the section on "instance config file" in README.md for the settings that trigger use of H2.

### Libraries
* hoist-core 16.2.0
* @xh/hoist 56.5.0

## v3.0.0 - 2022-12-31

### New Features
* Toolbox has been completely rewritten in TypeScript.
* New application permission role: `HOIST_ADMIN_READER`.
* All Hoist Framework Admin tabs are now readable (read only) by users who have this new role: `HOIST_ADMIN_READER`.
* `CustomLogSupportConverter` added as an example of an alternative log output format.  
  Applied to Monitor log file.

### Libraries
* hoist-core 15.0.0
* @xh/hoist 54.0.0

## v2.20.1 - 2022-10-17

### Bug Fixes
* Improve Slack status monitor alert formatting.

### Libraries
* @xh/hoist 52.0.2

## v2.20.0 - 2022-10-10

### New Features
* Added Other > Inspector tab to demo the new Hoist Inspector tool.
* Added example of grid sparklines rendering within the Portfolio example app.
* `SlackAlertService` to post status monitor and client error report alerts to the XH Slack channel for monitoring.

### Libraries
* hoist-core 14.3.1
* @xh/hoist 52.0.0

## v2.19.0 - 2022-07-30

### New Features
* Demos for new `ModalSupport` feature introduced in hoist-react v50.

### Libraries
* hoist-core 14.1.0
* @xh/hoist 50.1.0
* @xh/hoist-dev-utils 6.0.0 - includes upgraded build toolchain with Webpack v5

## v2.18.0 - 2022-05-24

### Libraries
* @xh/hoist 49.0.0

## v2.17.1 - 2022-04-22

### Libraries
* @xh/hoist 48.0.1

## v2.17.0 - 2022-04-21

### New Features
* New examples for Exceptions, DashCanvas, and more.

### Libraries
* @xh/hoist 48.0.0

## v2.16.0 - 2022-03-26

### New Features
* Improved Examples tab displays available desktop examples using an inline iFrame, for easier browsing and preview of each demo app.
* Demo new `cancelAlign` option supported by `XH.message()` and variants.

### Libraries
* @xh/hoist 47.1.1

## v2.15.0 - 2022-02-08

### Bug Fixes
* Auth0 OAuth login flow no longer leaves a gap at bottom of the viewport when Toolbox is opened in iOS fullscreen mode.
* Fixes to contact example app.

### Libraries
* hoist-core 13.1.0
* @xh/hoist 46.1.0

## v2.14.0 - 2022-01-17

### Technical
* MySQL driver and datasource properties tweaked and updated to MySQL v8.

### Libraries
* hoist-core 13.0.6
* mysql-connector-java 8.0.27
* @xh/hoist 45.0.2

## v2.13.0 - 2022-01-11

### New Features
* New mobile buttons page shows off the many variations of newly upgraded mobile buttons.

### Libraries
* hoist-core 13.0.5
* @xh/hoist 45.0.1
* grails 5.1.1

## v2.12.0 - 2021-12-29

### Libraries
* hoist-core 11.0.3
* @xh/hoist 44.3.0

## v2.11.0 - 2021-12-08

### Libraries
* hoist-core 11.0.2
* @xh/hoist 44.2.0

## v2.10.0 - 2021-10-04

### New Features
* New Grid > Column Filters tab added to demo column-based `GridFilterModel` with linked `FilterChooser`.
* Theme controls for `TreeMap` examples.
* Add newly supported `TreeStyle` options to shared grid example.
* Demo new `GridFindField` component within the desktop tree grid example.
* Demo new long-press (`GridModel.onCellContextMenu`) event handler on mobile tree grid example as an alternate
  drilldown gesture for parent rows.
* Use newly standardized support for app-wide (grid) sizing mode.

### Libraries
* @xh/hoist 43.0.0
* @xh/hoist-dev-utils 5.11.0

## v2.9.0 - 2021-08-13

### New Features
* New Tests for Hoist Column Filtering

### Libraries
* @xh/hoist 42.0.0

## v2.8.0 - 2021-07-23

### New Features
* Added demos for Badge (new) and Placeholder components.

### Libraries
* @xh/hoist 41.1.0

## v2.7.0 - 2021-07-01

### New Features
* New full-featured example applications 'Contact' and 'TODO'.
* New top-level Mobile tab (within the desktop app) highlights Hoist's support for mobile devices.

### Libraries
* @xh/hoist 41.0.0
* @xh/hoist-dev-utils 5.9.0

## v2.6.0 - 2021-04-22

### New Features
* Demo new support for displaying an in-app Changelog, with this changelog!
* Add example usage of new `XH.showBanner()` util.
* Enable built-in navigation tracking for the Toolbox mobile app.

### Libraries
* hoist-core 9.2.1
* @xh/hoist 40.0.0
* @xh/hoist-dev-utils 5.7.0

## v2.5.0 - 2021-03-23

### New Features
* Add new AsyncLoopPanel to Admin-only testing tools.
* Add example usage of enhanced `TreeMap` configs.
* Add example usage of `StoreFilterField.autoApply`.

### Libraries
* @xh/hoist 39.0.0
* ag-Grid 25.1.0

## v2.4.0 - 2021-02-28

### New Features
* Improvements to Admin-only (for the moment) Grid Performance test panel.

### Bug Fixes
* Fix broken links on Examples tab.

### Technical
* Update to latest async grid selection methods.

### Libraries
* @xh/hoist 38.1.1
* @xh/hoist-dev-utils 5.6.0

## v2.3.0 - 2021-02-04

### New Features
* Add new popover examples and enhanced menu system to mobile app.
* Add `expandCollapseButton` to mobile tree-grid example.

### Technical
* Update to Mobx6, new Hoist superclasses.

### Libraries
* hoist-core 9.1.1
* @xh/hoist 38.0.0
* ag-grid 25.0.1

## v2.2.0 - 2021-01-22

### New Features
* Add example usage of new `ErrorMessage` component.

### Libraries
* @xh/hoist 37.2.0

## v2.1.0 - 2020-12-25

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

## v2.0.0 - 2020-10-28

### New Feaures
* Make the home tab a Dashboard container with new example widgets, including a live feed from the XH GitHub repos.
* Enable OAuth login for visitors via Auth0.
* Add example usage of enhanced `TabContainerModel` APIs.
* Add example usage of new built-in styling options for tree grids.

### Libraries
* @xh/hoist 36.6.0
