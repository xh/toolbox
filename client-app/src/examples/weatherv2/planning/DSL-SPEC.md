# Dashboard Spec Schema (DSL)

## Core Principle

The V2 "DSL" is **Hoist's native persisted state** — the JSON produced by `DashCanvasModel.getPersistableState()`. We don't invent a new format. We document the existing format, add wiring conventions to widget `viewState`, and provide a JSON Schema for validation.

## State Structure

`DashCanvasModel` persists as:

```typescript
PersistableState<{state: DashCanvasItemState[]}>
```

Each item in the `state` array represents a widget instance:

```typescript
interface DashCanvasItemState {
    viewSpecId: string;               // Widget type (maps to viewSpec.id)
    layout: {x: number; y: number; w: number; h: number};  // Grid position
    title?: string;                   // Custom display title (overrides viewSpec.title)
    state?: Record<string, any>;      // Widget-specific persisted state
}
```

The V2 addition: widget `state` objects follow a convention where `bindings` is a reserved key for input wiring (see WIRING-DESIGN.md). All other keys are widget-specific config.

## Full Dashboard Spec Shape

```json
{
    "state": [
        {
            "viewSpecId": "cityChooser",
            "layout": {"x": 0, "y": 0, "w": 3, "h": 2},
            "title": "Select City",
            "state": {
                "selectedCity": "New York",
                "enableSearch": true
            }
        },
        {
            "viewSpecId": "forecastChart",
            "layout": {"x": 3, "y": 0, "w": 9, "h": 5},
            "title": "Temperature Forecast",
            "state": {
                "bindings": {
                    "city": {"fromWidget": "cityChooser", "output": "selectedCity"},
                    "units": {"const": "imperial"}
                },
                "series": ["temp", "feelsLike"],
                "chartType": "line"
            }
        }
    ]
}
```

