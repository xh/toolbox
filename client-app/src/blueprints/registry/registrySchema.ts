import type {PlainObject} from '@xh/hoist/core';
import {isPlainObject, isString, lowerCase, upperFirst} from 'lodash';

/** One property of a schema, as a Registry card shows it. */
export interface SchemaProp {
    key: string;
    /** Its path from the schema's root, such as `/columnState/[]/width`. */
    path: string;
    label: string;
    required: boolean;
    /** Its types, one per alternative, such as `string` and `object`. */
    types: string[];
    enumValues?: string[];
    /** Its `x-` annotations and preset marks, each a short tag. */
    tags: {text: string; title?: string}[];
    default?: string;
    description?: string;
    /** The properties of an object it holds, or of each item of a list it holds. */
    children?: SchemaProp[];
    /** What the children belong to: `each item` for a list. */
    childrenOf?: string;
}

/** A group of properties under one heading. */
export interface SchemaSection {
    title: string;
    props: SchemaProp[];
}

/**
 * An object schema's properties in groups: under the sections a widget's Inspector shows, in their
 * order, with any property they leave out under Other, or under one Properties group when there
 * are no sections.
 *
 * @param presetPaths - config paths that presets set, such as `/columnState`, each marked.
 */
export function schemaSections(
    schema: PlainObject,
    sections?: {label: string; keys: string[]}[],
    presetPaths: string[] = []
): SchemaSection[] {
    const props = propsOf(schema, '', presetPaths);
    if (!sections?.length) return props.length ? [{title: 'Properties', props}] : [];
    const byKey = new Map(props.map(it => [it.key, it])),
        named = new Set(sections.flatMap(it => it.keys)),
        ret = sections
            .map(it => ({
                title: it.label,
                props: it.keys.map(key => byKey.get(key)).filter(Boolean)
            }))
            .filter(it => it.props.length),
        other = props.filter(it => !named.has(it.key));
    return other.length ? [...ret, {title: 'Other', props: other}] : ret;
}

//------------------
// Implementation
//------------------
function propsOf(schema: PlainObject, path: string, presetPaths: string[]): SchemaProp[] {
    if (!isPlainObject(schema?.properties)) return [];
    const required: string[] = schema.required ?? [];
    return Object.entries<PlainObject>(schema.properties).map(([key, s]) =>
        propOf(key, s, `${path}/${key}`, required.includes(key), presetPaths)
    );
}

function propOf(
    key: string,
    s: PlainObject,
    path: string,
    required: boolean,
    presetPaths: string[]
): SchemaProp {
    const alts: PlainObject[] = s.anyOf ?? s.oneOf ?? [s],
        own = objectOf(s),
        item = alts.map(it => objectOf(it.items)).find(Boolean),
        entry = alts.map(it => objectOf(it.additionalProperties)).find(Boolean),
        [childSchema, childrenOf] = own
            ? [own, 'its properties']
            : item
              ? [item, 'each item']
              : entry
                ? [entry, 'each entry']
                : [null, null],
        children = childSchema ? propsOf(childSchema, `${path}/[]`, presetPaths) : [];
    return {
        key,
        path,
        label: s.title ?? upperFirst(lowerCase(key)),
        required,
        types: [
            ...new Set(
                alts
                    .flatMap(it => typeOf(it)?.split(' | ') ?? [])
                    .map(it => (it === 'null' ? 'nullable' : it))
            )
        ],
        enumValues: s.enum?.map(String),
        tags: [
            ...annotationTags(s),
            ...(presetPaths.includes(path) ? [{text: 'preset', title: 'Presets can set it.'}] : [])
        ],
        default: s.default === undefined ? undefined : JSON.stringify(s.default),
        description: s.description,
        ...(children.length ? {children, childrenOf} : {})
    };
}

// A schema's object form: itself, or the alternative of it, that has properties.
function objectOf(s: PlainObject): PlainObject {
    if (!isPlainObject(s)) return null;
    if (isPlainObject(s.properties)) return s;
    return [...(s.anyOf ?? []), ...(s.oneOf ?? [])].find(it => isPlainObject(it?.properties));
}

function typeOf(s: PlainObject): string {
    if (s.enum) return null;
    if (s.const !== undefined) return `const ${JSON.stringify(s.const)}`;
    const type = [s.type].flat().filter(Boolean).join(' | ');
    if (type === 'array') {
        const item = s.items?.type ?? (isPlainObject(s.items?.properties) ? 'object' : null);
        return item ? `${[item].flat().join(' | ')}[]` : 'array';
    }
    return type || null;
}

// Short tags for a property's `x-` annotations, with the full annotation as their title.
function annotationTags(s: PlainObject): {text: string; title: string}[] {
    return Object.entries(s)
        .filter(([k]) => k.startsWith('x-'))
        .map(([k, v]) => {
            const name = k.slice(2),
                title = `${k}: ${isString(v) ? v : JSON.stringify(v)}`;
            switch (k) {
                case 'x-binding':
                    return {text: v ? 'bindable' : 'literal', title};
                case 'x-thumbnails':
                    return {text: 'pictures', title};
                case 'x-labels':
                    return {text: 'labels', title};
                default:
                    return {text: v === true ? name : `${name}: ${isString(v) ? v : '…'}`, title};
            }
        });
}
