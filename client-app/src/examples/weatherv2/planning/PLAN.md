# Weather Dashboard V2 — Master Implementation Plan

## Architecture Overview

V2 is a new Hoist example app at `client-app/src/examples/weatherv2/` that demonstrates:
1. **Dashboard-as-DSL:** Hoist's native persisted state as a machine-readable dashboard spec.
2. **Inter-widget wiring:** Typed, declarative bindings between widget instances.
3. **LLM-driven generation:** Natural language → validated JSON spec → live dashboard.

The app is built alongside V1 (no modifications to V1). Server-side weather endpoints are shared.

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Spec format | Hoist native `DashCanvasModel` persisted state | Not a new format — extends existing Hoist persistence |
| Wiring storage | `bindings` key in each widget's `viewState` | Flows through existing persistence pipeline unchanged |
| Widget metadata | Static `meta` property on widget model classes | Simple, explicit, co-located, auto-generation-ready |
| Data access | Shared `WeatherDataModel` with per-city caching | Avoids duplicate API calls across widgets |
| LLM integration | Thin Grails proxy + client-side prompt logic | CORS requires server proxy; prompt iteration stays client-side |
| LLM edit protocol | Full-spec replacement (not JSON Patch) | More reliable for LLM output; validates as a unit |

---

## Phase 1: V2 Scaffolding

**Goal:** New app shell that loads, renders, and persists — the foundation everything else builds on.

### 1.1 Create directory structure

```
client-app/src/examples/weatherv2/
├── AppModel.ts              — Root app model (creates ViewManagerModel + V2DashModel)
├── AppComponent.ts          — App shell with appBar + dashCanvas
├── Types.ts                 — Weather data types (copy from V1, extend)
├── Icons.ts                 — Icon definitions (copy from V1)
├── WeatherV2.scss           — V2-specific styles
├── dash/
│   ├── WeatherV2DashModel.ts   — Central model: owns DashCanvasModel + WiringModel
│   ├── WiringModel.ts          — Runtime wiring coordinator
│   ├── WeatherWidgetModel.ts   — Base class for all V2 widget models
│   ├── WidgetRegistry.ts       — Widget type registry + schema access
│   └── validation.ts           — Spec validation pipeline
└── widgets/
    └── (widget files — Phase 3+)
```

### 1.2 Entry point and registration

- Create `client-app/src/apps/weatherv2.ts` — calls `XH.renderApp()` with V2's `AppModel` and `AppComponent`.
- Register in `ExamplesTabModel.ts` as a new entry alongside V1.

### 1.3 App shell

- `AppModel.ts`: Creates `ViewManagerModel` (type: `'weatherDashboardV2'`) and `WeatherV2DashModel`.
- `AppComponent.ts`: `panel` with `appBar` (city selector dropdown for backward compat during development) + `dashCanvas`.
- `WeatherV2DashModel.ts`: Owns `@managed dashCanvasModel: DashCanvasModel` with empty `viewSpecs` initially, `persistWith: {viewManagerModel}`.

### 1.4 Smoke test

- App loads at `http://localhost:3000/weatherv2`.
- Empty dashboard canvas renders.
- View manager controls appear in app bar.
- No errors in console.

**Dependencies:** None.
**Estimated scope:** Small — mostly scaffolding and copy-from-V1.

---

## Phase 2: Wiring Infrastructure

**Goal:** The `WiringModel`, `WeatherWidgetModel` base class, and `WidgetRegistry` are functional. Widget models can publish outputs and resolve inputs. No widgets yet — just the plumbing.

### 2.1 WiringModel

Implement `WiringModel` as described in WIRING-DESIGN.md:
- Observable outputs map: `widgetId → {outputName → value}`.
- `publishOutput(widgetId, outputName, value)` — `@action` that updates the map.
- `resolveBinding(binding: BindingSpec)` — reads from the outputs map.
- `removeWidget(widgetId)` — cleans up on widget removal.

### 2.2 WeatherWidgetModel base class

Abstract base class for all V2 widget models:
- `@lookup(() => DashViewModel) viewModel` — links to parent DashCanvasViewModel.
- `resolveInput<T>(inputName)` — reads binding from `viewModel.viewState.bindings`, resolves via `WiringModel`.
- `publishOutput(name, value)` — delegates to `WiringModel`.
- Standard `onLinked()` sets up `persistWith: {dashViewModel: this.viewModel}`.
- Access to `WiringModel` via `AppModel.instance.weatherV2DashModel.wiringModel`.

