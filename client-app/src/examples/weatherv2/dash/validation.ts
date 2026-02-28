import {widgetRegistry} from './WidgetRegistry';
import {ValidationResult, ValidationMessage, DashSpec, DashWidgetState, BindingSpec} from './types';

const CURRENT_VERSION = 1;

/**
 * Migrations map: version → transform function.
 * For V1 (initial release) there are no migrations. The framework is in place.
 */
const migrations: Record<number, (spec: DashSpec) => DashSpec> = {};

/**
 * Migrate a spec to the current version.
 */
export function migrateSpec(spec: DashSpec): DashSpec {
    let current = {...spec};
    while ((current.version ?? 1) < CURRENT_VERSION) {
        const next = (current.version ?? 1) + 1;
        const migrate = migrations[next];
        if (!migrate) break;
        current = migrate(current);
    }
    return current;
}

/**
 * Full three-stage validation pipeline.
 * Returns a ValidationResult with errors and warnings.
 */
export function validateSpec(spec: DashSpec): ValidationResult {
    const errors: ValidationMessage[] = [],
        warnings: ValidationMessage[] = [];

    if (!spec || typeof spec !== 'object') {
        errors.push(msg('error', '', 'INVALID_SPEC', 'Spec must be a non-null object.'));
        return {valid: false, errors, warnings};
    }

    if (!Array.isArray(spec.state)) {
        errors.push(msg('error', 'state', 'MISSING_STATE', 'Spec must have a "state" array.'));
        return {valid: false, errors, warnings};
    }

    // Stage 1: Structural validation
    validateStructural(spec, errors, warnings);

    // Stage 2: Semantic validation
    validateSemantic(spec, errors, warnings);

    // Stage 3: Referential validation (wiring graph)
    validateReferential(spec, errors, warnings);

    return {valid: errors.length === 0, errors, warnings};
}

//--------------------------------------------------
// Stage 1: Structural
//--------------------------------------------------
function validateStructural(
    spec: DashSpec,
    errors: ValidationMessage[],
    warnings: ValidationMessage[]
) {
    const registeredIds = new Set(widgetRegistry.getIds());

    spec.state.forEach((widget, idx) => {
        const path = `state[${idx}]`;

        if (!widget.viewSpecId) {
            errors.push(
                msg('error', path, 'MISSING_VIEW_SPEC_ID', 'Widget must have a viewSpecId.')
            );
        } else if (!registeredIds.has(widget.viewSpecId)) {
            errors.push(
                msg(
                    'error',
                    `${path}.viewSpecId`,
                    'UNKNOWN_WIDGET_TYPE',
                    `Unknown widget type "${widget.viewSpecId}". Available: ${[...registeredIds].join(', ')}.`
                )
            );
        }

        if (!widget.layout) {
            errors.push(msg('error', path, 'MISSING_LAYOUT', 'Widget must have a layout.'));
        } else {
            validateLayout(widget.layout, `${path}.layout`, errors, warnings);
        }
    });
}

function validateLayout(
    layout: DashWidgetState['layout'],
    path: string,
    errors: ValidationMessage[],
    warnings: ValidationMessage[]
) {
    const {x, y, w, h} = layout;

    if (typeof x !== 'number' || x < 0) {
        errors.push(msg('error', `${path}.x`, 'INVALID_X', `x must be >= 0, got ${x}.`));
    }
    if (typeof y !== 'number' || y < 0) {
        errors.push(msg('error', `${path}.y`, 'INVALID_Y', `y must be >= 0, got ${y}.`));
    }
    if (typeof w !== 'number' || w < 1 || w > 12) {
        errors.push(msg('error', `${path}.w`, 'INVALID_W', `w must be 1-12, got ${w}.`));
    }
    if (typeof h !== 'number' || h < 1) {
        errors.push(msg('error', `${path}.h`, 'INVALID_H', `h must be >= 1, got ${h}.`));
    }
    if (typeof x === 'number' && typeof w === 'number' && x + w > 12) {
        errors.push(
            msg('error', path, 'LAYOUT_OVERFLOW', `Widget extends past column 12 (x=${x}, w=${w}).`)
        );
    }
}

