import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {badge} from '@xh/hoist/cmp/badge';
import {grid} from '@xh/hoist/cmp/grid';
import {div, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import {jsonInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {isEmpty} from 'lodash';
import type {ReactNode} from 'react';
import {md} from '../markdown';
import {RegistryModel} from './RegistryModel';

/** A list row's name, with its label when it differs. */
export function entryName(name: string, label: string): ReactNode {
    return div({
        className: 'tb-registry-item',
        children: [
            span({className: 'tb-registry-item__name', children: name}),
            label ? span({className: 'tb-registry-item__label', children: label}) : null
        ]
    });
}

export function usedBadge(count: number, usedAt: string[]): ReactNode {
    return span({
        title: usedAt?.join('\n'),
        children: badge({intent: 'success', compact: true, children: `${count} used`})
    });
}

/** The entry at work: a widget's example, live; a renderer's sample; an action's or resolver's output. */
export const entryExample = hoistCmp.factory<RegistryModel>({
    model: uses(() => RegistryModel),
    render: ({model}) => {
        const entry = model.selected;
        switch (entry?.kind) {
            case 'widget':
                return model.exampleModel
                    ? panel({
                          className: 'tb-registry__example',
                          children: blueprintView({model: model.exampleModel})
                      })
                    : placeholder(
                          model.exampleNeedsBlueprint
                              ? 'Container examples render in a full blueprint.'
                              : model.exampleError
                                ? `Cannot render: ${model.exampleError}`
                                : model.context === 'dashboard'
                                  ? 'This widget has no example.'
                                  : 'Examples render in the Dashboard registry only.'
                      );
            case 'renderer': {
                const users = model.rendererUsers;
                return panel({
                    className: 'tb-registry__sample',
                    tbar: [
                        span(
                            users.sampleField
                                ? `As for ${users.sampleField.name}:`
                                : 'Sample value:'
                        ),
                        textInput({
                            bind: 'sampleValue',
                            placeholder: 'Sample value',
                            commitOnChange: true,
                            width: 200
                        })
                    ],
                    children: div({
                        className: 'tb-registry__sample-body',
                        children: model.rendererSample
                    })
                });
            }
            case 'action':
                return props([['Sample', model.actionSample]]);
            case 'resolver':
                return props([['Current value', model.resolverValue]]);
            default:
                return null;
        }
    }
});

/** What the entry is, and its config or parameter schema. */
export const entryConfig = hoistCmp.factory<RegistryModel>({
    model: uses(() => RegistryModel),
    render: ({model}) => {
        const entry = model.selected;
        if (!entry) return null;
        const {spec, kind} = entry,
            usedAt = model.selectedUsedAt,
            guidance: Row = ['Guidance', md(spec.guidance)];
        let rows: Row[] = [];
        switch (kind) {
            case 'widget':
                rows = [['Category', spec.category], ['Value type', spec.value?.type], guidance];
                break;
            case 'variableType':
                rows = [
                    ['Base type', spec.matches],
                    ['Input', spec.input ? 'Custom input' : "The base type's input"],
                    guidance
                ];
                break;
            case 'resolver':
                rows = [
                    ['Returns', spec.returns],
                    [
                        'Parameters',
                        isEmpty(spec.args)
                            ? 'None'
                            : Object.entries(spec.args)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(', ')
                    ],
                    guidance
                ];
                break;
            case 'action':
                rows = [
                    ['Side effects', spec.sideEffects ? 'Yes - asks the user to confirm' : 'No'],
                    guidance
                ];
                break;
            case 'renderer': {
                const users = model.rendererUsers;
                rows = [
                    [
                        'Applies to',
                        [
                            spec.appliesTo?.types?.length
                                ? `types ${spec.appliesTo.types.join(', ')}`
                                : null,
                            spec.appliesTo?.kinds?.length
                                ? `kinds ${spec.appliesTo.kinds.join(', ')}`
                                : null
                        ]
                            .filter(Boolean)
                            .join('; ')
                    ],
                    ['Catalog kinds', users.kinds.join(', ') || 'None'],
                    ['Catalog fields', users.fields.join('\n') || 'None'],
                    guidance
                ];
                break;
            }
            case 'presentation':
                rows = [['Widget', entry.widget], guidance];
                break;
        }
        const schema = kind === 'action' ? spec.params : spec.config;
        return vbox({
            className: 'tb-registry__config',
            children: [
                props([
                    ...rows,
                    ['Used by this blueprint', usedAt.length ? usedAt.join('\n') : 'No'],
                    ['Allowed in', allowedIn(model)]
                ]),
                schema
                    ? panel({
                          title: kind === 'action' ? 'Parameters' : 'Config schema',
                          icon: Icon.code(),
                          compactHeader: true,
                          flex: 1,
                          minHeight: 200,
                          children: grid({model: model.schemaGridModel})
                      })
                    : null
            ]
        });
    }
});

/** A widget's outputs, preset paths, sizes, children and presentations. */
export const entryOutputs = hoistCmp.factory<RegistryModel>({
    model: uses(() => RegistryModel),
    render: ({model}) => {
        const spec = model.selected?.spec;
        if (model.selected?.kind !== 'widget') return null;
        return props([
            [
                'Outputs',
                md(
                    spec.outputs
                        ?.map(
                            (o: PlainObject) =>
                                `- \`${o.name}\`: ${o.type}${o.description ? ` - ${o.description}` : ''}`
                        )
                        .join('\n')
                ) ?? 'None'
            ],
            ['Preset paths', spec.presetPaths?.join(', ') || 'None'],
            ['Sizes', describeSizes(spec.size)],
            ['Terms', spec.terms?.join(', ')],
            ['Children', spec.children ? (spec.children.accepts?.join(', ') ?? 'any') : null],
            [
                'Presentations',
                ['panel', ...(spec.presentations ?? []).map((p: PlainObject) => p.name)].join(', ')
            ]
        ]);
    }
});

/** A widget's example as JSON, or the entry's spec. */
export const entryJson = hoistCmp.factory<RegistryModel>({
    model: uses(() => RegistryModel),
    render: ({model}) => {
        const entry = model.selected;
        if (!entry) return null;
        const value =
            entry.kind === 'widget' && entry.spec.example ? entry.spec.example : entry.spec;
        return jsonInput({
            value: safeJson(value),
            readonly: true,
            enableSearch: true,
            flex: 1,
            width: '100%'
        });
    }
});

/** What `describe_registry` gives the Architect for the entry, over the prompt's index. */
export const entryArchitect = hoistCmp.factory<RegistryModel>({
    model: uses(() => RegistryModel),
    render: ({model}) =>
        vbox({
            flex: 1,
            children: [
                panel({
                    title: 'describe_registry, for this entry',
                    compactHeader: true,
                    flex: 1,
                    children: jsonInput({
                        value: model.describeRegistryOutput,
                        readonly: true,
                        flex: 1,
                        width: '100%'
                    })
                }),
                panel({
                    title: 'System prompt index',
                    compactHeader: true,
                    modelConfig: {
                        side: 'bottom',
                        defaultSize: 260,
                        defaultCollapsed: true
                    },
                    scrollable: true,
                    children: div({
                        className: 'tb-registry__prompt',
                        children: md(model.architectIndex)
                    })
                })
            ]
        })
});

//------------------
// Implementation
//------------------
type Row = [string, ReactNode];

function props(rows: Row[]) {
    return div({
        className: 'tb-registry__props',
        children: rows
            .filter(([, v]) => v != null && v !== '')
            .flatMap(([label, value]) => [
                span({className: 'tb-registry__label', children: label}),
                span({className: 'tb-registry__value', children: value})
            ])
    });
}

function allowedIn(model: RegistryModel): string {
    const entry = model.selected;
    return [
        model.isIn('dashboard', entry) ? 'dashboards' : null,
        model.isIn('answer', entry) ? 'answers' : null
    ]
        .filter(Boolean)
        .join(' and ');
}

function describeSizes(size: PlainObject): string {
    if (!size) return null;
    const fmt = (s: PlainObject) => (s ? `${s.w}×${s.h}` : null);
    return [
        `default ${fmt(size.default)}`,
        size.min ? `min ${fmt(size.min)}` : null,
        size.max ? `max ${fmt(size.max)}` : null
    ]
        .filter(Boolean)
        .join(', ');
}

function safeJson(value: unknown): string {
    try {
        return JSON.stringify(value, (k, v) => (typeof v === 'function' ? '[function]' : v), 2);
    } catch (e) {
        return `Cannot show as JSON: ${e.message}`;
    }
}
