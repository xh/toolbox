# Weather Dashboard V2

An LLM-driven dashboard example built on Hoist's `DashCanvasModel`. Demonstrates that Hoist's
native persisted state can function as a declarative DSL - one that an LLM can generate from
natural language, validate against a schema, and hydrate into a live, interactive dashboard.

This app lives alongside the original Weather V1 example (`../weather/`) for A/B comparison. V1 is
unchanged; both share the same server-side weather endpoints.

## Key Concepts

- **Dashboard-as-DSL** - The "spec" format is not a new language. It is the JSON produced by
  `DashCanvasModel.getPersistableState()`, extended with a `bindings` convention in each widget's
  `viewState` for inter-widget wiring.
- **Inter-widget wiring** - Widgets declare typed inputs and outputs. A `WiringModel` coordinates
  reactive data flow via MobX observables. A city chooser publishes `selectedCity`; display widgets
  bind to it and update automatically.
- **Dashboard Agent** - A chat with Claude, built on `@xh/hoist-chat-kit`. The user describes a
  dashboard in natural language. The model reads the widget catalog, spec format and current
  dashboard from its system prompt, then calls tools that validate and apply spec changes.
- **Client-side tools** - Every tool runs in the browser: dashboard edits, saving and switching
  views, theme, panels. The server only relays the model's stream.

## Directory Structure

```
weatherv2/
├── AppModel.ts / AppComponent.ts - App shell: app bar, DashCanvas and side panel
├── viewManagers.ts               - ViewManagerModel for saved layouts, held outside AppModel
├── Icons.ts, Types.ts            - Shared icons and normalized weather data types
├── WeatherV2.scss                - V2-specific styles
├── dash/
│   ├── WeatherV2DashModel.ts     - Central model: owns DashCanvasModel and WiringModel
│   ├── WiringModel.ts            - Observable pub/sub for widget outputs
│   ├── WidgetRegistry.ts         - Widget type registry, LLM prompt and schema generation
│   ├── types.ts                  - WidgetMeta, BindingSpec, DashSpec, ValidationResult
│   ├── validation.ts             - 3-stage validation: structural, semantic, referential
│   ├── colorCoding.ts            - Linkage colors for input widgets and their consumers
│   ├── unitUtils.ts              - Temperature and wind unit conversion helpers
│   └── exampleSpecs.ts           - Curated example dashboard specs
├── agent/
│   ├── DashboardAgentModel.ts    - Dashboard Agent chat model, built on the chat kit
│   ├── DashboardAgentPanel.ts    - Dashboard Agent chat panel
│   └── systemPrompt.ts           - Dashboard Agent system prompt builder
├── svc/
│   ├── LlmToolService.ts         - Dashboard Agent tools, as chat kit `ChatToolSpec`s
│   └── WeatherDataService.ts     - Per-city weather data caching
├── harness/
│   └── JsonHarnessModel.ts/Panel.ts - JSON editor: view, edit, validate and apply specs
├── widgets/
│   ├── viewSpecs.ts              - Widget catalog and default layout for the dash model
│   ├── BaseWeatherWidgetModel.ts - Base class: resolveInput, publishOutput, persistence
│   ├── WidgetSettingsForm.ts     - Settings modal: input bindings, columns, config
│   ├── CityChooserWidget.ts      - City select input, publishes selectedCity
│   ├── UnitsToggleWidget.ts      - Imperial/metric toggle, publishes units
│   ├── CurrentConditionsWidget.ts - Solid gauge and conditions details
│   ├── ForecastChartWidget.ts    - Multi-series configurable chart
│   ├── PrecipChartWidget.ts      - Dual-axis precipitation chart
│   ├── WindChartWidget.ts        - Wind speed and gusts chart
│   ├── SummaryGridWidget.ts      - Daily overview grid
│   ├── MarkdownContentWidget.ts  - Static markdown renderer
│   └── DashInspectorWidget.ts    - Debug view of the live wiring graph
└── planning/                     - Design docs, see below
```

### Server-side

