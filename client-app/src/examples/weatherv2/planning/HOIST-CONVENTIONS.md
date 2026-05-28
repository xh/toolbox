# Hoist Conventions Checklist — Weather Dashboard V2

This checklist codifies the "house style" expectations for V2 implementation. Every file written must pass these checks.

## File & Directory Organization

- [ ] V2 lives at `client-app/src/examples/weatherv2/` — completely separate from V1.
- [ ] Entry point at `client-app/src/apps/weatherv2.ts` using `XH.renderApp()`.
- [ ] Registered in `ExamplesTabModel.ts` alongside (not replacing) V1.
- [ ] One model class per file. Component may share the file if small, otherwise separate.
- [ ] Widget files live in `weatherv2/widgets/` — one file per widget (model + component together for simple widgets, split for complex ones).
- [ ] Shared types in `weatherv2/Types.ts`. Wiring/schema infrastructure in `weatherv2/dash/`.

## Model Conventions

- [ ] Models extend `HoistModel`. Call `makeObservable(this)` in every constructor that adds `@observable`, `@bindable`, or `@computed`.
- [ ] Use `@bindable` for properties that have corresponding UI inputs (auto-generates setter).
- [ ] Use `@observable.ref` for object/array references that are replaced wholesale.
- [ ] Use `@managed` on child models the class creates and owns.
- [ ] Use `@persist` + `persistWith` for properties that should survive page reload.
- [ ] Use `@lookup(() => DashViewModel)` in widget models to find parent view model in `onLinked()`.
- [ ] Defer `persistWith` and `markPersist()` calls to `onLinked()` (after context available).
- [ ] Implement `doLoadAsync(loadSpec)` for data loading — never call it directly, use `loadAsync()` / `refreshAsync()`.
- [ ] Check `loadSpec.isStale` after every await to avoid stale data writes.
- [ ] Use `addReaction()` for derived behavior (not manual subscriptions).

## Component Conventions

- [ ] Components use `hoistCmp.factory()` — no JSX.
- [ ] Declare model relationship: `creates(ModelClass)` (owns) or `uses(ModelClass)` (receives).
- [ ] Use Hoist element factories: `panel()`, `box()`, `vbox()`, `hbox()`, `grid()`, `button()`, etc.
- [ ] No JSX syntax anywhere. All UI via element factory functions.
- [ ] Keep render functions focused on structure — logic belongs in models.

## Class Member Ordering

1. `declare config` / static properties
2. Readonly / immutable properties
3. `@managed` children
4. `@observable` / `@bindable` state
5. `@computed` getters
6. Constructor
7. Lifecycle hooks (`onLinked`, `doLoadAsync`)
8. Public `@action` methods
9. Private implementation

## Import Ordering

1. External libraries (`lodash`, `react`)
2. `@xh/hoist` packages (grouped by subpackage)
3. Relative imports (local project files)

## Code Style

- [ ] Prettier: 100-char width, single quotes, no trailing commas, 4-space indent.
- [ ] No bracket spacing: `{foo}` not `{ foo }`.
- [ ] Arrow parens: avoid when possible (`x => x`).
- [ ] Semicolons: always.
- [ ] Destructure from model at top of methods: `const {selectedCity, forecast} = this;`

## Dashboard / DashCanvas Conventions

- [ ] `DashCanvasModel` configured with `viewSpecs` array and `persistWith: {viewManagerModel}`.
- [ ] Each `viewSpec` has: `id`, `title`, `icon`, `content` (factory function), `width`, `height`.
- [ ] Widget content factories use `creates(WidgetModel)` to own their model.
- [ ] Widget models use `@lookup(() => DashViewModel)` and `persistWith: {dashViewModel}` in `onLinked()`.
- [ ] Widget-specific persistable state uses `markPersist('propertyName')`.

## Persistence Conventions

- [ ] Use `DashViewProvider` for widget-internal state (via `dashViewModel`).
- [ ] Use `ViewManagerModel` for named dashboard layouts.
- [ ] Never mix persistence providers — one `persistWith` per model.
- [ ] Debounce writes (framework default 250ms is fine).

## Data Fetching

- [ ] Use `XH.fetchJson()` / `XH.postJson()` for server calls.
- [ ] Pass `loadSpec` to fetch calls for stale-load protection.
- [ ] Wrap observable mutations in `runInAction()` when outside `@action` methods.
- [ ] Handle errors with `XH.handleException(e)` in load methods.

## Naming

- [ ] Models: `PascalCase` ending in `Model` (e.g., `CityChooserModel`).
- [ ] Components: `camelCase` factory function (e.g., `cityChooserWidget`).
- [ ] Files: `PascalCase` matching primary export (e.g., `CityChooserWidget.ts`).
- [ ] CSS classes: `kebab-case` with BEM-like nesting (e.g., `weather-v2-current-conditions__detail`).
- [ ] Prefix all V2 CSS classes with `weather-v2-` to avoid collisions.
