import {SETTING_GROUPS} from '@xh/hoist-chat-kit/blueprint';
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
    /** Its children under the item's `x-groups`, where the item has them. */
    childGroups?: SchemaSection[];
    /** What the children belong to: `each item` for a list. */
    childrenOf?: string;
}

/** A group of properties under one heading. */
export interface SchemaSection {
    title: string;
    props: SchemaProp[];
    /** Its advanced properties, under a More heading. */
    more: SchemaProp[];
}

/**
 * An object schema's properties in groups. Annotated with `x-group`, they fall under the six
 * setting groups, in order, each with its `x-advanced` properties under More, and any property
 * without one under Other. Otherwise they make one Properties group.
 *
 * @param presetPaths - config paths that presets set, such as `/columnState`, each marked.
 */
export function schemaSections(schema: PlainObject, presetPaths: string[] = []): SchemaSection[] {
    const props = propsOf(schema, '', presetPaths);
    if (!props.some(it => it.group)) return props.length ? [section('Properties', props)] : [];
    return groupSections(
        props,
        SETTING_GROUPS.map(id => ({id, label: upperFirst(id)}))
    );
}

//------------------
// Implementation
//------------------
type GroupedProp = SchemaProp & {group?: string; advanced?: boolean};

function section(title: string, props: SchemaProp[], more: SchemaProp[] = []): SchemaSection {
    return {title, props, more};
}

// Props under the groups given, in their order, with advanced ones under More and the rest under Other.
function groupSections(
    props: GroupedProp[],
    groups: {id: string; label: string}[]
): SchemaSection[] {
    const ids = new Set(groups.map(it => it.id)),
        ret = groups.map(({id, label}) => {
            const mine = props.filter(it => it.group === id);
            return section(
                label,
                mine.filter(it => !it.advanced),
                mine.filter(it => it.advanced)
            );
        }),
        other = props.filter(it => !ids.has(it.group));
    if (other.length) ret.push(section('Other', other));
    return ret.filter(it => it.props.length || it.more.length);
}

function propsOf(schema: PlainObject, path: string, presetPaths: string[]): GroupedProp[] {
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
): GroupedProp {
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
        children = childSchema ? propsOf(childSchema, `${path}/[]`, presetPaths) : [],
        itemGroups: {id: string; label: string}[] = childSchema?.['x-groups'];
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
        ...(children.length ? {children, childrenOf} : {}),
        ...(children.length && itemGroups
            ? {childGroups: groupSections(children, itemGroups)}
            : {}),
        group: s['x-group'],
        advanced: s['x-advanced'] === true
    } as GroupedProp;
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
        .filter(([k]) => k.startsWith('x-') && k !== 'x-group' && k !== 'x-advanced')
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
