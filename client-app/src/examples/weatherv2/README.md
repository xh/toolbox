# Weather Dashboard V2

An LLM-driven dashboard example built on Hoist's `DashCanvasModel`. Demonstrates that Hoist's
native persisted state can function as a declarative DSL — one that an LLM can generate from
natural language, validate against a schema, and hydrate into a live, interactive dashboard.

This app lives alongside the original Weather V1 example (`../weather/`) for A/B comparison. V1 is
unchanged; both share the same server-side weather endpoints.

## Key Concepts

- **Dashboard-as-DSL** — The "spec" format is not a new language. It is the JSON produced by
  `DashCanvasModel.getPersistableState()`, extended with a `bindings` convention in each widget's
  `viewState` for inter-widget wiring.
- **Inter-widget wiring** — Widgets declare typed inputs and outputs. A `WiringModel` coordinates
  reactive data flow via MobX observables. A city chooser publishes `selectedCity`; display widgets
  bind to it and update automatically.
- **LLM generation pipeline** — User describes a dashboard in natural language → system prompt with
  widget schemas + spec format → LLM produces JSON spec → validation pipeline checks it → valid
  specs hydrate into a live dashboard.

## Directory Structure

```
weatherv2/
├── AppModel.ts / AppComponent.ts   — App shell (app bar + DashCanvas + harness panels)
├── Icons.ts, Types.ts              — Shared icons and normalized weather data types
├── WeatherV2.scss                  — V2-specific styles
├── dash/
│   ├── WeatherV2DashModel.ts       — Central model: owns DashCanvasModel + WiringModel
│   ├── WiringModel.ts              — Observable pub/sub for widget outputs
│   ├── WidgetRegistry.ts           — Widget type registry + LLM prompt/schema generation
│   ├── types.ts                    — WidgetMeta, BindingSpec, DashSpec, ValidationResult
│   ├── validation.ts               — 3-stage validation pipeline (structural/semantic/referential)
│   ├── unitUtils.ts                — Temperature/wind unit conversion helpers
│   └── exampleSpecs.ts             — Curated example dashboard specs
├── svc/
│   ├── LlmChatService.ts                — System prompt builder + LLM API client (HoistService)
│   └── WeatherDataService.ts            — Per-city weather data caching (HoistService)
├── harness/
│   ├── JsonHarnessModel.ts/Panel.ts    — JSON editor: view/edit/validate/apply specs
│   └── ChatHarnessModel.ts/Panel.ts    — LLM chat: natural language → dashboard
├── widgets/
│   ├── BaseWeatherWidgetModel.ts       — Base class: resolveInput/publishOutput/persistence
│   ├── CityChooserWidget.ts            — City select input, publishes selectedCity
│   ├── UnitsToggleWidget.ts            — Imperial/metric toggle, publishes units
│   ├── CurrentConditionsWidget.ts      — Solid gauge + conditions details
│   ├── ForecastChartWidget.ts          — Multi-series configurable chart
│   ├── PrecipChartWidget.ts            — Dual-axis precipitation chart
│   ├── WindChartWidget.ts              — Wind speed + gusts chart
│   ├── SummaryGridWidget.ts            — Daily overview grid
│   ├── MarkdownContentWidget.ts        — Static markdown renderer
│   └── DashInspectorWidget.ts          — Debug view of live wiring graph
└── planning/                           — Design docs (see below)
```

### Server-side

- `grails-app/controllers/io/xh/toolbox/llm/LlmController.groovy` — POST `/llm/generate` endpoint
- `grails-app/services/io/xh/toolbox/llm/LlmService.groovy` — Anthropic Messages API proxy,
  per-user rate limiting, config-driven (API key, model, max tokens)
- Weather endpoints are shared with V1 via `WeatherController`/`WeatherService` (OpenWeatherMap)

## Widget Catalog (9 widgets)

| Widget | Type | Key Inputs | Key Outputs | Purpose |
|--------|------|------------|-------------|---------|
| City Chooser | Input | — | `selectedCity` | Select a city from a dropdown |
| Units Toggle | Input | — | `units` | Switch imperial/metric |
| Current Conditions | Display | `city`, `units` | — | Temperature gauge + details |
| Forecast Chart | Display | `city`, `units` | — | Multi-series temp/humidity chart |
| Precip Chart | Display | `city` | — | Precipitation probability + volume |
| Wind Chart | Display | `city`, `units` | — | Wind speed + gusts |
| Summary Grid | Display | `city`, `units` | — | 5-day daily overview |
| Markdown Content | Utility | — | — | Static markdown display |
| Dash Inspector | Utility | — | — | Debug view of wiring state |

## Planning Docs

Detailed design documents are in [`./planning/`](./planning/):

| Document | Contents |
|----------|----------|
| `PLAN.md` | Master 7-phase implementation plan with full task breakdown |
| `ROADMAP.md` | Phase-by-phase overview with scope and decision points |
| `PROGRESS.md` | Running log of what was built and when |
| `TASKS.md` | Structured checklist (~55 tasks across 7 phases) |
| `DSL-SPEC.md` | Dashboard spec schema, validation pipeline, hydration flow |
| `WIRING-DESIGN.md` | Inter-widget IO model: bindings, MobX propagation, examples |
| `WIDGET-CATALOG.md` | Full widget catalog with inputs/outputs/config |
| `WIDGET-SCHEMA.md` | WidgetMeta interface design and per-widget schema examples |
| `HOIST-CONVENTIONS.md` | House style checklist for V2 code |
| `DEPLOYMENT-MEMO.md` | LLM provider integration approach (Grails proxy) |
| `RISKS.md` | 10 identified risks with mitigations |
| `DEMO-SCRIPTS.md` | 5 customer demo scenarios with exact prompts |
| `PROMPT.md` | Original project brief and requirements |

## Agent Notes

Things that matter when working on this code:

1. **Read Hoist docs first.** Use the `hoist-react` MCP tools (`hoist-search-docs`,
   `hoist-search-symbols`) before writing code. The AGENTS.md at the repo root has the full primer.
   Key docs: `desktop/cmp/dash`, `persistence`, `cmp/viewmanager`, `core`, `conventions`.

2. **The spec IS the persisted state.** There is no translation layer. `DashCanvasModel.getPersistableState()`
   returns the same JSON the JSON harness displays and the LLM generates. `setPersistableState()`
   accepts it. Don't introduce an intermediate format.

3. **Widget instance IDs are positional.** DashCanvasModel assigns IDs based on order in the `state`
   array: first `cityChooser` → ID `"cityChooser"`, second → `"cityChooser_2"`. Bindings use these
   IDs. The validation pipeline's `computeInstanceIds` must match DashCanvasModel's behavior.

4. **WiringModel is MobX-reactive.** Widgets publish outputs to an observable map; downstream
   widgets resolve inputs by reading from it. Changes propagate via standard MobX reactions. Don't
   add event systems or manual subscriptions.

5. **Don't modify V1.** The original weather app at `../weather/` stays unchanged for comparison.
   Server-side weather endpoints (`WeatherController`/`WeatherService`) are shared — extend
   additively, don't break V1's existing contract.

6. **LLM proxy requires config.** The Grails `LlmService` reads `llmApiKey`, `llmModel`,
   `llmMaxTokens`, and `llmRateLimit` from Hoist Config. Without `llmApiKey` configured on the
   server, the chat harness will show a helpful error but the JSON harness still works.

7. **Branch: `weatherv2`.** All V2 work happens on this branch. Commit frequently as checkpoints.