## JSON Schema

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "WeatherDashboardV2Spec",
    "description": "Dashboard specification for Weather Dashboard V2. This is the persisted state format for DashCanvasModel.",
    "type": "object",
    "required": ["state"],
    "additionalProperties": false,
    "properties": {
        "version": {
            "type": "integer",
            "description": "Spec version number for migration support.",
            "default": 1,
            "const": 1
        },
        "state": {
            "type": "array",
            "description": "Array of widget instances with their layout and configuration.",
            "items": {"$ref": "#/$defs/widgetInstance"}
        }
    },
    "$defs": {
        "widgetInstance": {
            "type": "object",
            "required": ["viewSpecId", "layout"],
            "additionalProperties": false,
            "properties": {
                "viewSpecId": {
                    "type": "string",
                    "enum": [
                        "cityChooser", "unitsToggle", "currentConditions",
                        "forecastChart", "precipChart", "windChart",
                        "summaryGrid", "markdownContent", "dashInspector"
                    ],
                    "description": "Widget type identifier."
                },
                "layout": {"$ref": "#/$defs/layout"},
                "title": {
                    "type": "string",
                    "description": "Custom display title. Overrides the widget type's default title."
                },
                "state": {
                    "type": "object",
                    "description": "Widget-specific configuration and bindings.",
                    "properties": {
                        "bindings": {"$ref": "#/$defs/bindingsMap"}
                    },
                    "additionalProperties": true
                }
            }
        },
        "layout": {
            "type": "object",
            "required": ["x", "y", "w", "h"],
            "additionalProperties": false,
            "properties": {
                "x": {"type": "integer", "minimum": 0, "maximum": 11, "description": "Column position (0-indexed, max 11 for 12-col grid)."},
                "y": {"type": "integer", "minimum": 0, "description": "Row position (0-indexed)."},
                "w": {"type": "integer", "minimum": 1, "maximum": 12, "description": "Width in columns."},
                "h": {"type": "integer", "minimum": 1, "description": "Height in rows."}
            }
        },
        "bindingsMap": {
            "type": "object",
            "description": "Map of input name → binding spec. Keys are input names declared by the widget type.",
            "additionalProperties": {"$ref": "#/$defs/bindingSpec"}
        },
        "bindingSpec": {
            "oneOf": [
                {
                    "type": "object",
                    "required": ["fromWidget", "output"],
                    "additionalProperties": false,
                    "properties": {
                        "fromWidget": {"type": "string", "description": "Instance ID of the source widget."},
                        "output": {"type": "string", "description": "Name of the output on the source widget."}
                    },
                    "description": "Bind to another widget's output."
                },
                {
                    "type": "object",
                    "required": ["const"],
                    "additionalProperties": false,
                    "properties": {
                        "const": {"description": "A constant literal value."}
                    },
                    "description": "Bind to a constant value."
                }
            ]
        }
    }
}
```

## Widget Instance ID Assignment

`DashCanvasModel` assigns instance IDs automatically when loading state: the first instance of a viewSpec gets `viewSpecId` as its ID, subsequent instances get `viewSpecId_2`, `viewSpecId_3`, etc.

This means **binding references use these generated IDs**. For a spec with two `cityChooser` instances:
- First: ID = `"cityChooser"`
- Second: ID = `"cityChooser_2"`

Bindings in other widgets use these IDs: `{"fromWidget": "cityChooser_2", "output": "selectedCity"}`.

**For LLM authoring:** The LLM must understand this ID assignment rule. The system prompt will explain: "Widget instance IDs are assigned in order of appearance in the `state` array. The first instance of type X gets ID `X`, the second gets `X_2`, etc. Use these IDs in bindings."

## Validation Pipeline

Validation runs in three stages before a spec is hydrated:

### Stage 1: Structural (JSON Schema)

Standard JSON Schema validation against the schema above. Catches:
- Missing required fields (`viewSpecId`, `layout`).
- Invalid `viewSpecId` values.
- Layout values out of bounds.
- Malformed binding specs.

**Tool:** Use a JSON Schema validator library (e.g., `ajv`).

### Stage 2: Semantic (Custom Validation)

Post-schema checks that require knowledge of widget types:

1. **Layout overlap detection.** Two widgets occupying the same grid cells. (Warning, not error — DashCanvas handles overlap via compaction.)
2. **Layout bounds.** Widget extends beyond column 12 (`x + w > 12`). (Error.)
3. **Config property validation.** For each widget, validate its `state` properties against the widget's `WidgetMeta.config`:
   - Unknown config properties → warning.
   - Invalid enum values → error.
   - Type mismatches (string where number expected) → error.
   - Missing required config → error (with default fallback).
4. **Binding input validation.** For each binding in a widget's `bindings` map:
   - Input name must be declared in the widget's `WidgetMeta.inputs` → error if not.
   - Required inputs without bindings → warning.

### Stage 3: Referential (Graph Validation)

Validates the wiring graph:

1. **Dangling widget references.** `fromWidget` must reference a widget instance that exists in the spec. Compute expected IDs from the spec's widget order.
2. **Dangling output references.** `output` must be a declared output of the referenced widget type.
3. **Type compatibility.** The output's declared type must match the input's declared type.
4. **Cycle detection.** Build a directed graph (widget → widget via bindings). Run topological sort — reject if cycle detected.

### Validation Output

```typescript
interface ValidationResult {
    valid: boolean;                    // true if no errors (warnings OK)
    errors: ValidationMessage[];       // Must fix before hydration
    warnings: ValidationMessage[];     // Informational, spec will work
}

interface ValidationMessage {
    level: 'error' | 'warning';
    path: string;                      // e.g., "state[2].state.bindings.city"
    code: string;                      // e.g., "DANGLING_WIDGET_REF"
    message: string;                   // Human-readable description
}
```

## Versioning & Migration

### Version Field

Specs carry a `version` field (default `1`). When the spec format changes:
1. Bump the version number.
2. Write a migration function: `migrateV1toV2(spec) → spec`.
3. On load, check version and apply migrations in sequence.

### Migration Strategy

Migrations are deterministic transformations applied in order:

```typescript
const migrations: Record<number, (spec: DashSpec) => DashSpec> = {
    // v1 → v2: example migration
    2: (spec) => ({
        ...spec,
        version: 2,
        state: spec.state.map(w => ({
            ...w,
            state: {
                ...w.state,
                // v2 renames 'metric' to 'displayMetric' in precipChart
                ...(w.viewSpecId === 'precipChart' && w.state?.metric
                    ? {displayMetric: w.state.metric, metric: undefined}
                    : {})
            }
        }))
    })
};

