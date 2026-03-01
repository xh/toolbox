# Progress Log — Weather Dashboard V2

## 2026-02-27

### Planning Phase Complete

All 12 planning documents produced:
- **HOIST-CONVENTIONS.md** — House style checklist for V2 implementation.
- **WIRING-DESIGN.md** — Inter-widget IO model: MobX-based publish/resolve through WiringModel.
- **WIDGET-SCHEMA.md** — WidgetMeta interface design with static `meta` per widget class.
- **WIDGET-CATALOG.md** — 9 widgets: 2 input, 5 display, 2 utility. Focused on compositional range.
- **DSL-SPEC.md** — Dashboard spec = Hoist native persisted state. JSON Schema + 3-stage validation.
- **DEPLOYMENT-MEMO.md** — Thin Grails proxy (CORS requirement), Anthropic Claude primary provider.
- **RISKS.md** — 10 risks identified with mitigations.
- **DEMO-SCRIPTS.md** — 5 customer wow scenarios with exact prompts.
- **PLAN.md** — 7-phase master plan with full task breakdown.
- **ROADMAP.md** — Phase overview with key decision points.
- **TASKS.md** — Structured checklist (~55 tasks across 7 phases).

### Key Design Decisions Made

1. **Spec format = Hoist native state.** No new DSL. The `DashCanvasModel.getPersistableState()` output IS the spec. Wiring added via `bindings` key in widget viewState.
2. **WiringModel as MobX coordinator.** Observable output map. Widgets publish/resolve through it. Changes propagate via standard MobX reactivity.
3. **WeatherWidgetModel base class.** All widgets extend it. Provides `resolveInput()`, `publishOutput()`, standard `onLinked()` persistence setup.
4. **Shared WeatherDataModel.** Per-city caching. Widgets don't fetch directly — they request data from the shared model. Avoids duplicate API calls.
5. **Full-spec replacement for LLM edits.** Not JSON Patch. Simpler, more reliable, validates as a unit.
6. **Grails proxy for LLM.** CORS prevents direct browser→Anthropic calls. Thin proxy adds API key server-side.

### Execution — Phase 1+2: Scaffolding + Wiring (Complete)

Created V2 app shell:
- `apps/weatherv2.ts` entry point
- `AppModel.ts`, `AppComponent.ts` — app bar + dashCanvas
- `WeatherV2DashModel.ts` — owns DashCanvasModel + WiringModel + WeatherDataModel
- `WiringModel.ts` — observable pub/sub for widget outputs
- `WeatherWidgetModel.ts` — base class with resolveInput/publishOutput
- `WidgetRegistry.ts` — singleton registry with generateLLMPrompt
- `WeatherDataModel.ts` — per-city weather data caching
- `dash/types.ts` — WidgetMeta, BindingSpec, DashSpec, ValidationResult
- `Types.ts` — WeatherData, NormalizedCurrent, NormalizedForecastEntry
- `Icons.ts`, `WeatherV2.scss`
- Registered in ExamplesTabModel.ts

### Execution — Phase 3: Initial Widget Set (Complete)

5 core widgets:
- **CityChooserWidget** — select input, publishes `selectedCity`, 25 world cities
- **CurrentConditionsWidget** — solid gauge + icon + details, consumes city+units
- **ForecastChartWidget** — multi-series configurable chart (temp/feelsLike/humidity/pressure)
- **PrecipChartWidget** — dual-axis probability + volume chart
- **SummaryGridWidget** — daily overview grid with groupBy aggregation

Plus `unitUtils.ts` for temperature/wind unit conversion.

### Execution — Phase 4: Remaining Widgets (Complete)

4 additional widgets:
- **UnitsToggleWidget** — buttonGroupInput, publishes `units` output
- **WindChartWidget** — wind speed + gusts chart, consumes city+units
- **MarkdownContentWidget** — simple markdown-to-HTML renderer
- **DashInspectorWidget** — debug grid showing live widget instances, bindings, outputs

All 9 widgets registered in DashCanvasModel viewSpecs. Initial state includes units toggle wired to all unit-aware display widgets.

### Execution — Phase 5: Validation + JSON Harness (Complete)

