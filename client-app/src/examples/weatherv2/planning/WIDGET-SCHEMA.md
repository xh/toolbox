# Widget Schema Interface Design

## Purpose

Each widget type needs a machine-readable description of its configuration surface — its **schema**. This is what:
- The **LLM** consumes to produce valid dashboard specs.
- The **JSON harness** validates against.
- The **Dashboard Inspector** widget displays for debugging.

## Design Decision: Static `meta` Property

Each widget model class declares a static `meta` property of type `WidgetMeta`. This is manually maintained per widget. The registry collects all `meta` objects and exposes them for validation and LLM prompt generation.

**Why this approach:**
- Simple, explicit, co-located with the widget code.
- No runtime introspection magic — easy to debug.
- Clean enough to auto-generate later (the `meta` shape is stable; the source could change from hand-written to generated).
- JSON Schema fragments are embedded directly — no translation layer.

## WidgetMeta Interface

```typescript
interface WidgetMeta {
    /** Widget type ID — matches the DashCanvasViewSpec.id. */
    id: string;

    /** Human-readable name. */
    title: string;

    /** Short description of what this widget does. */
    description: string;

    /** Category for grouping in menus/docs. */
    category: 'input' | 'display' | 'utility';

    /** Inputs this widget accepts (consumed via bindings). */
    inputs: InputDef[];

    /** Outputs this widget publishes (available for binding by other widgets). */
    outputs: OutputDef[];

    /** Configurable properties (persisted in viewState). */
    config: Record<string, ConfigPropertyDef>;

    /** Default layout dimensions (columns × rows). */
    defaultSize: {w: number; h: number};

    /** Sizing constraints. */
    minSize?: {w?: number; h?: number};
    maxSize?: {w?: number; h?: number};
}

interface InputDef {
    name: string;
    type: string;
    required?: boolean;
    default?: any;
    description: string;
}

interface OutputDef {
    name: string;
    type: string;
    description: string;
}

interface ConfigPropertyDef {
    type: 'string' | 'number' | 'boolean' | 'enum' | 'string[]';
    description: string;
    default?: any;
    enum?: string[];           // For type: 'enum'
    min?: number;              // For type: 'number'
    max?: number;              // For type: 'number'
    required?: boolean;
}
```

## Widget Registry

A singleton registry collects all widget schemas and provides lookup:

```typescript
class WidgetRegistry {
    private _schemas = new Map<string, WidgetMeta>();

    register(meta: WidgetMeta) {
        this._schemas.set(meta.id, meta);
    }

    get(id: string): WidgetMeta | undefined {
        return this._schemas.get(id);
    }

    getAll(): WidgetMeta[] {
        return Array.from(this._schemas.values());
    }

    /** Generate a JSON Schema for the full dashboard spec. */
    generateDashboardSchema(): object { /* see DSL-SPEC.md */ }

    /** Generate a prompt-friendly text description of all widget types. */
    generateLLMPrompt(): string { /* see LLM harness section */ }
}
```

Registration happens at module load time — each widget file calls `widgetRegistry.register(MyWidgetModel.meta)`.

## Example Schemas

### 1. City Chooser (Simple Input Widget)

```typescript
static meta: WidgetMeta = {
    id: 'cityChooser',
    title: 'City Chooser',
    description: 'Dropdown selector that emits the selected city name. Other widgets bind to this to display data for the chosen city.',
    category: 'input',
    inputs: [],
    outputs: [
        {name: 'selectedCity', type: 'string', description: 'The currently selected city name.'}
    ],
    config: {
        selectedCity: {
            type: 'string',
            description: 'Initially selected city.',
            default: 'New York'
        },
        cities: {
            type: 'string[]',
            description: 'List of available cities. If omitted, uses the full default city list.',
            required: false
        },
        enableSearch: {
            type: 'boolean',
            description: 'Enable type-ahead filtering in the dropdown.',
            default: true
        }
    },
    defaultSize: {w: 3, h: 2},
    minSize: {w: 2, h: 1}
};
```

### 2. Forecast Chart (Complex Display Widget)

```typescript
static meta: WidgetMeta = {
    id: 'forecastChart',
    title: 'Forecast Chart',
    description: 'Multi-series line/area chart showing forecast data over time. Configurable series selection and chart type.',
    category: 'display',
    inputs: [
        {name: 'city', type: 'string', required: true, default: 'New York', description: 'City to show forecast for.'},
        {name: 'units', type: 'string', required: false, default: 'imperial', description: 'Unit system: "imperial" or "metric".'}
    ],
    outputs: [],
    config: {
        series: {
            type: 'string[]',
            description: 'Which data series to display. Options: "temp", "feelsLike", "humidity", "pressure".',
            default: ['temp', 'feelsLike']
        },
        chartType: {
            type: 'enum',
            description: 'Chart rendering style.',
            enum: ['line', 'area', 'column'],
            default: 'line'
        },
        showLegend: {
            type: 'boolean',
            description: 'Show chart legend.',
            default: true
        },
        showTooltip: {
            type: 'boolean',
            description: 'Show data tooltips on hover.',
            default: true
        }
    },
    defaultSize: {w: 8, h: 5},
    minSize: {w: 4, h: 3}
};
```