### 2.3 WidgetRegistry

- Singleton `WidgetRegistry` with `register(meta)`, `get(id)`, `getAll()`.
- `generateLLMPrompt()` — produces structured text description of all widgets.
- `generateDashboardSchema()` — produces JSON Schema (or returns the static one).

### 2.4 TypeScript types

Define in `dash/types.ts`:
- `WidgetMeta`, `InputDef`, `OutputDef`, `ConfigPropertyDef`
- `BindingSpec` union type
- `DashSpec` (the full dashboard spec shape)
- `ValidationResult`, `ValidationMessage`

### 2.5 Unit validation

Basic validation pipeline (full pipeline in Phase 5):
- Structural: check `viewSpecId` against registry.
- Referential: check `fromWidget` references resolve.
- Cycle detection: topological sort of binding graph.

**Dependencies:** Phase 1.
**Estimated scope:** Medium — core infrastructure, no UI.

---

## Phase 3: Initial Widget Set

**Goal:** 5 core widgets — enough to demo the wiring story. One input widget (City Chooser) and four display widgets.

### 3.1 WeatherDataModel

Shared data provider that caches weather API responses per city:
- `ensureDataLoaded(city: string): Promise<WeatherData>` — fetches if not cached.
- `getWeatherData(city: string): WeatherData | null` — synchronous read from cache.
- Observable cache so widgets react when data arrives.
- Owned by `WeatherV2DashModel`, accessed via `AppModel.instance`.

Normalized data types:
```typescript
interface WeatherData {
    city: string;
    current: NormalizedCurrent;
    forecast: NormalizedForecastEntry[];
    fetchedAt: number;
}
```

### 3.2 City Chooser widget

- `CityChooserModel extends WeatherWidgetModel` with `@bindable @persist selectedCity`.
- Publishes `selectedCity` output on change.
- Component: Hoist `select` input with `enableFilter`.
- Static `meta` declares output, config (selectedCity, cities, enableSearch).

### 3.3 Current Conditions widget

- `CurrentConditionsModel extends WeatherWidgetModel`.
- Resolves `city` input, loads weather data from `WeatherDataModel`.
- Renders temperature gauge (Highcharts solid gauge) + conditions details.
- Config: `showFeelsLike`, `showHumidity`, `showWind`, `displayMode`.
- Adapted from V1's `CurrentConditionsWidget` but using wired inputs instead of parent model.

### 3.4 Forecast Chart widget

- `ForecastChartModel extends WeatherWidgetModel`.
- Resolves `city` and `units` inputs, loads forecast data.
- Configurable series (`temp`, `feelsLike`, `humidity`, `pressure`) and chart type (`line`, `area`, `column`).
- Adapted from V1's `TempForecastWidget` with expanded series support.

### 3.5 Precipitation Chart widget

- `PrecipChartModel extends WeatherWidgetModel`.
- Resolves `city` input.
- Dual-axis chart: probability (%) and volume (mm).
- Config: `metric` (probability/volume/both), `showThresholds`.
- Adapted from V1's `PrecipForecastWidget`.

### 3.6 5-Day Summary Grid widget

- `SummaryGridModel extends WeatherWidgetModel`.
- Resolves `city` and `units` inputs.
- Grid with daily high/low, conditions, humidity, wind.
- Config: `visibleColumns`.
- Adapted from V1's `ConditionsSummaryWidget`.

### 3.7 Wire up DashCanvasModel viewSpecs

Register all 5 widgets as viewSpecs on `DashCanvasModel`. Set up `initialState` with a default layout: city chooser top-left, display widgets filling the rest.

### 3.8 End-to-end test

- App loads with default dashboard.
- City Chooser appears. Selecting a new city updates all display widgets.
- Dashboard layout is drag-resizable.
- Layout persists across page reload.
- View Manager save/load works.

**Dependencies:** Phase 2.
**Estimated scope:** Large — 5 widget implementations + data model.

---

## Phase 4: Remaining Widgets + Polish

