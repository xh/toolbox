# Weather Dashboard V2 (Toolbox Demo) — Hoist-native, DSL-grade, LLM-driven

## Context

### What V1 is

The Toolbox project already has a V1 "Weather Dashboard" example app, entirely AI-generated. It lives at:

**Client** — `client-app/src/examples/weather/`
- `AppModel.ts` / `AppComponent.ts` — top-level app shell with city selector dropdown in the app bar.
- `WeatherDashModel.ts` — central model: holds `selectedCity`, fetches data, owns a `DashCanvasModel`.
- `Types.ts` — typed response interfaces (`CurrentWeatherResponse`, `ForecastResponse`, `ForecastItem`).
- `Icons.ts`, `Weather.scss` — icons and styles.
- `widgets/` — six widget files, each a model+component pair:
  - `CurrentConditionsWidget` — Highcharts solid gauge + details card.
  - `TempForecastWidget` — spline chart (temp + feels-like over 5 days).
  - `PrecipForecastWidget` — dual-axis column chart (probability + volume).
  - `WindForecastWidget` — spline chart (speed + gusts).
  - `HumidityPressureWidget` — dual-axis spline chart.
  - `ConditionsSummaryWidget` — grid with daily highs/lows, conditions, humidity, wind.

**Server** — Grails backend:
- `WeatherController.groovy` — two endpoints: `weather/current`, `weather/forecast`. `@AccessAll`.
- `WeatherService.groovy` — calls OpenWeatherMap API (`/data/2.5/weather`, `/data/2.5/forecast`), caches results (10 min current, 30 min forecast). API key from Hoist `Config`.

**Entry point** — `client-app/src/apps/weather.ts`, registered in `ExamplesTabModel.ts`.

V1 uses `DashCanvasModel` for a draggable/resizable widget grid and `ViewManagerModel` for save/restore of named layouts. All widgets consume a single `selectedCity` from the app bar — no inter-widget wiring, no user-configurable widget settings, no JSON-level spec editing.

### What V2 is

V2 is not about faster data or realtime. It is a demo-quality proof that **Hoist dashboards + persistable state can function as a declarative DSL** that an LLM can generate safely and correctly, producing JSON that hydrates into a real, interactive dashboard at runtime.

The enterprise-dashboard story: "business user describes what they want; agent produces schema-valid dashboard spec; Hoist renders it; the dashboard remains fully persistable, shareable, and editable."

### V1/V2 coexistence

V2 is built **alongside** V1, not on top of it. V1 stays unchanged so we can do an A/B comparison: "We started here, then we did this huge upgrade."

- V2 gets its own directory: `client-app/src/examples/weatherv2/` (or similar), its own app entry point, and its own nav registration in `ExamplesTabModel.ts`.
- **Copy V1 client code as a starting point.** No need to deduplicate widgets or models across V1 and V2 — they are independent example apps.
- **Exception: the weather data surface.** `WeatherService.groovy` and `WeatherController.groovy` should be shared (or extracted to a common location) so both apps hit the same server-side endpoints. If V2 needs richer data (e.g., hourly breakdowns, derived metrics), extend the shared service — V1 can simply ignore the new fields.

---

## Primary objectives (in priority order)

