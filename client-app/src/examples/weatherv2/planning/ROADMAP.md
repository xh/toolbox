# Weather Dashboard V2 — Roadmap

## Phase Overview

| Phase | Name | Key Deliverable | Scope | Dependencies |
|-------|------|----------------|-------|-------------|
| 1 | **Scaffolding** | App loads at `/weatherv2` with empty DashCanvas | Small | None |
| 2 | **Wiring Infrastructure** | WiringModel, WeatherWidgetModel base, WidgetRegistry | Medium | Phase 1 |
| 3 | **Initial Widgets** | 5 widgets (city chooser + 4 display), WeatherDataModel | Large | Phase 2 |
| 4 | **Remaining Widgets** | 4 more widgets (units, wind, markdown, inspector) | Medium | Phase 3 |
| 5 | **Validation + JSON Harness** | Spec validation pipeline + JSON editor UI | Medium-Large | Phase 4 |
| 6 | **LLM Integration** | Grails proxy + chat harness + prompt engineering | Large | Phase 5 |
| 7 | **Polish & Demo Prep** | Demo-quality UX, example specs, changelog | Medium | Phase 6 |

## Key Decision Points

| Decision | Phase | Options | Chosen |
|----------|-------|---------|--------|
| Spec format | Design | New format vs. native Hoist state | Native Hoist state |
| Wiring storage | Design | Separate wiring layer vs. in viewState | In viewState (`bindings` key) |
| Data access | 3 | Per-widget fetch vs. shared cache | Shared `WeatherDataModel` |
| JSON editor | 5 | CodeMirror/Monaco vs. textarea | Start with textarea, upgrade if time |
| LLM provider | 6 | Anthropic vs. OpenAI | Anthropic (Claude) primary |
| LLM protocol | 6 | Full-spec replacement vs. JSON Patch | Full-spec replacement |
| LLM proxy | 6 | Client-side vs. Grails proxy | Grails proxy (CORS requirement) |

## Phase Details

### Phase 1: Scaffolding
- New directory: `client-app/src/examples/weatherv2/`
- Entry point: `apps/weatherv2.ts`
- Nav registration in `ExamplesTabModel.ts`
- Empty `AppModel` + `AppComponent` + `WeatherV2DashModel`
- **Done when:** App loads at `/weatherv2` with empty DashCanvas and ViewManager controls.

### Phase 2: Wiring Infrastructure
- `WiringModel` — observable output map, publish/resolve/remove
- `WeatherWidgetModel` — base class with `resolveInput()` / `publishOutput()`
- `WidgetRegistry` — register, lookup, prompt generation
- TypeScript type definitions for all spec/wiring types
- Basic validation skeleton
- **Done when:** A test widget can publish an output and another test widget can resolve it reactively.

### Phase 3: Initial Widgets
- `WeatherDataModel` — shared per-city data cache with normalized types
- `CityChooserWidget` — dropdown, publishes `selectedCity`
- `CurrentConditionsWidget` — temp gauge + details, consumes `city` + `units`
- `ForecastChartWidget` — multi-series chart, consumes `city` + `units`
- `PrecipChartWidget` — precip probability + volume, consumes `city`
- `SummaryGridWidget` — daily overview grid, consumes `city` + `units`
- Default dashboard layout with all 5 widgets wired together
- **Done when:** Changing the city in the chooser updates all display widgets. Layout persists.

### Phase 4: Remaining Widgets
- `UnitsToggleWidget` — imperial/metric toggle, publishes `units`
- `WindChartWidget` — wind speed + gusts chart, consumes `city` + `units`
- `MarkdownContentWidget` — static rich-text display
- `DashInspectorWidget` — debug view of wiring graph + values
- Update default layout to include all 9 widgets
- **Done when:** Full widget set functional. Inspector shows live binding values.

### Phase 5: Validation + JSON Harness
- Full 3-stage validation pipeline (structural, semantic, referential)
- JSON Schema generation from WidgetRegistry
- JSON editor panel (split-pane: editor + live dashboard)
- Apply/validate/hydrate flow
- 5 curated example specs
- Export (copy spec to clipboard)
- **Done when:** User can paste a JSON spec, see validation errors or a live dashboard.

### Phase 6: LLM Integration
- `LlmController.groovy` + `LlmService.groovy` — thin proxy to Anthropic API
- Hoist Config entries for API key, model, limits
- Client-side `LlmChatService` — prompt assembly + response parsing
- Chat harness UI (embedded panel with message history)
- System prompt with widget schemas + spec format + examples
- Error recovery (validation errors → retry prompt)
- **Done when:** User types "build me a weather dashboard" and it appears.

### Phase 7: Polish & Demo Prep
- Default dashboard looks great out of the box
- Error states and loading masks
- Light/dark theme support
- Walk through all 5 demo scripts successfully
- Changelog entry
- Mock data mode (stretch)
- **Done when:** Ready to demo to customers.

## Risk Summary

See RISKS.md for full details. Top 3:
1. **LLM produces invalid specs** — mitigated by hard validation gate + repair loop.
2. **Wiring complexity confuses users** — mitigated by curated examples + LLM abstraction.
3. **Instance ID instability** — mitigated by ordering rules + validation.
