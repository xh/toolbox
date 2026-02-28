# Demo Scripts — Customer "Wow" Scenarios

These are exact chat prompts for the LLM harness, with expected resulting dashboards. Each demonstrates a key V2 capability.

---

## Demo 1: "Build me a dashboard from scratch"

**Prompt:**
> Build me a weather dashboard for New York. I want to see current conditions, a temperature forecast chart, and precipitation data.

**Expected Result:**

Dashboard with 4 widgets:
- City Chooser (top-left, 3×2) — pre-set to "New York"
- Current Conditions (top-right, 4×5) — bound to city chooser, showing temperature gauge + details
- Forecast Chart (middle-left, 6×5) — bound to city chooser, series: temp + feelsLike, line chart
- Precipitation Chart (middle-right, 6×5) — bound to city chooser, showing probability + volume

All display widgets wired to the city chooser. User can immediately switch cities and see all widgets update.

**What it demonstrates:** LLM understands widget types, creates appropriate bindings, produces valid layout.

---

## Demo 2: "Compare two cities"

**Prompt (starting from Demo 1 result):**
> I want to compare New York and London side by side. Add a second city chooser for London and duplicate the current conditions and forecast chart for the London side.

**Expected Result:**

Dashboard with 7 widgets, organized in two columns:
- Left column: City Chooser A ("New York") + Current Conditions A + Forecast Chart A
- Right column: City Chooser B ("London") + Current Conditions B + Forecast Chart B
- Bottom: Precipitation chart (still bound to City A)

The two City Choosers are independent. Conditions and Forecast widgets in the left column bind to Chooser A; right column binds to Chooser B. Changing either chooser updates only its column.

**What it demonstrates:** Multiple instances of the same widget type, independent binding graphs, small multiples pattern.

---

## Demo 3: "Add units and customize"

**Prompt (starting from Demo 2 result):**
> Add a units toggle set to metric. Connect it to all the display widgets. Also add a title bar that says "Global Weather Comparison Dashboard."

**Expected Result:**

Dashboard gains:
- Units Toggle widget (top center, 3×2) — set to "metric"
- Markdown Content widget (full width at top, 12×2) — renders "# Global Weather Comparison Dashboard"
- All display widgets gain a `units` binding pointing to the Units Toggle
- Temperature values now show in Celsius, wind in m/s

**What it demonstrates:** Iterative editing — LLM modifies existing spec, adds new widgets, updates bindings without breaking existing wiring. Also shows utility widgets (markdown, units toggle).

---

## Demo 4: "Show me the internals"

**Prompt (starting from any dashboard):**
> Add a Dashboard Inspector widget on the right side so I can see how the widgets are wired together.

**Expected Result:**

Dashboard Inspector widget (right column, 4×8) appears showing:
- List of all widget instances with their IDs and types
- For each widget: its input bindings (resolved to current values) and output values
- Validation status (all green if spec is valid)

The inspector updates live as the user interacts — changing city in a chooser shows the new value propagating through bindings.

**What it demonstrates:** The IO/wiring model is transparent and debuggable. Customers can see exactly how data flows through the dashboard.

---

## Demo 5: "The JSON is the API"

**Scenario:** Demo the JSON harness directly — no LLM.

1. **Start with empty dashboard.** Click "Load Example" → select "City Comparison" preset.
2. **Dashboard hydrates** with the two-city comparison layout.
3. **Click "View Spec"** — JSON editor panel shows the full dashboard spec.
4. **Edit the JSON directly:** Change `"selectedCity": "New York"` to `"selectedCity": "Tokyo"`. Click "Apply."
5. **Dashboard updates** — left column now shows Tokyo weather.
6. **Add a widget via JSON:** Copy a `forecastChart` widget instance, paste it with a new layout position and different series config (`["humidity", "pressure"]`). Apply.
7. **New chart appears** in the dashboard showing humidity and pressure data.
8. **Export spec** — click "Copy Spec" to clipboard. This is the full, portable dashboard definition.

**Pitch:** "This JSON spec is the entire dashboard — layout, widgets, configuration, and wiring. Any Hoist application can hydrate it. An LLM can generate it. A human can edit it. It's persisted, shareable, and versioned. This is dashboards as code."

**What it demonstrates:** The spec is tangible, human-readable, and round-trips perfectly between JSON and live dashboard. The JSON harness is useful even without LLM integration.

---

## Presentation Flow (Recommended Order)

1. **Demo 5 first** — establish that the JSON spec is real and tangible.
2. **Demo 1** — show the LLM can build a dashboard from natural language.
3. **Demo 2** — show iterative editing and compositional power.
4. **Demo 3** — show the breadth of widget types and wiring flexibility.
5. **Demo 4** — pull back the curtain on the wiring model.

This progression goes: "here's the format" → "an LLM can write it" → "it handles complex compositions" → "and it's all transparent."
