import {BlueprintRegistry} from '@xh/hoist-chat-kit/blueprint';
import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import type {PlainObject} from '@xh/hoist/core';
import {isPlainObject, isString} from 'lodash';

export type RegistryKind =
    'widget' | 'variableType' | 'resolver' | 'action' | 'renderer' | 'presentation';

export type RegistryOrigin = 'built-in' | 'chat kit' | 'app';

/** One entry of a registry, as the Registry tab lists it. */
export interface RegistryEntry {
    /** `kind:name`, or `presentation:widget.name`. */
    id: string;
    kind: RegistryKind;
    name: string;
    label: string;
    origin: RegistryOrigin;
    /** The widget a presentation belongs to. */
    widget?: string;
    spec: PlainObject;
}

/** The registry's collection for each kind but presentations, which live on their widgets. */
export const COLLECTIONS: Record<Exclude<RegistryKind, 'presentation'>, string> = {
    widget: 'widgets',
    variableType: 'variableTypes',
    resolver: 'resolvers',
    action: 'actions',
    renderer: 'renderers'
};

/**
 * Every entry of a registry, with where it comes from: a Hoist Blueprints built-in, the app's own
 * registry, or chat kit, which bridges its components, chat actions and answer presentations.
 */
export function registryEntries(
    registry: BlueprintRegistry,
    appRegistry: BlueprintRegistry
): RegistryEntry[] {
    const ret: RegistryEntry[] = [];
    Object.entries(COLLECTIONS).forEach(([kind, coll]) => {
        Object.entries<PlainObject>(registry[coll]).forEach(([name, spec]) => {
            if (spec.reserved) return;
            ret.push({
                id: `${kind}:${name}`,
                kind: kind as RegistryKind,
                name,
                label: spec.label ?? name,
                origin: originOf(coll, name, spec, appRegistry),
                spec
            });
            (spec.presentations ?? []).forEach((p: PlainObject) =>
                ret.push({
                    id: `presentation:${name}.${p.name}`,
                    kind: 'presentation',
                    name: p.name,
                    label: `${spec.label ?? name}: ${p.label}`,
                    origin: presentationOrigin(name, p.name),
                    widget: name,
                    spec: p
                })
            );
        });
    });
    return ret;
}

/** A sample value for each required parameter of an object schema, for an action's description. */
export function sampleParams(schema: PlainObject): PlainObject {
    const props: PlainObject = schema?.properties ?? {};
    return Object.fromEntries(
        (schema?.required ?? Object.keys(props)).map((name: string) => [
            name,
            sampleValue(name, props[name] ?? {})
        ])
    );
}

/** One row of a schema tree: a property, with its type, requirement, default and annotations. */
export interface SchemaRow {
    id: string;
    name: string;
    type: string;
    required: boolean;
    default: string;
    annotations: string;
    description: string;
    children?: SchemaRow[];
}

/** A JSON Schema as a tree of its properties, with array items and alternatives beneath. */
export function schemaRows(schema: PlainObject, path = ''): SchemaRow[] {
    if (!isPlainObject(schema)) return [];
    const required: string[] = schema.required ?? [],
        props: PlainObject = schema.properties ?? {};
    return Object.entries<PlainObject>(props).map(([name, s]) => ({
        ...schemaRow(`${path}/${name}`, name, s),
        required: required.includes(name)
    }));
}

//------------------
// Implementation
//------------------
let builtIns: BlueprintRegistry = null;

function originOf(
    coll: string,
    name: string,
    spec: PlainObject,
    appRegistry: BlueprintRegistry
): RegistryOrigin {
    builtIns ??= new BlueprintRegistry();
    if (isSameEntry(builtIns[coll][name], spec)) return 'built-in';
    if (spec.app || isSameEntry(appRegistry[coll][name], spec)) return 'app';
    return 'chat kit';
}

function presentationOrigin(widget: string, name: string): RegistryOrigin {
    if (
        ChatUiCatalog.answerPresentations.some(
            p => p.widget === widget && p.presentation.name === name
        )
    ) {
        return 'chat kit';
    }
    builtIns ??= new BlueprintRegistry();
    const builtIn = builtIns.widgets[widget]?.presentations?.some(p => p.name === name);
    return builtIn ? 'built-in' : 'app';
}

// Adding a presentation copies a widget's spec, keeping its code and its other parts as they were.
function isSameEntry(a: PlainObject, b: PlainObject): boolean {
    if (!a || !b) return false;
    if (a === b) return true;
    const kept = ['model', 'component', 'resolve', 'run', 'render', 'describe', 'example', 'size'];
    return kept.some(k => a[k] && a[k] === b[k]);
}

function schemaRow(id: string, name: string, s: PlainObject): SchemaRow {
    const children = [
        ...schemaRows(s, id),
        ...(isPlainObject(s.items) ? [schemaRow(`${id}/[]`, '[item]', s.items)] : []),
        ...['anyOf', 'oneOf'].flatMap(k =>
            (s[k] ?? []).map((alt: PlainObject, i: number) =>
                schemaRow(`${id}/${k}${i}`, `${k} ${i + 1}`, alt)
            )
        )
    ];
    return {
        id,
        name,
        type: typeOf(s),
        required: false,
        default: s.default === undefined ? null : JSON.stringify(s.default),
        annotations:
            Object.entries(s)
                .filter(([k]) => k.startsWith('x-'))
                .map(([k, v]) => (v === true ? k : `${k}: ${isString(v) ? v : JSON.stringify(v)}`))
                .join(', ') || null,
        description: s.description ?? null,
        children: children.length ? children : undefined
    };
}

function typeOf(s: PlainObject): string {
    if (s.enum) return `enum: ${s.enum.map((v: unknown) => JSON.stringify(v)).join(' | ')}`;
    if (s.const !== undefined) return `const ${JSON.stringify(s.const)}`;
    const type = [s.type].flat().filter(Boolean).join(' | ');
    if (type === 'array' && s.items?.type) return `${[s.items.type].flat().join(' | ')}[]`;
    return type || (s.anyOf ? 'anyOf' : s.oneOf ? 'oneOf' : null);
}

function sampleValue(name: string, s: PlainObject): unknown {
    if (s.default !== undefined) return s.default;
    if (s.examples?.length) return s.examples[0];
    if (s.enum?.length) return s.enum[0];
    switch ([s.type].flat().find(t => t && t !== 'null')) {
        case 'number':
        case 'integer':
            return 1;
        case 'boolean':
            return true;
        case 'array':
            return [];
        case 'object':
            return {};
        default:
            return name;
    }
}