1. **Hoist fidelity.** The code must read like a real Hoist app written by Hoist maintainers. Conform to established patterns, naming conventions, model/component conventions, state persistence patterns, and style guidelines. Avoid "off-reservation" architecture.

   Before writing any code, use the **hoist-react MCP server** to study the framework:
   - `hoist-search-docs` — keyword search across all framework docs (filterable by category: package, concept, conventions).
   - `hoist-search-symbols` / `hoist-get-symbol` / `hoist-get-members` — TypeScript API introspection (classes, interfaces, types, signatures, JSDoc).
   - `hoist-list-docs` — browse the full doc catalog.

   The **full hoist-react source** is also checked out locally at `../hoist-react/` and is up-to-date with the version used by this project. When you need to go deeper than the docs — e.g., reading the actual `Persistable` interface, `PersistenceProvider` implementation, or `DashCanvasModel` serialization logic — read the source directly.

   Key docs to read (by doc ID):
   - `desktop/cmp/dash` — Dashboard system: DashContainerModel, DashCanvasModel, DashViewSpec, widget lifecycle. **Start here.**
   - `persistence` — Hoist's persistence system: PersistenceProvider, backing stores, read/write/clear lifecycle.
   - `cmp/viewmanager` — ViewManagerModel: save/load named state bundles, JsonBlob persistence, sharing.
   - `core` — Foundation: HoistModel, component/model conventions, @managed, services.
   - `conventions` — Coding style: imports, naming, class structure, component patterns, exports.
   - `lifecycle-models-and-services` — Model/service lifecycles, load/refresh patterns.
   - `cmp/layout` — Flexbox layout containers (relevant to dashboard arrangement).

   Key source files to read directly:
   - `../hoist-react/core/persist/Persistable.ts` — the `Persistable` interface and `PersistableState` class.
   - `../hoist-react/core/persist/PersistenceProvider.ts` — how persistence reads/writes/binds to models.
   - `../hoist-react/desktop/cmp/dash/canvas/DashCanvasModel.ts` — how the dashboard serializes its state graph.

2. **Dashboard-as-DSL.** The "DSL" is **not** a new format — it is Hoist's native persisted state. Hoist already has deep, nested persistence: `DashCanvasModel` serializes its layout and views via `getPersistableState()`, each view carries nested state from its own model hierarchy, and those models in turn persist their children (grids persist column config, charts persist series selection, etc.). This entire JSON graph is already produced and consumed by real Hoist code. **We use it as-is.**

   The innovation is a **meta-layer** — a machine-readable description of what that persisted state graph *looks like* for each widget type. This is what the LLM needs: not a new spec format, but a schema that says "for a widget of type `forecastChart`, the persisted state has shape `{series: string[], chartType: 'line'|'bar', ...}`" etc. Without this, the LLM can't produce valid state.

   **The ambition** is to derive this meta-layer by introspecting the existing persistence machinery. Models already implement the `Persistable` interface (`getPersistableState()` / `setPersistableState()`). Properties are decorated with `@bindable` and `@managed`. If we can walk the model hierarchy and its persistence annotations, we can auto-generate an accurate schema for each widget type. Study how `PersistableState`, `PersistenceProvider`, and the `persistWith` config work — the hooks for introspection may already exist.

   **The pragmatic starting point** is a manually maintained schema per widget type — each widget declares the shape of its persistable state via a structured object or JSON Schema fragment. This is fine initially and may be the right long-term answer for the subset of state that's meant to be LLM-authored (not all persistable state needs to be exposed). The key is designing the interface cleanly enough that it *could* be auto-generated later.

   Don't let this drive excessive complexity. A hard-coded schema that accurately describes the current widget set's persistable state is a perfectly valid deliverable. But the plan should identify where auto-generation could plug in.

3. **Inter-widget wiring.** This is the primary technical goal after the DSL itself. Widgets must be composable: some emit values (e.g., selected city), others consume them via explicit bindings. This wiring must be part of persisted state. The widget set exists to *serve* the wiring story — every widget should justify itself by enabling interesting, plausible compositions. Think about multiplicity (one city chooser driving five display widgets), specificity (a units widget narrowing what a chart shows), and small multiples (two instances of the same widget type, each bound to a different city).

4. **Compelling widget set.** The widget count matters less than the *compositional range*. We don't need a dozen widgets — we need a set where every type enables interesting interrelations with others using the data we have available. Add or refine widgets where they create new wiring possibilities; don't add widgets just to pad the catalog. The planning agent is free to use its imagination here, but should avoid elaborate technology integrations (e.g., deep map APIs) that distract from the core story. Widget development is a **parallel workstream** to the schema/wiring/LLM pipeline — it can proceed incrementally without blocking the primary goals.

