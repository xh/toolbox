# Changelog

## UNRELEASED

### New Features

* Demo for grid `Sparklines` renderer in Portfolio example
* Added SlackAlertService to post StatusMonitor and ClientError alerts to the XH slack.
* Added two simple StatusMonitors, `metric1337Monitor` and `divideByZeroMonitor`, for testing purposes.

## v2.19.0 - 2022-07-30

### New Features

* Demos for new `ModalSupport` feature introduced in hoist-react v50.

### Libraries

* @xh/hoist 50.1.0
* @xh/hoist-dev-utils 6.0.0 - includes upgraded build toolchain with Webpack v5
* hoist-core 14.1.0

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

* Improved Examples tab displays available desktop examples using an inline iFrame, for easier browsing and preview of
  each demo app.
* Demo new `cancelAlign` option supported by `XH.message()` and variants.

### Libraries

* @xh/hoist 47.1.1

## v2.15.0 - 2022-02-08

### Bug Fixes

* Auth0 OAuth login flow no longer leaves a gap at bottom of the viewport when Toolbox is opened in iOS fullscreen mode.
* Fixes to contact example app.

### Libraries

* @xh/hoist 46.1.0
* hoist-core 13.1.0

## v2.14.0 - 2022-01-17

### Technical

* MySQL driver and datasource properties tweaked and updated to MySQL v8.

### Libraries

* @xh/hoist 45.0.2
* hoist-core 13.0.6
* mysql-connector-java 8.0.27

## v2.13.0 - 2022-01-11

### New Features

* New mobile buttons page shows off the many variations of newly upgraded mobile buttons.

### Libraries

* @xh/hoist 45.0.1
* hoist-core 13.0.5
* grails 5.1.1

## v2.12.0 - 2021-12-29

### Libraries

* @xh/hoist 44.3.0
* hoist-core 11.0.3

## v2.11.0 - 2021-12-08

### Libraries

* @xh/hoist 44.2.0
* hoist-core 11.0.2

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

* @xh/hoist 40.0.0
* @xh/hoist-dev-utils 5.7.0
* hoist-core 9.2.1

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

* @xh/hoist 38.0.0
* ag-grid 25.0.1
* hoist-core 9.1.1

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

### New Features

* Make the home tab a Dashboard container with new example widgets, including a live feed from the XH GitHub repos.
* Enable OAuth login for visitors via Auth0.
* Add example usage of enhanced `TabContainerModel` APIs.
* Add example usage of new built-in styling options for tree grids.

### Libraries

* @xh/hoist 36.6.0