- `grails-app/controllers/io/xh/toolbox/llm/LlmController.groovy` - POST `/llm/stream` takes an
  Anthropic Messages body and returns NDJSON: one Anthropic stream event per line, flushed as each
  arrives. It also serves the Chat Kit app's live demo. An error before the first line renders as
  a normal Hoist error. A failure after it ends the stream with an Anthropic `error` event. If the
  client disconnects, the server aborts the upstream request.
- `grails-app/services/io/xh/toolbox/llm/LlmService.groovy` - relays the Anthropic Messages API.
  It treats the request body as untrusted. It forwards only `system`, `messages`, `tools` and
  `tool_choice`, and rejects Anthropic server tools such as web search. The server sets the model,
  the token limit and any other params from config. The service also applies a per-user rate
  limit and a cap on concurrent streams. Busy, rate-limited and unavailable upstreams return a
  short routine error, which the client does not report as a bug. Its Groovydoc lists the full
  policy and the `llm*` configs, which `BootStrap` creates with defaults.
- Weather endpoints are shared with V1 through `WeatherController` and `WeatherService`, which
  call OpenWeatherMap.

### Dashboard Agent

The agent's chat UI and run loop come from `@xh/hoist-chat-kit`. The app supplies the prompt,
the tools and the wiring.

- `DashboardAgentModel` owns a kit `ChatModel`. Its transport is a `HoistChatTransport` that
  posts to `llm/stream`, with an `AnthropicCodec`. The codec builds the Anthropic request and
  decodes the relayed stream, so the server translates nothing.
- The codec calls `buildSystemPrompt` before every model call, so the model sees the live
  dashboard, including changes its own tools made earlier in the turn. The static instructions
  come first, with the prompt cache breakpoint. That breakpoint also caches the tools, which come
  ahead of the system prompt. The dashboard state follows, unmarked, as it changes with every
  edit.
- `LlmToolService.tools` declares each tool once: name, description and JSON Schema for the
  model, title, icon and summary for its card in the chat, and an `execute` function. A thrown
  error goes back to the model, which can correct itself. `reset_dashboard` discards unsaved
  changes, so the user must approve it first. Its `approvalPrompt` says so on the card.
- The `ChatModel` runs the tool loop, streams replies and handles stop, retry, regenerate and
  edit. It caps a turn at 5 steps with `maxSteps`, down from the kit's default of 10. Each step is
  one model call, and the server's `llmRateLimit` counts model calls: 20 per user per hour by
  default. The cap keeps one turn from using more than a quarter of that. To allow more use, raise
  the config rather than `maxSteps`.
- `DashboardAgentPanel` renders the kit's `chatPanel` with the app's title, the kit's
  `chatClearButton`, an empty state and suggestions. `AppModel` owns the agent and passes it the
  dash model, so the conversation survives hiding the panel.

### Chat kit (`@xh/hoist-chat-kit`)

Toolbox installs the kit from npm. As with `@xh/hoist`, `package.json` declares it as the `next`
dist-tag, which tracks the kit's latest snapshot. Refresh it with `pnpm update @xh/hoist-chat-kit`.

- The kit ships TypeScript and SCSS source, as hoist-react does. `rsbuild.config.mjs` adds it to
  `extraIncludePaths`, as it does `@xh/package-template`, so SWC compiles it with the app.
- `@xh/hoist`, `react` and `react-dom` are peer dependencies of the kit, so it uses the app's
  copies.