5. **Two harnesses:**
   - **JSON harness** — a text editor panel that can view/edit the full dashboard spec JSON, validate it, and hydrate it into a live dashboard.
   - **LLM harness** — an embedded chat UI that takes natural-language requests and produces updated dashboard specs iteratively, then applies them.

6. **End-to-end LLM pipeline (tracer bullet).** The JSON harness alone is valuable — a human can copy specs back and forth between an LLM and the dashboard. But the real win is a deployed, working pipeline: user types a request → server proxies to an LLM provider → response validates and hydrates into a live dashboard. This is what makes the demo a success. Plan for this end-to-end path from the start, even if it's wired up last.

---

## Non-goals / guardrails

- Do not chase realtime/push messaging as a core theme. Periodic refresh is secondary.
- Do not build a bespoke widget framework unrelated to Hoist. Extend/compose Hoist dashboard conventions.
- Do not allow unbounded code execution via LLM. The LLM outputs JSON specs only, validated against schema.
- Keep scope ambitious but demo-shippable. A coherent, polished V2 beats a sprawling science fair.
- Do not modify V1. It stays as-is for A/B comparison.

---

## Additional resources

- **Jobsite sample app** — checked out locally at `../jobsite/`. This is a strong reference for widget design and formulation patterns in a real Hoist app. Study its dashboard and component architecture when planning V2 widgets.
- **Local Toolbox instance** — Toolbox is running locally and viewable in Chrome. Use browser automation tools to inspect the running V1 weather app, test changes, and verify behavior. Refresh as needed.
- **hoist-react source** — at `../hoist-react/`, up-to-date. Read source directly when docs aren't enough.
- **hoist-core docs** — at `../hoist-core/docs/`. Consult before planning any Grails server-side work.

---

## Operating mode

**Work autonomously.** Research, plan, formulate, reformulate, test, and polish a full implementation plan independently. Then proceed to execution.

- **Checkpoint frequently.** Commit work-in-progress to this branch as often as needed — it's been set up for you. Use commits as save points.
- **Keep a progress log.** Write a `docs/planning/weather-v2/PROGRESS.md` file and update it as you complete tasks, hit decisions, or change direction. This is your running journal.
- **Proceed to execution.** Once the plan is solid, begin implementing. Don't wait for approval — the plan documents are the contract. If you hit a genuine ambiguity that could go badly either way, note it in the progress log and make your best call.
- **This is an AI technology excellence demo in every respect.** The quality of the planning, the code, and the autonomous execution are all part of what we're showing off. Go for it.

---

## Planning agent tasks

### 1) Read + assimilate Hoist patterns (mandatory first step)