- **validation.ts** — Three-stage pipeline: structural (unknown types, missing fields, layout bounds), semantic (config types, enums, binding inputs), referential (dangling refs, output existence, cycle detection)
- **exampleSpecs.ts** — 4 curated specs: Minimal, Full Dashboard, City Comparison, Annotated
- **JsonHarnessModel.ts** — Parse → migrate → validate → apply flow + sync/export
- **JsonHarnessPanel.ts** — jsonInput editor + validation display + Load Example dropdown + Apply/Validate/Sync/Copy controls
- App bar JSON button toggles the harness as a side panel

### Execution — Phase 6: LLM Integration (Complete)

Server-side:
- **LlmController.groovy** — POST `/llm/generate` endpoint
- **LlmService.groovy** — Anthropic Messages API proxy via JSONClient, per-user rate limiting, config-driven (llmApiKey, llmModel, llmMaxTokens, llmRateLimit)

Client-side:
- **LlmChatService.ts** — System prompt builder (widget schemas + spec format + wiring/layout rules + current spec), response parser (JSON extraction from code fences)
- **ChatHarnessModel.ts** — Conversation history, LLM API calls, auto-applies validated specs
- **ChatHarnessPanel.ts** — Chat UI with message bubbles, error display, text input

App bar Chat button toggles the harness alongside JSON harness.

## 2026-02-28

### Execution — Phase 7: Polish (Complete)

Final review pass:
- All 9 widgets compile cleanly with full TypeScript type checking
- ESLint and stylelint pass with zero errors
- All files formatted by Prettier via pre-commit hooks
- Default dashboard layout includes city chooser, units toggle, conditions, forecast, wind, precip, and summary grid — all wired together
- 4 example specs validate successfully

### Commit History

1. `f6a5ee78` — Planning artifacts (12 docs)
2. `5a87fa56` — Phase 1+2 scaffolding + wiring infrastructure
3. `760d56c7` — Phase 3 initial widget set (5 widgets)
4. `9188172c` — Phase 4 remaining widgets (4 widgets)
5. `7e18e8b3` — Phase 5 validation pipeline + JSON harness
6. `12de0c6d` — Phase 6 LLM integration (server + client + chat harness)

### What's Working

- Full 9-widget catalog with typed inputs/outputs/config
- Inter-widget wiring via MobX-reactive WiringModel
- Per-city weather data caching via WeatherDataModel
- Spec validation with detailed error messages + JSON paths
- JSON harness: edit → validate → apply → dashboard updates live
- LLM chat harness: natural language → system prompt → spec → validation → hydration
- 4 curated example specs loadable from dropdown

### LLM Chat Service Promoted to HoistService

LlmChatService refactored from a plain class to a proper HoistService, installed via `XH.installServicesAsync()` in AppModel. Accessible as `XH.llmChatService` throughout the app.

### UI Polish

- JSON harness: improved UX with persisted panel state and added testIds
- Chat/JSON panels use `PanelModel` with right-side resizable layout

### Runtime Testing Results

All runtime features confirmed working with live Grails server:
- Weather API calls via OpenWeatherMap — data caching works correctly
- LLM proxy via Anthropic API — full round-trip conversation works
- DashCanvas drag/resize works
- Widget instance IDs in bindings match DashCanvasModel's ID generation
- ViewManager persistence across page reloads works

### Chat UX: Enter-to-Submit

Added `onKeyDown` handler to ChatHarnessPanel's textArea. Enter now submits the message; Shift+Enter inserts a newline. Matches standard chat UX conventions.

### Markdown Widget Rendering Fix

The markdown widget was rendering header content inline with body text because Hoist's `box` component applies `display: flex` via inline styles, causing react-markdown's block-level elements (h1, p) to lay out horizontally. Fixed by replacing `box` with a plain `div` from `@xh/hoist/cmp/layout` — the CSS `.weather-v2-markdown` class provides the necessary `flex: 1`, `padding`, and `overflow: auto` for the widget to fill its card correctly.

### Thorough LLM Chat Testing (12 API + 3 UI tests)

Systematic testing of the LLM chat functionality across multiple scenarios:

**Results (all passing):**
- Fresh dashboard builds from natural language (correct widget selection, bindings, layout)
- Iterative refinement (add/remove/modify widgets while preserving existing ones)
- Multi-instance wiring (dual city choosers with correct `cityChooser`/`cityChooser_2` instance IDs)
- Capability self-description (accurate listing of all 9 widgets with categories and wiring explanation)
- Off-topic/impossible requests handled gracefully (poems, stock prices, gibberish all redirected)
- Prompt injection rejected cleanly
- Const bindings used correctly for hard-wired city inputs
- Full end-to-end UI pipeline: LLM → JSON parse → validation → hydration → live dashboard

**System prompt quality:** The current prompt produces consistently valid specs with correct bindings, sensible layouts, and appropriate widget selection. No critical issues found.

### Auto-Generated Widget Titles

Implemented reactive auto-titles that show widget context (particularly the active city) in widget headers:

**Architecture:**
- `BaseWeatherWidgetModel.getAutoTitle()` — virtual method returning `null` by default
- `BaseWeatherWidgetModel.onLinked()` — reaction tracks `getAutoTitle()` and pushes to `viewModel.title`
- Display widgets override: `"Current Conditions — Tokyo"`, `"Forecast — Chicago"`, etc.
- Titles update reactively when the city chooser selection changes

**Widget-specific behavior:**
- **Display widgets** (CurrentConditions, ForecastChart, PrecipChart, WindChart, SummaryGrid): Auto-generate `"<Widget Type> — <City>"` titles from their bound city input
- **MarkdownContent**: Exposes a `title` config in its state (`state.title`) — LLM/user sets it explicitly since content is free-form
- **Input widgets** (CityChooser, UnitsToggle) and **DashInspector**: Use default viewSpec titles

**User renaming disabled:** Set `allowRename: false` on all 9 viewSpecs in `WeatherV2DashModel` to prevent conflicts between user-set titles and auto-generated ones.

**System prompt updated:** Added guidance telling the LLM not to set top-level `title` for auto-titled display widgets (it would be overwritten) and to use `state.title` for markdown widgets.

**Example specs updated:** Removed top-level `title` from display widgets in comparison spec; moved markdown title into `state.title` in annotated spec.

### What's Working (Updated)

- Full 9-widget catalog with typed inputs/outputs/config
- Inter-widget wiring via MobX-reactive WiringModel
- Per-city weather data caching via WeatherDataService
- Spec validation with detailed error messages + JSON paths
- JSON harness: edit → validate → apply → dashboard updates live
- LLM chat harness: natural language → system prompt → spec → validation → hydration
- Enter-to-submit in chat with Shift+Enter for newlines
- Auto-generated widget titles with reactive city context
- Markdown rendering with proper block layout
- 4 curated example specs loadable from dropdown
- Widget renaming disabled to prevent title conflicts

### LLM Tool Use (Function Calling)

Added Anthropic native tool use API to give the LLM callable tools for app operations beyond dashboard spec generation.

**Architecture:**
- Tools execute **client-side** since they manipulate UI state (ViewManager, theme, panels)
- Server is a pass-through — forwards the `tools` array to the Anthropic API
- Multi-turn loop: LLM responds with `tool_use` blocks → client executes → sends `tool_result` → LLM responds with final text (max 5 iterations)

**6 tools implemented:**
| Tool | Action |
|------|--------|
| `save_dashboard_as_view` | Save current dashboard as a named view |
| `switch_to_view` | Switch to an existing saved view by name |
| `reset_dashboard` | Reset dashboard to saved state |
| `toggle_theme` | Toggle light/dark theme |
| `open_widget_chooser` | Open widget chooser panel |
| `show_json_spec` | Open JSON spec editor |

**Files changed:**
- **Server:** `LlmService.groovy` + `LlmController.groovy` — accept optional `tools` param, increased default max tokens to 8192
- **Client (new):** `svc/LlmToolService.ts` — HoistService with tool definitions + execution
- **Client (modified):** `svc/LlmChatService.ts` — returns full content block array, tool guidance in system prompt
- **Client (modified):** `harness/ChatHarnessModel.ts` — tool use loop, split API messages from display messages, ToolCallDisplay type
- **Client (modified):** `harness/ChatHarnessPanel.ts` — tool calls rendered as collapsible `<details>` elements, tool-use suggestion in empty state
- **Client (modified):** `WeatherV2.scss` — `.weather-v2-tool-call` styles
- **Client (modified):** `AppModel.ts` + `Bootstrap.ts` — LlmToolService registration + type augmentation
