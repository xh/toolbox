import type {EditorNode, WidgetSpec} from '@xh/hoist-chat-kit/blueprint';
import {toEditorSpec} from '@xh/hoist-chat-kit/blueprint';

/** One of a widget's settings, as a Built-ins page's options rail offers it. */
export interface BuiltinSetting {
    key: string;
    label: string;
    /** The Inspector section it belongs to, or `Children` for a child reference's setting. */
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
 * choices, intents and numbers of its sections, in section order, then the booleans of each child
 * reference. Field names and data bindings are left out.
 */
export function builtinSettings(spec: WidgetSpec): BuiltinSetting[] {
    const nodes = new Map(toEditorSpec(spec.config).map(it => [it.key, it])),
        own = (spec.sections ?? []).flatMap(section =>
            section.keys.map(key => settingOf(nodes.get(key), section.label)).filter(Boolean)
        ),
        perChild = toEditorSpec(spec.children?.schema)
            .filter(it => it.kind === 'boolean')
            .map(it => ({...settingOf(it, 'Children'), perChild: true}));
    return [...own, ...perChild];
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