Use the **hoist-react MCP server** (see objective #1 above for tool names). Read documentation for:
- Dashboard components and widget patterns (`desktop/cmp/dash`)
- State persistence / serialization / hydration (`persistence`)
- Model organization, MobX usage, component conventions (`core`, `conventions`)
- View management (`cmp/viewmanager`)
- Existing example apps in this repo, especially the V1 weather app (see file paths in Context above)

Identify "house style" expectations: file layout, naming, class patterns, validation approaches, how Hoist thinks about models/views/stores.

**Deliverable:** a short "Hoist conventions checklist" the implementation will follow (used as a rubric during development).

---

### 2) Document and schematize the existing persistence format

The DSL is Hoist's native persisted state — not a new format. The task here is to **understand, document, and schematize** what the existing persistence machinery already produces.

**Start by studying the actual persistence output:**
- `DashCanvasModel` implements `Persistable` and serializes to `PersistableState<{state: DashCanvasItemState[]}>`. Each item in that array represents a widget instance with layout coordinates and a nested `state` object from the widget's own model.
- Widget models (e.g., V1's `TempForecastModel`) may themselves contain `ChartModel`, `GridModel`, etc., each with their own persistable state.
- Read the `persistence` doc via MCP. Read the `Persistable` interface and `PersistenceProvider` source in `../hoist-react/core/persist/`. Examine how V1's `WeatherDashModel` uses `persistWith` today.

**Produce:**
- A documented description of the persisted state shape for the V2 dashboard — what `DashCanvasModel.getPersistableState()` returns, what each widget's nested state looks like, and how the full JSON graph is structured.
- A formal JSON Schema (or equivalent) for this state, at least for the top-level dashboard structure and the per-widget-type state shapes.
- A semantic validation layer for things schema can't catch (e.g., references to widget IDs that don't exist, cycles in wiring, incompatible types).
- A versioning/migration approach for the persisted state (even if only v1 → v2). This matters for "persisted state as product."

The goal: a human with a JSON editor, or an LLM with the schema, should be able to author valid persisted state that `DashCanvasModel.setPersistableState()` will accept and hydrate into a working dashboard.

---

### 3) Design the widget schema interface

Each widget type needs a structured, machine-readable description of its configuration surface — the **widget schema**. This is what the LLM consumes to produce valid specs, and what the JSON harness validates against.

**What it must describe per widget type:**
- Widget type name (string literal).
- Configurable properties: name, type, constraints (enums, ranges, required vs optional), defaults.
- Input bindings the widget accepts (name, expected type, default-when-unbound).
- Output values the widget emits (name, type).
- Any display modes or layout hints.

**Design the interface itself** — how does a widget declare this? Options include:
- A static `configSchema` property on the widget model class (a structured object or JSON Schema fragment).
- A TypeScript interface per widget type, with a convention for extracting it.
- A registry that maps widget type names to schema definitions.

**Starting point:** a manually maintained schema per widget is fine. Each widget declares its own interface as a structured object. This is the V1 deliverable.

**Stretch goal (plan for, don't over-build):** auto-generation by introspecting Hoist's persistence graph. Hoist models already declare persistable state — dashboards, grids, charts, forms all have serialization boundaries. If the widget schema could be derived from these declarations (or a curated subset), it would stay accurate automatically as widgets evolve. Identify where this could plug in and what Hoist extension points would enable it, but don't let it block the initial implementation.

**Deliverable:** the widget schema interface design, with at least 2-3 example widget schemas showing the full range (a simple input widget, a complex chart widget, a meta/inspector widget).

---

### 4) Design the widget IO/wiring model

This is core to the demo. We want a clean, not-too-clever formalism that's easy to understand and easy for an LLM to generate correctly.

**Required capabilities:**
- Widgets can **emit outputs** with a stable name (e.g., `selectedCity`), a type (e.g., `CityId | string | number | DateRange`), and optional metadata (label, description).
- Widgets can **declare inputs** they accept, with type constraints and default-value behavior when unbound.
- In persisted state, a widget can **bind an input** to:
  - Another widget's output: `{fromWidgetId, outputName}`
  - A constant literal: `{const: ...}`
  - Optionally a "dashboard variable" (if you introduce global vars)

**Constraints:**
- Validate that bindings refer to existing widget IDs + output names.
- Validate type compatibility.
- Prevent cycles (start with "no cycles"; define explicit support later if needed).
- Runtime resolution via a dependency graph where upstream changes propagate to downstream widgets. Must be MobX-friendly and Hoist-idiomatic.

Note: V1 has no wiring — `selectedCity` is a single value on `WeatherDashModel` that all widgets read directly. V2 replaces this with the general IO model above.

**Deliverable:** a crisp "Widget IO Spec" section in the plan, with example JSON fragments.

---

### 5) Widget set: compositional range over raw count

V1 has six widgets (current conditions, temp forecast, precip forecast, wind, humidity/pressure, 5-day summary). V2's widget set should be driven by **compositional range**, not raw count.

**Guiding principles:**
- Every widget must justify itself by enabling interesting wiring relationships with other widgets.
- Each widget should have a few clear config knobs, optional display modes, and thoughtful defaults so the LLM can succeed without specifying everything.
- Think about the compositions: one input widget driving many display widgets, small multiples (same widget type bound to different inputs), cascading filters, side-by-side comparisons.
- Avoid elaborate technology integrations (deep map APIs, complex third-party libraries) that distract from the core schema/wiring story.
- Widget development is a **parallel workstream** — it can proceed incrementally without blocking the DSL spec, wiring model, or harness work.

**Suggested widget types** (use your judgment — add, remove, or recombine):

*Input/control widgets (emit values that drive other widgets):*
- **City Chooser:** emits `selectedCity`. Config: allowed cities list, default city, search/filter UI, display style.
- **Date Range Chooser:** emits `dateRange`. Config: preset ranges, min/max, granularity.
- **Units / Preferences:** emits `units` (metric|imperial), maybe time format.

*Display widgets (consume inputs, render data):*
- **Current Conditions card:** config: visible fields, compact vs detailed, icon style.
- **Forecast chart:** config: hours vs days, series selection (temp/precip/wind), chart type.
- **Precipitation detail:** config: accumulation vs probability, time bucket, threshold highlights.
- **Wind widget:** config: gusts vs sustained, direction rose vs numeric.

*Stretch / high-demo-value widgets:*
- **Markdown content widget:** renders arbitrary markdown via Hoist's `RenderedMarkdown` component (see Toolbox docs examples for usage). Useful as a generic display surface — static content, instructions, annotations. A good building block for compositions.
- **LLM-generated forecast summary:** a widget that calls an LLM to produce a natural-language weather analysis from the current data. This is a **technology stretch goal** — distinct from the dashboard-designer LLM harness. It would make the demo significantly more compelling ("the LLM doesn't just *build* the dashboard, it *fills in* content too"). Fine to stub initially with a template, but plan the architecture for a real LLM call.
- **Debug / Inspector widget:** shows resolved inputs/outputs + wiring graph for the current dashboard. Makes the IO story legible to humans and customers during demos.

**Deliverable:** a widget catalog (table): type, purpose, inputs, outputs, config keys, default behavior.

---

### 6) JSON harness UI (manual editing → live hydration)

A page that makes the DSL tangible.

**Required UX:**
- A JSON editor panel with syntax highlighting, formatting, and validation feedback.
- Schema validation errors shown with paths (e.g., `widgets[3].config.foo`).
- An "Apply" control (or auto-apply with debounce, but only if stable).
- On apply: validate → if valid, hydrate dashboard; if invalid, keep last known-good config and show errors.

**Additional must-haves:**
- "Load example specs" dropdown — several curated examples demonstrating wiring + layout.
- "Export current spec" button (copy/download).
- "Snapshot" concept: capture current dashboard state/spec as a named sample.

**Deliverable:** planned UI layout + interaction flow.

---

### 7) LLM harness UI (chat → JSON spec → live dashboard)

The headline demo: "Describe a dashboard; agent builds it."

**Phased delivery:**
- **Phase A (unblocked):** The JSON harness (task #6) ships first. With it, a human can act as the relay — copy the current spec into an external LLM, describe changes in natural language, paste the result back, and apply it. This is immediately useful for validating the schema and prompt strategy without any server-side LLM integration.
- **Phase B (requires LLM integration):** The in-app chat harness connects to an LLM backend — either client-side with a local API key or via a Grails proxy (see task #10 for the decision). The user types a request, the LLM responds with a spec/patch, the app validates and applies it. This is the real demo.

Design the chat UI and prompt protocol now (Phase B), but recognize that Phase A is the unblocked path for early validation.

**Functional requirements:**
- Embedded chat panel in-app.
- The assistant receives: the **widget schema** (see objective #2 and task #3 — the structured description of all available widget types, their configs, and IO bindings), the current dashboard spec (if iterating), and clear instructions to output only JSON spec (or JSON patch) in a machine-parseable format. The quality of this schema directly determines the LLM's accuracy — it's the most important input to the system prompt.
- The assistant returns: either a full dashboard spec or a patch/diff to apply to the current spec.
- The app: validates output → applies if valid → if invalid, shows errors and optionally asks the assistant to repair.

**Strong recommendation — incremental edit protocol:**
- Maintain a "current spec."
- Ask the LLM for a patch-like result (JSON Patch, or a simple `{op, path, value}` list).
- Apply patch → validate → commit.
- This reduces failure rate and supports iterative conversation.

**Safety/robustness:**
- Hard validation gate: invalid specs never hydrate.
- Rate limiting / token limits / timeouts (enforced server-side via the proxy).
- Clear system prompt boundaries: no code execution, no network calls via LLM output.
- Logging: capture prompts + outputs for debugging (sanitized).

**Deliverable:** proposed chat protocol, prompt strategy, and application flow.

---

### 8) Backend / data model

The weather data is the vehicle, not the destination. The demo's success hinges on widget composition, state serialization, and LLM integration — not on rich meteorological data. Even simple weather data is sufficient to tell that story and exercise all the interesting technical challenges.

**Design for data-source independence.** Weather is the first domain, but a likely follow-up is swapping the data layer for financial/marketplace data while keeping the core (persistence, wiring, LLM integration) intact. The widget data contract should be clean enough that this kind of swap is straightforward — widgets consume a typed data interface, not raw API responses.

**Starting point:** V1's `WeatherService.groovy` calls OpenWeatherMap's free tier (`/data/2.5/weather` and `/data/2.5/forecast`) with caching (10 min current, 30 min forecast). `WeatherController.groovy` exposes `weather/current` and `weather/forecast`. Response types are defined in `Types.ts` on the client.

**Constraints and guidance:**
- Stay on the **OpenWeatherMap free tier** for now. The free `/forecast` endpoint returns 5-day/3-hour data — enough to populate charts, grids, and condition displays. If research turns up a low-cost paid option that meaningfully improves the demo, flag it, but don't depend on it.
- Derive what you can from the existing data: daily highs/lows, feels-like, precipitation accumulation can all be computed client-side or server-side from the 3-hour forecast intervals.
- A **normalized, typed data contract** that widgets consume (not raw API passthrough) will make the eventual domain swap cleaner.

**Deterministic mock mode:** consider a stable dataset option so LLM-driven layouts aren't confounded by flaky API responses or changing weather. Useful for demos and testing.

Remember: changes to `WeatherService` and `WeatherController` affect both V1 and V2. Extend additively — don't break V1's existing endpoints.

**Deliverable:** a proposed data contract used by widgets (typed), and which endpoints supply it.

---

### 9) Persistence story (Hoist-native)

This demo only works if it uses Hoist persistence patterns convincingly.

**Starting point:** V1 uses `DashCanvasModel` with `persistWith: {viewManagerModel}`, backed by localStorage. Read the `persistence` and `cmp/viewmanager` docs via MCP to understand the full machinery before designing V2's approach.

**Decide:**
- What is persisted? The entire spec? Spec + derived runtime state? Per-user vs shared named dashboards?
- How does the DSL spec map to Hoist's existing persistence model? Is the spec *the* persisted state, or a layer above it?
- Migration story: how we evolve spec versions safely.
- "View manager / save views" angle: V1 already uses ViewManagerModel — does V2 deepen this, or does the DSL spec replace it?

**Deliverable:** persistence architecture section with concrete state boundaries.

---

### 10) LLM provider integration + deployment (customer-trial-ready)

This is the tracer bullet that makes the demo real. Research and recommend an approach with clear rationale.

**Strong preference: keep this client-side if possible.** In an ideal world, the LLM integration is purely a TypeScript/client-side concern — no Grails changes needed. This would make the project simpler, faster to iterate on, and easier for other developers to run locally. Evaluate whether a client-side-only approach is viable, e.g.:
- Client-side LLM SDK calls with a user-provided or locally-configured API key (fine for internal POC / local dev).
- A lightweight browser-based key management scheme (e.g., user pastes their own key, stored in localStorage — acceptable for a dev-facing POC, not for production).

**For deployed Toolbox:** Toolbox is on the public internet, requires registration, but is low-volume — the audience is limited to trusted clients, interested customers, and candidates. It is not a high-abuse-risk environment, but API keys still shouldn't be shipped in the client bundle. If a server-side proxy is needed for production, the Toolbox **Grails backend** is available. Adding a new controller + service to relay LLM calls is a natural fit.

Before planning any server-side work, consult the **hoist-core documentation** at `../hoist-core/docs/`:
- `http-client.md` — Hoist's server-side HTTP client (for making outbound calls to LLM APIs).
- `request-flow.md` — How requests flow through the Hoist server stack.
- `configuration.md` — Hoist Config system (for storing API keys, model selection, rate limits).
- `authentication.md` / `authorization.md` — How Toolbox authenticates users (relevant for per-user rate limiting).

**Questions to answer:**
- Which LLM provider(s) to support? (Anthropic, OpenAI, etc.) Recommend a primary + a fallback.
- Can we keep it client-side only? What are the tradeoffs vs a Grails proxy?
- API key management: for local POC, a user-provided key is fine. For deployed Toolbox, where does the key live? Hoist Config? Environment variable?
- Rate limiting / cost controls: given the low-volume, trusted audience, how lightweight can this be?
- Latency budget: what's acceptable for a chat-style interaction?

**Phasing:**
1. **JSON harness (unblocked):** a human relays specs between an external LLM and the dashboard manually. Validates the schema and prompt strategy with zero integration work.
2. **Client-side POC:** wire up LLM calls directly from TypeScript with a locally-configured API key. Good enough for internal demos and developer walkthroughs.
3. **Deployed proxy (if needed):** Grails controller + service for production Toolbox. Only build this if client-side-only isn't viable for the deployed environment.

**Deliverable:** a decision memo — recommended LLM provider, client-side vs server-side architecture decision with rationale, key management approach, and implementation plan for whichever path is chosen.

---

## Output requirements

### Where to write

Write all planning output to **`docs/planning/weather-v2/`** — the same directory as this prompt. Use separate files for distinct artifacts so they're easy to navigate and reference during implementation.

### Required files

1. **`PLAN.md`** — The master plan. Implementation phases with milestones, dependencies, and sequencing. (e.g., V2 scaffolding → DSL spec → widgets → wiring → JSON harness → LLM harness → polish.) Include the V2 project scaffolding (new directory, entry point, nav registration) as the first phase. This is the primary deliverable — it should be detailed enough that an implementation agent can pick up any phase and execute it.

2. **`ROADMAP.md`** — A concise phase-by-phase overview with estimated scope and key decision points. Higher-level than the plan — useful for stakeholder communication and progress tracking.

3. **`TASKS.md`** — A structured task list / checklist derived from the plan. Organized by phase, with clear done-criteria for each task. This is the day-to-day execution tracking artifact.

4. **`WIDGET-CATALOG.md`** — The widget catalog: type, purpose, inputs, outputs, config keys, default behavior. Include at least 5 example widget JSON fragments.

5. **`WIDGET-SCHEMA.md`** — The widget schema interface design: how widgets declare their configuration surface, example schemas for 2-3 widget types across the complexity range, and a discussion of the auto-generation stretch goal (what Hoist extension points would enable it, what a manually maintained version looks like in the meantime).

6. **`DSL-SPEC.md`** — The dashboard spec schema (formal JSON Schema or equivalent), validation strategy, migration/versioning approach, and example full dashboard specs.

7. **`WIRING-DESIGN.md`** — Inter-widget IO/wiring design: the formalism, runtime propagation model, validation rules, and example JSON fragments.

8. **`RISKS.md`** — Risk list with mitigations (LLM invalid output rates, schema drift, wiring complexity, UI confusion, etc.).

9. **`DEMO-SCRIPTS.md`** — 3–5 "customer wow" scenarios written as exact chat prompts + expected resulting dashboards.

10. **`DEPLOYMENT-MEMO.md`** — Deployment research memo with 2–3 viable options, pros/cons, and recommended path.

Additional files are fine if they help organize the output (e.g., a Hoist conventions checklist, UI wireframe descriptions). Use your judgment.

**Planning style:** Be opinionated. Where there are multiple valid approaches, pick one, justify it briefly, and move on. Do not leave decisions open-ended or hedge with "we could also..." alternatives unless there is a genuine tradeoff the implementer needs to decide at build time.
