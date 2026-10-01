# Tasks — Weather Dashboard V2

## Phase 1: Scaffolding

- [ ] **1.1** Create `client-app/src/examples/weatherv2/` directory structure
- [ ] **1.2** Create `apps/weatherv2.ts` entry point with `XH.renderApp()`
- [ ] **1.3** Create `BaseAppModel` extension (`AppModel.ts`) with `ViewManagerModel` setup
- [ ] **1.4** Create `AppComponent.ts` with `appBar` + empty `dashCanvas`
- [ ] **1.5** Create `WeatherV2DashModel.ts` with empty `DashCanvasModel` + `persistWith`
- [ ] **1.6** Copy `Types.ts` and `Icons.ts` from V1
- [ ] **1.7** Create `WeatherV2.scss` with base styles
- [ ] **1.8** Register V2 in `ExamplesTabModel.ts`
- [ ] **1.9** Verify app loads at `/weatherv2` with empty canvas and ViewManager

## Phase 2: Wiring Infrastructure

- [ ] **2.1** Create `dash/types.ts` with `WidgetMeta`, `BindingSpec`, `InputDef`, `OutputDef`, `DashSpec`, `ValidationResult` types
- [ ] **2.2** Implement `dash/WiringModel.ts` — observable output map, publishOutput, resolveBinding, removeWidget
- [ ] **2.3** Implement `dash/WeatherWidgetModel.ts` — base class with resolveInput, publishOutput, onLinked persistence setup
- [ ] **2.4** Implement `dash/WidgetRegistry.ts` — register, get, getAll, generateLLMPrompt
- [ ] **2.5** Implement basic `dash/validation.ts` — structural checks (known viewSpecIds), referential checks (binding targets exist)
- [ ] **2.6** Wire WiringModel into WeatherV2DashModel

## Phase 3: Initial Widgets

- [ ] **3.1** Implement `WeatherDataModel.ts` — per-city cache, ensureDataAsync, normalize, observable cache map
- [ ] **3.2** Define `NormalizedCurrent` and `NormalizedForecastEntry` types in `Types.ts`
- [ ] **3.3** Implement `widgets/CityChooserWidget.ts` — model + component, publishes selectedCity
- [ ] **3.4** Implement `widgets/CurrentConditionsWidget.ts` — temp gauge + details, consumes city + units
- [ ] **3.5** Implement `widgets/ForecastChartWidget.ts` — multi-series line chart, consumes city + units
- [ ] **3.6** Implement `widgets/PrecipChartWidget.ts` — dual-axis precip chart, consumes city
- [ ] **3.7** Implement `widgets/SummaryGridWidget.ts` — daily overview grid, consumes city + units
- [ ] **3.8** Register all 5 widgets in WidgetRegistry with static `meta`
- [ ] **3.9** Add viewSpecs to DashCanvasModel for all 5 widgets
- [ ] **3.10** Set up default initialState layout
- [ ] **3.11** End-to-end test: city change propagates to all display widgets via wiring

## Phase 4: Remaining Widgets

- [ ] **4.1** Implement `widgets/UnitsToggleWidget.ts` — imperial/metric toggle, publishes units
- [ ] **4.2** Implement `widgets/WindChartWidget.ts` — wind speed + gusts chart, consumes city + units
- [ ] **4.3** Implement `widgets/MarkdownContentWidget.ts` — markdown renderer, config-driven
- [ ] **4.4** Implement `widgets/DashInspectorWidget.ts` — wiring graph visualization
- [ ] **4.5** Register all 4 new widgets in WidgetRegistry
- [ ] **4.6** Add viewSpecs to DashCanvasModel
- [ ] **4.7** Update default initialState layout to include key widgets
- [ ] **4.8** Verify units toggle drives unit conversion in all applicable widgets
- [ ] **4.9** Verify inspector shows live binding values and updates reactively

## Phase 5: Validation + JSON Harness

- [ ] **5.1** Add `ajv` dependency for JSON Schema validation
- [ ] **5.2** Implement full structural validation (JSON Schema against spec)
- [ ] **5.3** Implement semantic validation (config types, enums, required fields)
- [ ] **5.4** Implement referential validation (binding targets, output existence, type compat, cycle detection)
- [ ] **5.5** Implement spec version checking and migration framework
- [ ] **5.6** Create JSON harness panel component — split pane with editor + dashboard
- [ ] **5.7** Implement Apply button flow: parse → migrate → validate → hydrate
- [ ] **5.8** Implement validation error display with JSON paths
- [ ] **5.9** Implement "Copy Spec" export (getPersistableState → clipboard)
- [ ] **5.10** Create 5 curated example specs (basic, full, comparison, minimal, annotated)
- [ ] **5.11** Implement "Load Example" dropdown
- [ ] **5.12** End-to-end test: paste a spec, see it hydrate; paste invalid spec, see errors

## Phase 6: LLM Integration

- [ ] **6.1** Create `LlmController.groovy` with `generate` endpoint
- [ ] **6.2** Create `LlmService.groovy` — Anthropic API calls via JSONClient
- [ ] **6.3** Add Hoist Config entries (llmApiKey, llmProvider, llmModel, llmMaxTokens)
- [ ] **6.4** Implement server-side rate limiting (per-user, 20 req/hour)
- [ ] **6.5** Build client-side `LlmChatService` — prompt assembly, response parsing
- [ ] **6.6** Write system prompt template with widget schemas + spec format + rules
- [ ] **6.7** Create chat harness UI component — message history + input + send
- [ ] **6.8** Implement chat flow: user message → build prompt → call proxy → parse spec → validate → hydrate
- [ ] **6.9** Implement error recovery — validation failures shown in chat, optional retry
- [ ] **6.10** Test with all 5 demo scripts from DEMO-SCRIPTS.md

## Phase 7: Polish & Demo Prep

- [ ] **7.1** Finalize default dashboard layout and initial experience
- [ ] **7.2** Add loading masks and error states to all widgets
- [ ] **7.3** Verify light/dark theme support
- [ ] **7.4** Review and finalize all 5 example specs
- [ ] **7.5** Walk through demo scripts end-to-end, fix issues
- [ ] **7.6** Add CHANGELOG.md entry for V2
- [ ] **7.7** Final code review pass — conventions checklist, style, naming
- [ ] **7.8** (Stretch) Implement deterministic mock data mode
- [ ] **7.9** (Stretch) LLM response streaming for better perceived latency