- To work on the kit against Toolbox, link a sibling `../hoist-chat-kit` checkout. The steps are
  under "Client against local `hoist-chat-kit`" in
  [`docs/running-locally.md`](../../../../docs/running-locally.md#running-against-a-local-hoist-framework-checkout).
  Do not commit them.

## Widget Catalog (9 widgets)

| Widget             | Type    | Key Inputs      | Key Outputs    | Purpose                            |
| ------------------ | ------- | --------------- | -------------- | ---------------------------------- |
| City Chooser       | Input   | -               | `selectedCity` | Select a city from a dropdown      |
| Units Toggle       | Input   | -               | `units`        | Switch imperial/metric             |
| Current Conditions | Display | `city`, `units` | -              | Temperature gauge + details        |
| Forecast Chart     | Display | `city`, `units` | -              | Multi-series temp/humidity chart   |
| Precip Chart       | Display | `city`          | -              | Precipitation probability + volume |
| Wind Chart         | Display | `city`, `units` | -              | Wind speed + gusts                 |
| Summary Grid       | Display | `city`, `units` | -              | 5-day daily overview               |
| Markdown Content   | Utility | -               | -              | Static markdown display            |
| Dash Inspector     | Utility | -               | -              | Debug view of wiring state         |

## Planning Docs

Detailed design documents are in [`./planning/`](./planning/). These are the original design and
build log - code snippets in them predate the hoist-react v88 upgrade (legacy decorators,
`AppModel.instance` access) and are not kept in sync with the code. The source and the Agent Notes
below are authoritative.

| Document               | Contents                                                    |
| ---------------------- | ----------------------------------------------------------- |
| `PLAN.md`              | Master 7-phase implementation plan with full task breakdown |
| `ROADMAP.md`           | Phase-by-phase overview with scope and decision points      |
| `PROGRESS.md`          | Running log of what was built and when                      |
| `TASKS.md`             | Structured checklist (~55 tasks across 7 phases)            |
| `DSL-SPEC.md`          | Dashboard spec schema, validation pipeline, hydration flow  |
| `WIRING-DESIGN.md`     | Inter-widget IO model: bindings, MobX propagation, examples |
| `WIDGET-CATALOG.md`    | Full widget catalog with inputs/outputs/config              |
| `WIDGET-SCHEMA.md`     | WidgetMeta interface design and per-widget schema examples  |
| `HOIST-CONVENTIONS.md` | House style checklist for V2 code                           |
| `DEPLOYMENT-MEMO.md`   | LLM provider integration approach (Grails proxy)            |
| `RISKS.md`             | 10 identified risks with mitigations                        |
| `DEMO-SCRIPTS.md`      | 5 customer demo scenarios with exact prompts                |
| `PROMPT.md`            | Original project brief and requirements                     |

## Agent Notes

Things that matter when working on this code:

1. **Read Hoist docs first.** Use the `hoist-react` MCP tools (`hoist-search-docs`,
   `hoist-search-symbols`) before writing code. The AGENTS.md at the repo root has the full primer.
   Key docs: `desktop/cmp/dash`, `persistence`, `cmp/viewmanager`, `core`, `conventions`.

2. **The spec IS the persisted state.** There is no translation layer.
   `DashCanvasModel.getPersistableState()` returns the same JSON the JSON harness displays and the
   LLM generates. `setPersistableState()` accepts it. Do not introduce an intermediate format.

3. **Widget instance IDs are positional.** DashCanvasModel assigns IDs by order in the `state`
   array: the first `cityChooser` gets ID `"cityChooser_0"`, the second `"cityChooser_1"`. Bindings
   use these IDs. The validation pipeline's `computeInstanceIds` must match DashCanvasModel.

4. **WiringModel is MobX-reactive.** Widgets publish outputs to an observable map; downstream
   widgets resolve inputs by reading from it. Changes propagate via standard MobX reactions. Do not
   add event systems or manual subscriptions.

5. **Do not modify V1.** The original weather app at `../weather/` stays unchanged for comparison.
   Server-side weather endpoints (`WeatherController`/`WeatherService`) are shared - extend
   additively, do not break V1's existing contract.

6. **The LLM relay requires config.** The Grails `LlmService` reads its `llm*` configs, which
   `BootStrap` creates with defaults on startup. Until `llmApiKey` is set, the Dashboard Agent
   shows the server's error, but the JSON harness still works.

7. **Keep the runtime import graph acyclic.** Widgets, services, and helpers must not import
   `AppModel` (or `WeatherV2DashModel`) as a value - `AppModel` imports the widget catalog, so that
   would close a runtime cycle, which TC39 decorators can turn into a startup `ReferenceError`.
   Read the app model via `XH.appModel as AppModel` with `import type {AppModel}`, and the saved
   layouts via `viewManagers`. Widget modules register their `meta` with `widgetRegistry` on load;
   `widgets/viewSpecs.ts` imports them all, so the registry is complete before the dash is built.