**Goal:** Complete the widget set (units toggle, wind chart, markdown, inspector) and refine the initial widgets.

### 4.1 Units Toggle widget

- `UnitsToggleModel extends WeatherWidgetModel`.
- `@bindable @persist units: 'imperial' | 'metric'`.
- Publishes `units` output.
- Component: Hoist `buttonGroupInput` or `switchInput`.

### 4.2 Wind Chart widget

- `WindChartModel extends WeatherWidgetModel`.
- Resolves `city` and `units` inputs.
- Chart: wind speed + optional gusts.
- Config: `showGusts`, `chartType`.

### 4.3 Markdown Content widget

- `MarkdownContentModel extends WeatherWidgetModel`.
- `@bindable @persist content: string`.
- Renders via Hoist's markdown rendering (or a simple `div` with `dangerouslySetInnerHTML` from a markdown library).
- No data inputs — pure config-driven.

### 4.4 Dashboard Inspector widget

- `DashInspectorModel extends WeatherWidgetModel`.
- Reads from `WiringModel` outputs and `DashCanvasModel` viewModels.
- Renders a tree/list of all widgets with their bindings and current values.
- Updates reactively.

### 4.5 Update viewSpecs and default layout

Add all new widgets to `DashCanvasModel.viewSpecs`. Update `initialState` with a comprehensive default dashboard.

### 4.6 Widget refinements

- Ensure all widgets handle missing data gracefully (loading mask, placeholder).
- Ensure `units` input works in all applicable widgets (temperature conversion, wind speed).
- Consistent styling across all widgets.

**Dependencies:** Phase 3.
**Estimated scope:** Medium — 4 additional widgets, incremental.

---

## Phase 5: Spec Validation + JSON Harness

**Goal:** Full validation pipeline and the JSON editor UI. A human can manually edit dashboard specs.

### 5.1 Full validation pipeline

Implement the three-stage validation from DSL-SPEC.md:
1. **Structural:** JSON Schema validation using `ajv` library.
2. **Semantic:** Config property type checking, enum validation, required fields.
3. **Referential:** Binding reference validation, type compatibility, cycle detection.

Output: `ValidationResult` with errors and warnings, each with JSON path and message.

### 5.2 JSON Schema generation

The `WidgetRegistry` produces a complete JSON Schema for the dashboard spec, including per-widget-type `state` schemas derived from `WidgetMeta.config`.

### 5.3 JSON Harness UI