//--------------------------------------------------
// Stage 2: Semantic
//--------------------------------------------------
function validateSemantic(
    spec: DashSpec,
    errors: ValidationMessage[],
    warnings: ValidationMessage[]
) {
    spec.state.forEach((widget, idx) => {
        const path = `state[${idx}]`;
        const meta = widgetRegistry.get(widget.viewSpecId);
        if (!meta) return; // already flagged in structural

        const widgetState = widget.state ?? {};
        const configKeys = Object.keys(meta.config);

        // Check config property types and enum values
        for (const [key, def] of Object.entries(meta.config)) {
            const value = widgetState[key];
            if (value === undefined) continue;

            if (def.type === 'enum' && def.enum && !def.enum.includes(value)) {
                errors.push(
                    msg(
                        'error',
                        `${path}.state.${key}`,
                        'INVALID_ENUM',
                        `"${value}" is not a valid value for ${key}. Must be one of: ${def.enum.join(', ')}.`
                    )
                );
            }

            if (def.type === 'boolean' && typeof value !== 'boolean') {
                errors.push(
                    msg(
                        'error',
                        `${path}.state.${key}`,
                        'TYPE_MISMATCH',
                        `${key} must be a boolean, got ${typeof value}.`
                    )
                );
            }

            if (def.type === 'number' && typeof value !== 'number') {
                errors.push(
                    msg(
                        'error',
                        `${path}.state.${key}`,
                        'TYPE_MISMATCH',
                        `${key} must be a number, got ${typeof value}.`
                    )
                );
            }
        }

        // Warn about unknown state keys (excluding 'bindings' and known config)
        const knownKeys = new Set([...configKeys, 'bindings']);
        for (const key of Object.keys(widgetState)) {
            if (!knownKeys.has(key)) {
                warnings.push(
                    msg(
                        'warning',
                        `${path}.state.${key}`,
                        'UNKNOWN_STATE_KEY',
                        `Unknown state key "${key}" on ${widget.viewSpecId}. It will be preserved but may have no effect.`
                    )
                );
            }
        }

        // Check binding inputs are declared
        const bindings = widgetState.bindings;
        if (bindings) {
            const declaredInputNames = new Set(meta.inputs.map(i => i.name));
            for (const inputName of Object.keys(bindings)) {
                if (!declaredInputNames.has(inputName)) {
                    warnings.push(
                        msg(
                            'warning',
                            `${path}.state.bindings.${inputName}`,
                            'UNKNOWN_INPUT',
                            `"${inputName}" is not a declared input of ${widget.viewSpecId}.`
                        )
                    );
                }
            }
        }

        // Warn about required inputs without bindings
        for (const input of meta.inputs) {
            if (input.required && !bindings?.[input.name]) {
                warnings.push(
                    msg(
                        'warning',
                        `${path}.state.bindings`,
                        'UNBOUND_REQUIRED_INPUT',
                        `Required input "${input.name}" on ${widget.viewSpecId} has no binding. Default value will be used.`
                    )
                );
            }
        }
    });
}

//--------------------------------------------------
// Stage 3: Referential (wiring graph)
//--------------------------------------------------
function validateReferential(
    spec: DashSpec,
    errors: ValidationMessage[],
    _warnings: ValidationMessage[]
) {
    // Compute expected widget instance IDs (matching DashCanvasModel's assignment)
    const instanceIds = computeInstanceIds(spec.state);
    const idSet = new Set(instanceIds);
    const typeById = new Map<string, string>(); // instanceId → viewSpecId
    instanceIds.forEach((id, idx) => typeById.set(id, spec.state[idx].viewSpecId));

    spec.state.forEach((widget, idx) => {
        const path = `state[${idx}]`;
        const bindings = widget.state?.bindings;
        if (!bindings) return;

        for (const [inputName, rawBinding] of Object.entries(bindings)) {
            const binding = rawBinding as BindingSpec;
            const bindPath = `${path}.state.bindings.${inputName}`;

            if (binding && 'fromWidget' in binding) {
                const fromWidget = binding.fromWidget;
                const output = binding.output;

                // Check fromWidget exists
                if (!idSet.has(fromWidget)) {
                    errors.push(
                        msg(
                            'error',
                            bindPath,
                            'DANGLING_WIDGET_REF',
                            `Binding references widget "${fromWidget}" which does not exist. Available: ${[...idSet].join(', ')}.`
                        )
                    );
                    continue;
                }

                // Check output exists on source widget type
                const sourceType = typeById.get(fromWidget);
                if (sourceType) {
                    const sourceMeta = widgetRegistry.get(sourceType);
                    if (sourceMeta) {
                        const hasOutput = sourceMeta.outputs.some(o => o.name === output);
                        if (!hasOutput) {
                            errors.push(
                                msg(
                                    'error',
                                    bindPath,
                                    'DANGLING_OUTPUT_REF',
                                    `Widget type "${sourceType}" has no output named "${output}".`
                                )
                            );
                        }
                    }
                }
            }
        }
    });

    // Cycle detection via topological sort
    const graph = new Map<string, Set<string>>();
    instanceIds.forEach(id => graph.set(id, new Set()));

    spec.state.forEach((widget, idx) => {
        const bindings = widget.state?.bindings;
        if (!bindings) return;
        const thisId = instanceIds[idx];

        for (const rawBinding of Object.values(bindings) as BindingSpec[]) {
            if (rawBinding && 'fromWidget' in rawBinding && idSet.has(rawBinding.fromWidget)) {
                // Edge: fromWidget → thisWidget (data flows from source to consumer)
                graph.get(rawBinding.fromWidget)?.add(thisId);
            }
        }
    });

    if (hasCycle(graph)) {
        errors.push(
            msg(
                'error',
                'state',
                'BINDING_CYCLE',
                'Circular dependency detected in widget bindings.'
            )
        );
    }
}

/**
 * Compute widget instance IDs matching DashCanvasModel's 0-indexed assignment:
 * first instance of type X → "X_0", second → "X_1", etc.
 */
function computeInstanceIds(state: DashWidgetState[]): string[] {
    const counts = new Map<string, number>();
    return state.map(widget => {
        const idx = counts.get(widget.viewSpecId) ?? 0;
        counts.set(widget.viewSpecId, idx + 1);
        return `${widget.viewSpecId}_${idx}`;
    });
}

/** Cycle detection via DFS on a directed graph. */
function hasCycle(graph: Map<string, Set<string>>): boolean {
    const visited = new Set<string>();
    const stack = new Set<string>();

    function dfs(node: string): boolean {
        if (stack.has(node)) return true;
        if (visited.has(node)) return false;
        visited.add(node);
        stack.add(node);
        for (const neighbor of graph.get(node) ?? []) {
            if (dfs(neighbor)) return true;
        }
        stack.delete(node);
        return false;
    }

    for (const node of graph.keys()) {
        if (dfs(node)) return true;
    }
    return false;
}

/** Helper to create a validation message. */
function msg(
    level: 'error' | 'warning',
    path: string,
    code: string,
    message: string
): ValidationMessage {
    return {level, path, code, message};
}
