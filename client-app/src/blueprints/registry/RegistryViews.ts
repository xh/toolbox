import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {badge} from '@xh/hoist/cmp/badge';
import {div, hbox, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {jsonInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {isEmpty} from 'lodash';
import type {ReactNode} from 'react';
import {md} from '../markdown';
import {RegistryModel} from './RegistryModel';

/** A list row's name, with its label when it differs. */
export function entryName(
    name: string,
    label: string,
    origin: string,
    glyph?: ReactNode
): ReactNode {
    return div({
        className: 'tb-registry-item',
        children: [
            glyph ? span({className: 'tb-registry-item__glyph', children: glyph}) : null,
            span({className: 'tb-registry-item__name', children: name}),
            label ? span({className: 'tb-registry-item__label', children: label}) : null,
            origin === 'app' ? span({className: 'tb-registry-item__app', children: 'App'}) : null
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
export const exampleBody = hoistCmp.factory<RegistryModel>({
    model: uses(() => RegistryModel),
    render: ({model}) => {
        const entry = model.selected;
        switch (entry?.kind) {
            case 'variableType':
                if (model.noInputReason) return placeholder(model.noInputReason);
            // falls through
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
                const field = model.rendererUsers.sampleField;
                return hbox({
                    className: 'tb-registry__sample',
                    children: [
                        span({
                            className: 'tb-registry__label',
                            children: field?.label ?? field?.name ?? 'Value'
                        }),
                        textInput({
                            bind: 'sampleValue',
                            placeholder: 'Sample value',
                            commitOnChange: true,
                            width: 160
                        }),
                        span({className: 'tb-muted', children: '→'}),
                        div({
                            className: 'tb-registry__sample-body',
                            children: model.rendererSample
                        })
                    ]
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

/** What the entry is: the facts of its kind, and its guidance. */
export const entryFacts = hoistCmp.factory<RegistryModel>({
    model: uses(() => RegistryModel),
    render: ({model}) => {
        const entry = model.selected;
        if (!entry) return null;
        const {spec, kind} = entry,
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
        return props(rows);
    }
});

/** What `describe_registry` gives the Architect for the entry, over the prompt's index. */
export const architectView = hoistCmp.factory<RegistryModel>({
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