New component within the V2 app — a split-pane view:
- **Left panel:** JSON editor with syntax highlighting. Use a code editor component (CodeMirror or Monaco via a lightweight wrapper — evaluate what's simplest to integrate).
- **Right panel:** Live dashboard canvas.
- **Controls:** Apply button, validation status indicator, "Load Example" dropdown, "Copy Spec" button.

If a standalone code editor is too complex to integrate, a `textarea` with monospace font and basic formatting is acceptable for V1. The key is the validate → apply → hydrate flow.

### 5.4 Example specs

3-5 curated example specs accessible from the "Load Example" dropdown:
1. "Basic Weather" — single city, conditions + forecast.
2. "Full Dashboard" — all widget types, single city.
3. "City Comparison" — two cities side by side.
4. "Minimal" — just a city chooser and one chart.
5. "Annotated" — markdown header + display widgets + inspector.

Store as JSON files or inline constants.

### 5.5 Spec application flow

```
User clicks "Apply" (or auto-apply on valid change)
    → Parse JSON
    → Run migration (version check)
    → Run validation pipeline
    → If errors: show errors in UI, keep current dashboard
    → If valid: call DashCanvasModel.setPersistableState({state: spec.state})
    → Dashboard hydrates with new widgets
```

### 5.6 Spec export

"Copy Spec" button reads `DashCanvasModel.getPersistableState()` and copies formatted JSON to clipboard.

**Dependencies:** Phase 4 (full widget set for meaningful examples).
**Estimated scope:** Medium-Large — validation engine + editor UI.

---

## Phase 6: LLM Integration

**Goal:** End-to-end LLM pipeline — user types a request, dashboard updates.

### 6.1 Server-side proxy

- `LlmController.groovy` — single `generate` endpoint, `@AccessAll`.
- `LlmService.groovy` — calls Anthropic Messages API via `JSONClient`.
- Hoist Config entries: `llmApiKey` (pwd), `llmProvider`, `llmModel`, `llmMaxTokens`.
- Error handling: API key not configured → helpful error message.
- Basic rate limiting: per-user counter, 20 req/hour.

### 6.2 Client-side LLM service

`LlmChatService` utility:
- `generateAsync(systemPrompt, messages, config)` → calls `/llm/generate` endpoint.
- `buildSystemPrompt(currentSpec?)` → assembles prompt from widget schemas + current spec.
- `parseSpecFromResponse(response)` → extracts JSON spec from LLM text response.

### 6.3 System prompt

Assemble from:
- Dashboard spec format description.
- Grid system rules (12 columns, layout constraints).
- Full widget catalog (generated from `WidgetRegistry.generateLLMPrompt()`).
- Wiring rules (binding format, ID assignment).
- Current dashboard spec (if editing).
- Instructions: output only JSON, preserve unmentioned widgets, use sensible defaults.

### 6.4 Chat harness UI

Embedded chat panel in the V2 app:
- **Layout:** Chat panel on the left or bottom, dashboard on the right/top. Toggle visibility.
- **Chat display:** Message history (user + assistant).
- **Input:** Text field + send button.
- **Flow:**
  1. User types request.
  2. Client builds system prompt with current spec + widget schemas.
  3. Client sends to `/llm/generate`.
  4. Response received → extract JSON spec.
  5. Validate spec.
  6. If valid: hydrate dashboard, show success in chat.
  7. If invalid: show errors in chat, optionally send repair prompt.

### 6.5 Error recovery

- If LLM response isn't valid JSON: show "couldn't parse response" in chat with the raw text.
- If JSON parses but fails validation: show validation errors in chat. Optionally auto-retry with: "Your response had errors: [list]. Please fix and regenerate."
- Max 2 retries before giving up and showing errors to user.

### 6.6 Streaming (stretch)

If time permits, stream the LLM response for better perceived latency. Show partial response in chat, parse JSON on completion.

**Dependencies:** Phase 5 (validation pipeline), Grails server running.
**Estimated scope:** Large — server + client + prompt engineering.

---

## Phase 7: Polish & Demo Prep

**Goal:** Demo-ready quality. Everything works end-to-end, looks polished, handles edge cases.

### 7.1 Default dashboard experience

- On first load (no persisted state), show a compelling default dashboard.
- Default includes: city chooser, units toggle, current conditions, forecast chart, precipitation chart, summary grid.
- Well-laid-out, no gaps, good proportions.

### 7.2 Error states and loading

- All widgets show Hoist loading masks during data fetch.
- Graceful handling when weather API returns errors (error message in widget, not app crash).
- Graceful handling when LLM API is unavailable (clear error in chat, JSON harness still works).
- Empty-state messages when no data available.

### 7.3 Styling and theming

- Works in both light and dark Hoist themes.
- Consistent color palette across charts.
- Clean, professional look suitable for customer demos.
- Responsive: widgets look good at various sizes (DashCanvas handles this, but verify).

### 7.4 Curated example specs

Finalize the 5 example specs. Ensure each one:
- Validates successfully.
- Hydrates into a well-laid-out dashboard.
- Demonstrates a distinct V2 capability.

### 7.5 Demo scripts

Walk through the 5 demo scripts from DEMO-SCRIPTS.md. Verify each prompt produces the expected result with the current LLM provider and system prompt.

### 7.6 Changelog entry

Add a `CHANGELOG.md` entry for V2 under the current SNAPSHOT version.

### 7.7 Mock data mode (stretch)

If time permits, implement the deterministic mock data mode described in RISKS.md R7.

**Dependencies:** Phase 6.
**Estimated scope:** Medium — mostly refinement and testing.

---

## Phase Dependency Graph

```
Phase 1: Scaffolding
    ↓
Phase 2: Wiring Infrastructure
    ↓
Phase 3: Initial Widgets (5)
    ↓
Phase 4: Remaining Widgets (4) + Polish
    ↓
Phase 5: Validation + JSON Harness
    ↓
Phase 6: LLM Integration
    ↓
Phase 7: Polish & Demo Prep
```

Phases are strictly sequential — each builds on the prior. Within a phase, sub-tasks can often be parallelized (e.g., multiple widgets in Phase 3).

## Data Architecture

### WeatherDataModel

Central data cache, owned by `WeatherV2DashModel`:

```typescript
class WeatherDataModel extends HoistModel {
    // Observable map: city → WeatherData
    @observable.ref private _cache = new Map<string, WeatherData>();

    /** Get cached data for a city (synchronous, may return null). */
    getData(city: string): WeatherData | null {
        return this._cache.get(city) ?? null;
    }

    /** Ensure data is loaded for a city. Fetches if not cached or stale. */
    async ensureDataAsync(city: string): Promise<WeatherData> {
        const cached = this._cache.get(city);
        if (cached && !this.isStale(cached)) return cached;

        const [current, forecast] = await Promise.all([
            XH.fetchJson({url: 'weather/current', params: {city}}),
            XH.fetchJson({url: 'weather/forecast', params: {city}})
        ]);

        const data = this.normalize(city, current, forecast);
        runInAction(() => {
            this._cache = new Map(this._cache).set(city, data);
        });
        return data;
    }

    private isStale(data: WeatherData): boolean {
        return Date.now() - data.fetchedAt > 5 * 60 * 1000; // 5 min client-side staleness
    }

    private normalize(city, current, forecast): WeatherData {
        // Transform raw API responses into NormalizedCurrent + NormalizedForecastEntry[]
    }
}
```

### Normalized Data Types

```typescript
interface WeatherData {
    city: string;
    current: NormalizedCurrent;
    forecast: NormalizedForecastEntry[];
    fetchedAt: number;
}

interface NormalizedCurrent {
    temp: number;           // Fahrenheit (raw from API, convert to metric in widget)
    feelsLike: number;
    humidity: number;       // Percentage
    pressure: number;       // hPa
    windSpeed: number;      // mph
    windGust?: number;
    conditions: string;     // "Clear", "Rain", etc.
    description: string;    // "light rain", "clear sky", etc.
    iconCode: string;       // OpenWeatherMap icon code
}

interface NormalizedForecastEntry {
    dt: number;             // Unix timestamp (ms)
    temp: number;
    feelsLike: number;
    tempMin: number;
    tempMax: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust?: number;
    precipProbability: number;  // 0-100
    precipVolume: number;       // mm per 3h
    conditions: string;
    description: string;
    iconCode: string;
}
```

This normalized contract:
- Uses consistent naming (camelCase, not snake_case from API).
- Keeps raw units from the API (imperial — the API returns imperial when requested).
- Widgets handle unit conversion display-side based on their `units` input.
- Is domain-independent enough that swapping weather for financial data would mean changing the interface, not the widget architecture.

## Persistence Architecture

### What's Persisted

| What | Where | How |
|------|-------|-----|
| Dashboard layout + widget config + wiring | ViewManager (JsonBlob, server) | `DashCanvasModel.persistWith = {viewManagerModel}` |
| Widget-specific state (series selection, etc.) | Nested in DashCanvas state | `markPersist()` via `DashViewProvider` |
| Last selected city (on each CityChooser) | Nested in DashCanvas state | `markPersist('selectedCity')` |
| User's preferred units | Nested in DashCanvas state | `markPersist('units')` |

### Persistence Flow

```
User changes widget config
    → @persist property updates
    → DashViewProvider writes to DashViewModel.viewState
    → DashCanvasModel's state computed changes
    → PersistenceProvider (ViewManagerProvider) detects change
    → Debounced write to ViewManagerModel
    → ViewManagerModel persists to JsonBlob (server)
```

### Named Views

Users can save named dashboard layouts via ViewManager:
- "My Dashboard" — personal layout.
- "City Comparison" — shared layout.
- "Default" — the initial built-in layout.

This is identical to V1's approach. The V2 innovation is that the saved state includes wiring (bindings), so a shared view preserves the full widget composition.

### Spec ↔ Persisted State Relationship

The "DSL spec" IS the persisted state. `DashCanvasModel.getPersistableState()` returns exactly the JSON that the JSON harness displays. `setPersistableState()` accepts exactly the JSON that the LLM generates. There's no translation layer — the spec format and the persistence format are one and the same.