### 3. Dashboard Inspector (Utility Widget)

```typescript
static meta: WidgetMeta = {
    id: 'dashInspector',
    title: 'Dashboard Inspector',
    description: 'Debug utility that shows the current wiring graph, resolved input/output values, and validation status for all widgets in the dashboard.',
    category: 'utility',
    inputs: [],
    outputs: [],
    config: {
        showBindings: {
            type: 'boolean',
            description: 'Show binding details for each widget.',
            default: true
        },
        showOutputValues: {
            type: 'boolean',
            description: 'Show current resolved output values.',
            default: true
        },
        showValidation: {
            type: 'boolean',
            description: 'Show validation status (errors/warnings).',
            default: true
        },
        compactMode: {
            type: 'boolean',
            description: 'Use compact single-line display per widget.',
            default: false
        }
    },
    defaultSize: {w: 4, h: 6},
    minSize: {w: 3, h: 4}
};
```

## LLM Prompt Generation

The registry generates a structured text description for the LLM system prompt:

```
## Available Widget Types

### cityChooser — City Chooser [input]
Dropdown selector that emits the selected city name.
Outputs: selectedCity (string) — The currently selected city name.
Config:
  - selectedCity (string, default: "New York") — Initially selected city.
  - cities (string[], optional) — List of available cities.
  - enableSearch (boolean, default: true) — Enable type-ahead filtering.
Default size: 3×2

### forecastChart — Forecast Chart [display]
Multi-series line/area chart showing forecast data over time.
Inputs:
  - city (string, required, default: "New York") — City to show forecast for.
  - units (string, optional, default: "imperial") — Unit system.
Outputs: (none)
Config:
  - series (string[], default: ["temp","feelsLike"]) — Data series to display. Options: "temp", "feelsLike", "humidity", "pressure".
  - chartType (enum: line|area|column, default: "line") — Chart rendering style.
  - showLegend (boolean, default: true) — Show chart legend.
Default size: 8×5

...
```

This is included in the LLM system prompt along with the dashboard spec schema (DSL-SPEC.md) and example specs (DEMO-SCRIPTS.md).

## Auto-Generation Stretch Goal

### Current State of Hoist Introspection

Hoist models already declare their persistence surface:
- `@persist` decorator marks properties that persist.
- `@bindable` decorator marks properties with auto-setters.
- `persistWith` + `markPersist()` establish the persistence path.
- `getPersistableState()` / `setPersistableState()` are the serialization boundary.

### What's Missing for Auto-Generation

1. **Type information at runtime.** TypeScript types are erased. We'd need to either:
   - Use decorators that capture type info (e.g., `@persist({type: 'string', default: 'New York'})`).
   - Use a TypeScript transformer to extract type metadata at build time.
   - Or accept that auto-generation reads the source, not the runtime.

2. **Semantic metadata.** Persistence knows *what* is persisted, but not *what it means*. A property named `chartType` could be anything — the schema needs descriptions, enums, constraints that aren't in the persistence layer.

3. **Input/output declarations.** Hoist's persistence has no concept of inter-widget IO. This is a V2 addition, so it can't be derived from existing Hoist code.

### Viable Auto-Generation Path

A build-time tool that:
1. Reads widget model source files.
2. Extracts `@persist` and `@bindable` decorated properties with their TypeScript types.
3. Merges with hand-maintained `meta.description`, `meta.inputs`, `meta.outputs` (the parts that can't be inferred).
4. Produces `WidgetMeta` objects.

This could use the TypeScript compiler API to walk ASTs. The manually maintained parts would shrink to just descriptions and IO declarations — config properties would be auto-derived.

### Recommendation

Start with fully manual `meta` objects. They're small (10-20 lines per widget), accurate, and co-located with the code. Plan for auto-generation by keeping the `WidgetMeta` interface stable and the config property definitions simple. A future PR could add a build-time script that generates the config portion from TypeScript types, leaving descriptions and IO declarations manual.

## Validation

The schema enables three levels of validation:

1. **Structural.** Does the widget state match the expected shape? Are all required config properties present? Are enum values valid?
2. **Referential.** Do all bindings reference existing widget IDs and output names?
3. **Semantic.** Are bound types compatible? Is the dependency graph acyclic?

See DSL-SPEC.md for the full validation pipeline.
