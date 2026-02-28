# Risk Register — Weather Dashboard V2

## High Priority

### R1: LLM Produces Invalid Specs

**Risk:** The LLM generates JSON that fails validation — malformed structure, dangling widget references, invalid config values, layout overlaps.

**Likelihood:** High (expected during initial development, moderate in production).

**Impact:** Dashboard fails to hydrate. User sees error instead of result.

**Mitigations:**
- Hard validation gate — invalid specs never reach `setPersistableState()`.
- Detailed error messages with JSON paths guide the LLM (or human) to fix issues.
- System prompt includes the full JSON Schema and explicit examples.
- LLM repair loop: on validation failure, send errors back to the LLM with "fix this" instruction (max 2 retries).
- Full-spec replacement (not patches) — easier for the LLM to get right.
- Fallback: the JSON harness always works for manual editing.

### R2: Wiring Complexity Confuses Users

**Risk:** The binding model (fromWidget/output references, instance IDs) is too abstract for non-technical users or for LLMs to handle reliably with many widgets.

**Likelihood:** Medium.

**Impact:** Users can't build interesting dashboards; the demo falls flat.

**Mitigations:**
- Keep the widget set small (9 types) with clear input/output contracts.
- Provide 3-5 curated example specs that users can start from and modify.
- The Dashboard Inspector widget makes bindings visible and debuggable.
- LLM harness abstracts wiring — users say "show me New York weather" not "bind city input to cityChooser output."
- Design sensible defaults — display widgets work with no bindings (using default city).

### R3: DashCanvasModel Instance ID Instability

**Risk:** DashCanvasModel generates instance IDs based on widget order. If the LLM reorders widgets in a spec update, IDs shift and bindings break silently.

**Likelihood:** Medium.

**Impact:** Bindings reference wrong widgets or become dangling. Dashboard behaves unexpectedly.

**Mitigations:**
- System prompt instructs the LLM to maintain widget order when editing.
- Validation catches dangling references before hydration.
- Consider a pre-processing step that assigns stable IDs from widget titles or explicit labels (stretch goal).
- Document the ID assignment rule clearly in the LLM prompt.

## Medium Priority

### R4: Schema Drift Between Widget Code and Meta

**Risk:** Widget models evolve (new config properties, changed defaults) but the static `meta` object isn't updated. Schema and reality diverge.

**Likelihood:** Medium (grows over time).

**Impact:** LLM generates specs with stale config options; validation passes but widget ignores unknown config.

**Mitigations:**
- Co-locate `meta` with the widget model class — change the code, update the meta in the same file.
- Add a dev-time test that instantiates each widget and verifies its `meta.config` keys match its actual `@persist`/`@bindable` properties.
- Plan for auto-generation (see WIDGET-SCHEMA.md stretch goal) to eliminate manual sync.

### R5: Performance with Many Widgets

**Risk:** A dashboard with 15+ widgets, each with bindings, creates a dense MobX reaction graph. Changes to a shared output (e.g., city) trigger many simultaneous reloads.

**Likelihood:** Low (typical dashboards have 5-10 widgets).

**Impact:** UI jank, slow response to input changes.

**Mitigations:**
- Data caching: `WeatherDataModel` caches API responses by city. Multiple widgets requesting the same city share one cached response.
- Debounce: Widget reload reactions are debounced (300ms).
- MobX is efficient — computed invalidation is O(1) per dependency edge.
- DashCanvas only renders visible widgets (react-grid-layout handles virtualization for scrolled-out widgets).

### R6: OpenWeatherMap API Limitations

**Risk:** Free tier rate limits (60 calls/min, 1M calls/month) may be hit during demos with many cities. API outages affect the demo.

**Likelihood:** Low (server-side caching mitigates).

**Impact:** Weather data unavailable; display widgets show errors.

**Mitigations:**
- Server-side caching (10 min current, 30 min forecast) — already in V1.
- Extend caching to V2's multi-city pattern: cache per city, not per request.
- Consider a deterministic mock data mode for demo stability (see R7).
- 25 cities × 2 endpoints = 50 unique cache entries — well within free tier.

### R7: Demo Instability from Live Data

**Risk:** Live weather data changes between demo rehearsal and presentation. Dashboard looks different than expected. API returns errors during live demo.

**Likelihood:** Medium.

**Impact:** Demo doesn't match rehearsed script. Embarrassing during customer presentations.

**Mitigations:**
- **Mock data mode:** Server-side flag (Hoist Config `weatherMockMode: boolean`) that returns stable, pre-recorded weather data. Data is realistic and covers interesting conditions (rain, wind, temperature variation).
- Mock data checked into the repo as JSON fixtures.
- Toggle via Admin console — no code change needed to switch.
- Live mode remains the default; mock mode is opt-in for demos.

## Low Priority

### R8: V1/V2 Server-Side Conflicts

**Risk:** Extending `WeatherService.groovy` for V2 (new data formats, additional endpoints) breaks V1's existing endpoints.

**Likelihood:** Low (V2 additions are additive).

**Impact:** V1 stops working, breaking the A/B comparison story.

**Mitigations:**
- New endpoints only — don't modify existing `weather/current` or `weather/forecast`.
- V2 can use the same endpoints (the data shape is sufficient) or add new ones (e.g., `weather/v2/forecast` with normalized output).
- Test V1 after any server changes.

### R9: Persistence Provider Conflicts

**Risk:** V2's wiring data (`bindings` in viewState) interferes with Hoist's persistence providers or causes unexpected behavior when ViewManager saves/loads views.

**Likelihood:** Low. `viewState` is an opaque `PlainObject` — Hoist doesn't inspect its contents.

**Impact:** Saved views lose wiring information or behave differently on reload.

**Mitigations:**
- `bindings` is just another key in `viewState` — treated identically to any other widget state by Hoist's persistence pipeline.
- Test save/load/share cycles explicitly for dashboards with wiring.
- Verify that ViewManager round-trips preserve the full `viewState` including nested `bindings`.

### R10: LLM Cost Overrun

**Risk:** Users (or automated tests) make excessive LLM calls, running up API costs.

**Likelihood:** Low (small, trusted user base).

**Impact:** Unexpected Anthropic API bill.

**Mitigations:**
- Per-user rate limit (20 req/hour) enforced server-side.
- Max tokens capped at 4096 per request.
- Monitor via Anthropic dashboard; set billing alerts.
- API key stored in Hoist Config — can be rotated or disabled instantly via Admin console.
