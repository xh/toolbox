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

### Beginning Execution — Phase 1

Moving to implementation. Starting with Phase 1 (V2 Scaffolding).
