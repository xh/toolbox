import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hframe, span, vbox} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, codeInput, jsonInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {isEmpty} from 'lodash';
import type {ReactNode} from 'react';
import {RegistryModel} from './RegistryModel';

/** The dashboard and answer registries: every entry by kind and origin, and its details. */
export const registryPanel = hoistCmp.factory({
    displayName: 'RegistryPanel',
    model: creates(RegistryModel),

    render({model}) {
        return panel({
            className: 'tb-registry',
            tbar: [
                buttonGroupInput({
                    bind: 'context',
                    items: [
                        button({value: 'dashboard', text: 'Dashboard'}),
                        button({value: 'answer', text: 'Answers'})
                    ]
                }),
                buttonGroupInput({
                    bind: 'origins',
                    enableMulti: true,
                    items: [
                        button({value: 'built-in', text: 'Built-in'}),
                        button({value: 'chat kit', text: 'Chat kit'}),
                        button({value: 'app', text: 'App'})
                    ]
                }),
                filler(),
                button({
                    text: 'What the Architect sees',
                    icon: Icon.ai(),
                    active: model.showArchitect,
                    onClick: () => (model.showArchitect = !model.showArchitect)
                })
            ],
            item: hframe(
                panel({
                    modelConfig: {side: 'left', defaultSize: 220},
                    tbar: [
                        storeFilterField({
                            gridModel: model.listGridModel,
                            includeFields: ['name', 'label'],
                            flex: 1
                        })
                    ],
                    item: grid({model: model.listGridModel})
                }),
                model.showArchitect ? architectView() : detailView()
            )
        });
    }
});

const architectView = hoistCmp.factory<RegistryModel>(({model}) =>
    vbox({
        flex: 1,
        items: [
            panel({
                title: 'System prompt index (architectPrompt)',
                compactHeader: true,
                flex: 1,
                item: codeInput({
                    value: model.architectIndex,
                    readonly: true,
                    enableSearch: true,
                    flex: 1,
                    width: '100%'
                })
            }),
            panel({
                title: 'describe_registry, for the selected entry',
                compactHeader: true,
                flex: 1,
                item: jsonInput({
                    value: model.describeRegistryOutput,
                    readonly: true,
                    flex: 1,
                    width: '100%'
                })
            })
        ]
    })
);

const detailView = hoistCmp.factory<RegistryModel>(({model}) => {
    const entry = model.selected;
    if (!entry) return div({className: 'tb-registry__empty', item: 'Select an entry'});
    const {spec, kind} = entry,
        usedAt = model.selectedUsedAt,
        common: Row[] = [
            ['Name', entry.kind === 'presentation' ? `${entry.widget}.${entry.name}` : entry.name],
            ['Origin', entry.origin],
            ['Used by this blueprint', usedAt.length ? usedAt.join('\n') : 'No']
        ],
        guidance: Row = ['Guidance', spec.guidance],
        allowed: Row = [
            'Allowed in',
            [
                model.isIn('dashboard', entry) ? 'dashboards' : null,
                model.isIn('answer', entry) ? 'answers' : null
            ]
                .filter(Boolean)
                .join(' and ')
        ];

    let rows: Row[] = [],
        extra: ReactNode[] = [];
    switch (kind) {
        case 'widget':
            rows = [
                ['Label', spec.label],
                ['Category', spec.category],
                ['Terms', spec.terms?.join(', ')],
                ['Description', spec.description],
                guidance,
                ['Value type', spec.value?.type],
                [
                    'Outputs',
                    spec.outputs
                        ?.map(
                            (o: PlainObject) =>
                                `${o.name}: ${o.type}${o.description ? ` - ${o.description}` : ''}`
                        )
                        .join('\n')
                ],
                ['Preset paths', spec.presetPaths?.join(', ')],
                ['Children', spec.children ? (spec.children.accepts?.join(', ') ?? 'any') : null],
                ['Sizes', describeSizes(spec.size)],
                [
                    'Presentations',
                    ['panel', ...(spec.presentations ?? []).map((p: PlainObject) => p.name)].join(
                        ', '
                    )
                ],
                allowed
            ];
            extra = [
                schemaPanel('Config schema'),
                spec.example
                    ? panel({
                          title: 'Example',
                          compactHeader: true,
                          height: 220,
                          headerItems: [
                              button({
                                  text: 'Load into an empty blueprint',
                                  icon: Icon.add(),
                                  minimal: true,
                                  onClick: () => model.loadExample()
                              })
                          ],
                          item: jsonInput({
                              value: JSON.stringify(spec.example, null, 2),
                              readonly: true,
                              flex: 1,
                              width: '100%'
                          })
                      })
                    : null
            ];
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
                guidance,
                ['Current value', model.resolverValue]
            ];
            break;
        case 'action':
            rows = [
                ['Side effects', spec.sideEffects ? 'Yes - asks the user to confirm' : 'No'],
                allowed,
                guidance,
                ['Sample', model.actionSample]
            ];
            extra = [schemaPanel('Parameters')];
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
            extra = [
                panel({
                    title: users.sampleField
                        ? `Sample, as for ${users.sampleField.name}`
                        : 'Sample',
                    compactHeader: true,
                    className: 'tb-registry__sample',
                    tbar: [
                        textInput({
                            bind: 'sampleValue',
                            placeholder: 'Sample value',
                            commitOnChange: true,
                            width: 200
                        })
                    ],
                    item: div({className: 'tb-registry__sample-body', item: model.rendererSample})
                }),
                spec.config ? schemaPanel('Config schema') : null
            ];
            break;
        }
        case 'presentation':
            rows = [['Widget', entry.widget], ['Label', spec.label], guidance, allowed];
            break;
    }

    return panel({
        className: 'tb-registry__detail',
        scrollable: true,
        items: [propsTable([...common, ...rows]), ...extra]
    });
});

type Row = [string, ReactNode];

function propsTable(rows: Row[]) {
    return div({
        className: 'tb-registry__props',
        items: rows
            .filter(([, v]) => v != null && v !== '')
            .flatMap(([label, value]) => [
                span({className: 'tb-registry__label', item: label}),
                span({className: 'tb-registry__value', item: value})
            ])
    });
}

const schemaPanel = (title: string) => schemaGrid({title, key: title});

const schemaGrid = hoistCmp.factory<RegistryModel>(({model, title}) =>
    panel({
        title,
        compactHeader: true,
        height: 300,
        item: grid({model: model.schemaGridModel})
    })
);

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
