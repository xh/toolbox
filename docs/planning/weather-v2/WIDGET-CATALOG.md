# Widget Catalog — Weather Dashboard V2

## Summary Table

| # | Type ID | Title | Category | Inputs | Outputs | Key Config | Purpose |
|---|---------|-------|----------|--------|---------|-----------|---------|
| 1 | `cityChooser` | City Chooser | input | — | `selectedCity` (string) | selectedCity, cities, enableSearch | Primary city selection |
| 2 | `unitsToggle` | Units Toggle | input | — | `units` (string) | units | Switch imperial/metric |
| 3 | `currentConditions` | Current Conditions | display | city, units | — | showFeelsLike, showDetails, displayMode | Current temp gauge + conditions |
| 4 | `forecastChart` | Forecast Chart | display | city, units | — | series, chartType, showLegend | Multi-series forecast line chart |
| 5 | `precipChart` | Precipitation | display | city | — | metric, showThresholds | Precip probability + volume |
| 6 | `windChart` | Wind | display | city, units | — | showGusts, chartType | Wind speed/gusts over time |
| 7 | `summaryGrid` | 5-Day Summary | display | city, units | — | visibleColumns | Tabular daily overview |
| 8 | `markdownContent` | Markdown Content | utility | — | — | content | Static rich-text display |
| 9 | `dashInspector` | Dashboard Inspector | utility | — | — | showBindings, showOutputValues | Debug: wiring graph + values |

---

## 1. City Chooser (`cityChooser`)

**Purpose:** Dropdown selector for city. The primary input widget — most display widgets bind their `city` input to this widget's output.

**Outputs:**
- `selectedCity` (string) — The currently selected city name.

**Config:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selectedCity` | string | `"New York"` | Initially selected city |
| `cities` | string[] | *(full default list)* | Available cities. Omit for all 25 defaults |
| `enableSearch` | boolean | `true` | Type-ahead filtering in dropdown |

**Default size:** 3×2 (compact — fits in a sidebar column)

**Wiring examples:**
- Single chooser driving 5 display widgets — the basic dashboard.
- Two choosers side-by-side, each driving its own column of widgets — city comparison.
- Chooser with constrained `cities` list — regional focus.

**Example state:**
```json
{
    "viewSpecId": "cityChooser",
    "layout": {"x": 0, "y": 0, "w": 3, "h": 2},
    "title": "Select City",
    "state": {
        "selectedCity": "San Francisco",
        "cities": ["San Francisco", "Los Angeles", "Seattle", "Portland"]
    }
}
```

---

## 2. Units Toggle (`unitsToggle`)

**Purpose:** Toggle between imperial and metric units. Display widgets that accept a `units` input will adapt their display accordingly.

**Outputs:**
- `units` (string) — `"imperial"` or `"metric"`.

**Config:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `units` | enum | `"imperial"` | Initial unit system. Values: `imperial`, `metric` |

**Default size:** 3×2

**Wiring examples:**
- One toggle driving all display widgets — global unit preference.
- No toggle present — widgets default to imperial.
- Const binding `{"const": "metric"}` — hardcoded unit without a toggle widget.

**Example state:**
```json
{
    "viewSpecId": "unitsToggle",
    "layout": {"x": 9, "y": 0, "w": 3, "h": 2},
    "state": {"units": "metric"}
}
```

---

## 3. Current Conditions (`currentConditions`)

**Purpose:** Current weather snapshot — temperature gauge, conditions icon, description, and key details (feels-like, humidity, wind).

**Inputs:**
| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `city` | string | yes | `"New York"` | City to display |
| `units` | string | no | `"imperial"` | Unit system |

**Config:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showFeelsLike` | boolean | `true` | Show feels-like temperature |
| `showHumidity` | boolean | `true` | Show humidity percentage |
| `showWind` | boolean | `true` | Show wind speed |
| `displayMode` | enum | `"detailed"` | `"detailed"` (gauge + details) or `"compact"` (summary only) |

**Default size:** 4×5

**Example state:**
```json
{
    "viewSpecId": "currentConditions",
    "layout": {"x": 0, "y": 2, "w": 4, "h": 5},
    "state": {
        "bindings": {
            "city": {"fromWidget": "cityChooser", "output": "selectedCity"},
            "units": {"fromWidget": "unitsToggle", "output": "units"}
        },
        "showFeelsLike": true,
        "showHumidity": true,
        "displayMode": "detailed"
    }
}
```

---

## 4. Forecast Chart (`forecastChart`)

**Purpose:** Multi-series line/area/column chart showing forecast data over the 5-day window. The primary charting widget — highly configurable series selection and chart types.

**Inputs:**
| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `city` | string | yes | `"New York"` | City to show forecast for |
| `units` | string | no | `"imperial"` | Unit system |

**Config:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `series` | string[] | `["temp", "feelsLike"]` | Series to show. Options: `temp`, `feelsLike`, `humidity`, `pressure` |
| `chartType` | enum | `"line"` | `"line"`, `"area"`, `"column"` |
| `showLegend` | boolean | `true` | Show chart legend |
| `showTooltip` | boolean | `true` | Show tooltips on hover |

**Default size:** 8×5

**Wiring examples:**
- Bound to city chooser — standard forecast view.
- Two instances side-by-side, each bound to a different city — comparison.
- Configured with `series: ["humidity", "pressure"]` — repurposed as humidity/pressure chart.

