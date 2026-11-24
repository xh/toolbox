import type {
    Blueprint,
    BlueprintElement,
    EditorNode,
    WidgetSpec
} from '@xh/hoist-chat-kit/blueprint';
import {
    DASHBOARD_COLUMNS,
    rescaleCells,
    SETTING_GROUPS,
    toEditorSpec
} from '@xh/hoist-chat-kit/blueprint';
import type {PlainObject} from '@xh/hoist/core';
import {upperFirst} from 'lodash';

/** One of a widget's settings, as a Built-ins page's options rail offers it. */
export interface BuiltinSetting {
    key: string;
    label: string;
    /** Its setting group, as `Appearance`, or `Children` for a child reference's setting. */
    section: string;
    kind: 'bool' | 'choice' | 'intent' | 'number';
    default?: unknown;
    /** For a choice: its values, in schema order. */
    options?: unknown[];
    /** For a choice: the kit's thumbnail name for each value, where it has pictures. */
    thumbnails?: Record<string, string>;
    /** For a bool: each value and its label, the positive state first. */
    boolOptions?: {value: boolean; label: string}[];
    min?: number;
    max?: number;
    /** True for a setting of each child reference, such as a dashboard cell's `hideHeader`. */
    perChild?: boolean;
}

/**
 * A widget's settings to try, read from its schema as its Inspector reads it: the booleans,
 * choices, intents and numbers of each setting group, in the groups' order, then the booleans of
 * each child reference. Field names and data bindings are left out.
 */
export function builtinSettings(spec: WidgetSpec): BuiltinSetting[] {
    const nodes = toEditorSpec(spec.config),
        groupOf = (key: string) => spec.config?.properties?.[key]?.['x-group'],
        own = SETTING_GROUPS.flatMap(group =>
            nodes
                .filter(it => groupOf(it.key) === group)
                .map(it => settingOf(it, upperFirst(group)))
                .filter(Boolean)
        ),
        perChild = toEditorSpec(spec.children?.schema)
            .filter(it => it.kind === 'boolean')
            .map(it => ({...settingOf(it, 'Children'), perChild: true}));
    return [...own, ...perChild];
}

/**
 * The ID of the element a Built-ins page's settings apply to: its widget's element in the example,
 * which may sit inside a panel that holds the example's inputs.
 */
export function settingTargetId(blueprint: Blueprint, widget: string): string {
    const {root, elements} = blueprint;
    if (elements[root]?.component === widget) return root;
    return Object.keys(elements).find(id => elements[id].component === widget) ?? root;
}

/** A setting's value in the example: its widget's, or its widget's first child reference's. */
export function settingValue(blueprint: Blueprint, widget: string, setting: BuiltinSetting) {
    const target: PlainObject = blueprint?.elements[settingTargetId(blueprint, widget)],
        holder = setting.perChild ? target?.children?.[0] : target?.config;
    return holder?.[setting.key] ?? setting.default;
}

/**
 * The example with a setting changed on its widget, or on each of its widget's child references.
 * A dashboard's cells rescale when its columns change.
 *
 * @param minWidth - an element's minimum width in columns, by its ID.
 */
export function withSetting(
    blueprint: Blueprint,
    widget: string,
    setting: BuiltinSetting,
    value: unknown,
    minWidth: (id: string) => number
): Blueprint {
    const id = settingTargetId(blueprint, widget),
        target: PlainObject = blueprint.elements[id],
        rescale = setting.key === 'columns' && target.children?.[0]?.w != null,
        children = rescale
            ? rescaleCells(
                  target.children,
                  (settingValue(blueprint, widget, setting) as number) ?? DASHBOARD_COLUMNS,
                  (value as number) ?? DASHBOARD_COLUMNS,
                  minWidth
              )
            : target.children,
        next = setting.perChild
            ? {
                  ...target,
                  children: target.children.map((it: PlainObject) => ({
                      ...it,
                      [setting.key]: value
                  }))
              }
            : {...target, children, config: {...target.config, [setting.key]: value}};
    return {...blueprint, elements: {...blueprint.elements, [id]: next as BlueprintElement}};
}

//------------------
// Implementation
//------------------
// Labels where the Inspector's reads badly out of its context.
const LABELS: Record<string, string> = {hideHeader: 'Cell headers'};

const INTENTS = ['none', 'primary', 'success', 'warning', 'danger'];

function settingOf(node: EditorNode, section: string): BuiltinSetting {
    if (!node) return null;
    const base = {
        key: node.key,
        label: LABELS[node.key] ?? node.label,
        section,
        default: node.default
    };
    switch (node.kind) {
        case 'boolean':
            return {...base, kind: 'bool', boolOptions: boolOptionsOf(node)};
        case 'number':
            return {...base, kind: 'number', min: node.min, max: node.max};
        case 'choice':
            return node.options.every(it => it == null || INTENTS.includes(it as string))
                ? {...base, kind: 'intent'}
                : {
                      ...base,
                      kind: 'choice',
                      options: node.options.filter(it => it !== true),
                      thumbnails: node.thumbnails
                  };
        default:
            return null;
    }
}

// A boolean named for its negative, such as `hideHeader`, with no labels of its own, shows first.
function boolOptionsOf(node: EditorNode & {kind: 'boolean'}): {value: boolean; label: string}[] {
    return !node.schema['x-labels'] && /^hide[A-Z]/.test(node.key)
        ? [
              {value: false, label: 'Show'},
              {value: true, label: 'Hide'}
          ]
        : node.labels;
}

/** The fewest columns a dashboard can have: its widest cell's minimum width. */
export function minColumns(minWidths: number[]): number {
    return Math.max(1, ...minWidths);
}