function migrateSpec(spec: DashSpec): DashSpec {
    let current = spec;
    const target = CURRENT_VERSION;
    while ((current.version ?? 1) < target) {
        const next = (current.version ?? 1) + 1;
        current = migrations[next](current);
    }
    return current;
}
```

For V1 (initial release): no migrations needed. The framework is in place for future evolution.

## Hydration Flow

```
JSON string
    ↓ parse
DashSpec object
    ↓ migrateSpec()
DashSpec (current version)
    ↓ validateSpec()
ValidationResult
    ↓ if valid
DashCanvasModel.setPersistableState({state: spec.state})
    ↓
Widgets instantiated, bindings resolved, data loaded
```

In the JSON harness, invalid specs show errors and keep the previous dashboard state. In the LLM harness, invalid specs trigger a repair prompt back to the LLM.

## Example Full Dashboard Specs

### Minimal: Single City Overview

```json
{
    "version": 1,
    "state": [
        {
            "viewSpecId": "cityChooser",
            "layout": {"x": 0, "y": 0, "w": 3, "h": 2},
            "state": {"selectedCity": "New York"}
        },
        {
            "viewSpecId": "currentConditions",
            "layout": {"x": 3, "y": 0, "w": 4, "h": 5},
            "state": {
                "bindings": {"city": {"fromWidget": "cityChooser", "output": "selectedCity"}}
            }
        },
        {
            "viewSpecId": "forecastChart",
            "layout": {"x": 7, "y": 0, "w": 5, "h": 5},
            "state": {
                "bindings": {"city": {"fromWidget": "cityChooser", "output": "selectedCity"}},
                "series": ["temp"],
                "chartType": "line"
            }
        }
    ]
}
```

### Full: Comprehensive Dashboard

```json
{
    "version": 1,
    "state": [
        {
            "viewSpecId": "cityChooser",
            "layout": {"x": 0, "y": 0, "w": 3, "h": 2},
            "state": {"selectedCity": "New York"}
        },
        {
            "viewSpecId": "unitsToggle",
            "layout": {"x": 3, "y": 0, "w": 3, "h": 2},
            "state": {"units": "imperial"}
        },
        {
            "viewSpecId": "currentConditions",
            "layout": {"x": 6, "y": 0, "w": 6, "h": 5},
            "state": {
                "bindings": {
                    "city": {"fromWidget": "cityChooser", "output": "selectedCity"},
                    "units": {"fromWidget": "unitsToggle", "output": "units"}
                },
                "displayMode": "detailed"
            }
        },
        {
            "viewSpecId": "forecastChart",
            "layout": {"x": 0, "y": 2, "w": 6, "h": 5},
            "state": {
                "bindings": {
                    "city": {"fromWidget": "cityChooser", "output": "selectedCity"},
                    "units": {"fromWidget": "unitsToggle", "output": "units"}
                },
                "series": ["temp", "feelsLike"],
                "chartType": "line"
            }
        },
        {
            "viewSpecId": "precipChart",
            "layout": {"x": 0, "y": 7, "w": 6, "h": 5},
            "state": {
                "bindings": {"city": {"fromWidget": "cityChooser", "output": "selectedCity"}},
                "metric": "both"
            }
        },
        {
            "viewSpecId": "windChart",
            "layout": {"x": 6, "y": 5, "w": 6, "h": 5},
            "state": {
                "bindings": {
                    "city": {"fromWidget": "cityChooser", "output": "selectedCity"},
                    "units": {"fromWidget": "unitsToggle", "output": "units"}
                },
                "showGusts": true
            }
        },
        {
            "viewSpecId": "summaryGrid",
            "layout": {"x": 6, "y": 10, "w": 6, "h": 5},
            "state": {
                "bindings": {
                    "city": {"fromWidget": "cityChooser", "output": "selectedCity"},
                    "units": {"fromWidget": "unitsToggle", "output": "units"}
                }
            }
        }
    ]
}
```

### Comparison: Two Cities Side by Side

See WIRING-DESIGN.md for the full multi-city comparison example.