**Example state:**
```json
{
    "viewSpecId": "forecastChart",
    "layout": {"x": 4, "y": 0, "w": 8, "h": 5},
    "state": {
        "bindings": {
            "city": {"fromWidget": "cityChooser", "output": "selectedCity"},
            "units": {"fromWidget": "unitsToggle", "output": "units"}
        },
        "series": ["temp", "feelsLike"],
        "chartType": "line",
        "showLegend": true
    }
}
```

---

## 5. Precipitation Chart (`precipChart`)

**Purpose:** Precipitation probability and/or volume over the forecast period. Dual-axis column chart.

**Inputs:**
| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `city` | string | yes | `"New York"` | City to show precipitation for |

**Config:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `metric` | enum | `"both"` | `"probability"`, `"volume"`, `"both"` |
| `showThresholds` | boolean | `false` | Highlight high-probability periods |

**Default size:** 6×5

**Example state:**
```json
{
    "viewSpecId": "precipChart",
    "layout": {"x": 0, "y": 5, "w": 6, "h": 5},
    "state": {
        "bindings": {
            "city": {"fromWidget": "cityChooser", "output": "selectedCity"}
        },
        "metric": "both",
        "showThresholds": true
    }
}
```

---

## 6. Wind Chart (`windChart`)

**Purpose:** Wind speed and gusts over the forecast period.

**Inputs:**
| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `city` | string | yes | `"New York"` | City to show wind data for |
| `units` | string | no | `"imperial"` | Unit system (mph vs m/s) |

**Config:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showGusts` | boolean | `true` | Show gust data alongside sustained |
| `chartType` | enum | `"line"` | `"line"`, `"area"` |

**Default size:** 6×5

**Example state:**
```json
{
    "viewSpecId": "windChart",
    "layout": {"x": 6, "y": 5, "w": 6, "h": 5},
    "state": {
        "bindings": {
            "city": {"fromWidget": "cityChooser", "output": "selectedCity"},
            "units": {"fromWidget": "unitsToggle", "output": "units"}
        },
        "showGusts": true,
        "chartType": "line"
    }
}
```

---

## 7. 5-Day Summary Grid (`summaryGrid`)

**Purpose:** Tabular daily overview — one row per day with high/low, conditions, humidity, wind.

**Inputs:**
| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `city` | string | yes | `"New York"` | City to summarize |
| `units` | string | no | `"imperial"` | Unit system |

**Config:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visibleColumns` | string[] | `["date","icon","conditions","high","low","humidity","wind"]` | Columns to display |

**Default size:** 6×5

**Example state:**
```json
{
    "viewSpecId": "summaryGrid",
    "layout": {"x": 0, "y": 10, "w": 12, "h": 5},
    "state": {
        "bindings": {
            "city": {"fromWidget": "cityChooser", "output": "selectedCity"},
            "units": {"fromWidget": "unitsToggle", "output": "units"}
        },
        "visibleColumns": ["date", "conditions", "high", "low"]
    }
}
```

---

## 8. Markdown Content (`markdownContent`)

**Purpose:** Static rich-text display using Hoist's Markdown renderer. Useful for dashboard titles, instructions, annotations, or any static content. No data inputs — purely content-driven.

**Config:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | string | `"# Welcome\nEdit this widget's content."` | Markdown text to render |

**Default size:** 4×3

**Wiring examples:**
- Dashboard header with title and instructions.
- Annotation panel explaining what the dashboard shows.
- Placeholder for LLM-generated content (static initially, could be dynamic later).

**Example state:**
```json
{
    "viewSpecId": "markdownContent",
    "layout": {"x": 0, "y": 0, "w": 12, "h": 2},
    "state": {
        "content": "## Weather Comparison Dashboard\nComparing current conditions and forecasts between two cities. Use the city selectors to change locations."
    }
}
```

---

## 9. Dashboard Inspector (`dashInspector`)

**Purpose:** Debug/demo utility that visualizes the wiring graph, shows resolved input/output values, and displays validation status. Makes the IO story visible and legible during demos.

**Config:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showBindings` | boolean | `true` | Show binding details per widget |
| `showOutputValues` | boolean | `true` | Show current output values |
| `showValidation` | boolean | `true` | Show validation errors/warnings |
| `compactMode` | boolean | `false` | Compact single-line display |

**Default size:** 4×6

**Implementation notes:**
- Reads from `WiringModel` outputs map and `DashCanvasModel` view state.
- Uses a simple tree/list display — not a visual graph (keep it implementable).
- Shows each widget: ID, type, bound inputs (resolved values), published outputs (current values), validation status.
- Updates reactively as bindings and values change.

**Example state:**
```json
{
    "viewSpecId": "dashInspector",
    "layout": {"x": 8, "y": 0, "w": 4, "h": 10},
    "state": {
        "showBindings": true,
        "showOutputValues": true,
        "showValidation": true
    }
}
```

---

## Compositional Range

The 9-widget set enables these key compositions:

| Composition | Widgets Used | What It Demonstrates |
|-------------|-------------|---------------------|
| **Basic weather dashboard** | 1 city chooser + 5 display widgets | Single input driving multiple outputs |
| **City comparison** | 2 city choosers + 2×(conditions + forecast) | Small multiples, independent bindings |
| **Metric/imperial toggle** | Units toggle + all display widgets | Global preference via shared binding |
| **Focused views** | Chooser + single chart (configured differently) | Config knobs change widget behavior |
| **Annotated dashboard** | Markdown + display widgets | Static content alongside live data |
| **Debuggable dashboard** | Any layout + inspector | Wiring visibility for demos |
| **Constant bindings** | Display widgets with `const` bindings | No input widgets needed, static city |
