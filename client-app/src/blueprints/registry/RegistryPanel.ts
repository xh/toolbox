import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {badge} from '@xh/hoist/cmp/badge';
import {card} from '@xh/hoist/cmp/card';
import {grid} from '@xh/hoist/cmp/grid';
import {box, div, filler, hbox, hframe, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import type {HoistProps, PlainObject} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, jsonInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {isEmpty} from 'lodash';
import type {ReactNode} from 'react';
import {md} from '../markdown';
import {RegistryModel} from './RegistryModel';
import type {RegistryEntry} from './registryEntries';

/** The dashboard and answer registries: every entry by kind and origin, each a card. */
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
                textInput({
                    bind: 'query',
                    placeholder: 'Search...',
                    leftIcon: Icon.search(),
                    commitOnChange: true,
                    enableClear: true,
                    width: 180
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
                entryCards(),
                model.showArchitect
                    ? panel({
                          modelConfig: {side: 'right', defaultSize: 420},
                          item: architectView()
                      })
                    : null
            )
        });
    }
});

/** The entries shown, under a heading per kind, each a card that expands to its details. */
const entryCards = hoistCmp.factory<RegistryModel>(({model}) => {
    const {sections} = model;
    return vbox({
        className: 'tb-registry__cards',
        flex: 1,
        items: sections.length
            ? sections.flatMap(({kind, label, entries}) => [
                  div({
                      key: `head-${kind}`,
                      className: 'tb-registry__section',
                      item: `${label} (${entries.length})`
                  }),
                  ...entries.map(it => entryCard({...it, key: it.entry.id}))
              ])
            : div({className: 'tb-registry__empty', item: 'No entries'})
    });
});

interface EntryCardProps extends HoistProps<RegistryModel> {
    entry: RegistryEntry;
    name: string;
    usedAt: string[];
}

const entryCard = hoistCmp.factory<EntryCardProps>(({model, entry, name, usedAt}) => {
    const expanded = model.selectedId === entry.id,
        {label, spec} = entry,
        description = spec.description ?? spec.guidance;
    return div({
        className: `tb-dataset${expanded ? ' tb-dataset--expanded' : ''}`,
        items: [
            hbox({
                className: 'tb-dataset__header',
                onClick: () => model.toggle(entry.id),
                items: [
                    expanded ? Icon.chevronDown() : Icon.chevronRight(),
                    span({className: 'tb-dataset__name', item: name}),
                    label && label !== name
                        ? span({className: 'tb-dataset__label', item: label})
                        : null,
                    filler(),
                    usedAt.length
                        ? badge({
                              intent: 'success',
                              icon: Icon.check(),
                              title: usedAt.join('\n'),
                              item: `${usedAt.length} used`
                          })
                        : null,
                    badge({item: entry.origin})
                ]
            }),
            description && !expanded
                ? div({className: 'tb-dataset__description', item: md(firstLine(description))})
                : null,
            expanded ? detailView() : null
        ]
    });
});

const architectView = hoistCmp.factory<RegistryModel>(({model}) =>
    vbox({
        flex: 1,
        items: [
            panel({
                title: 'System prompt index (architectPrompt)',
                compactHeader: true,
                flex: 1,
                scrollable: true,
                item: div({className: 'tb-registry__prompt', item: md(model.architectIndex)})
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
    if (!entry) return null;
    const {spec, kind} = entry,
        usedAt = model.selectedUsedAt,
        common: Row[] = [
            ['Name', entry.kind === 'presentation' ? `${entry.widget}.${entry.name}` : entry.name],
            ['Origin', entry.origin],
            ['Used by this blueprint', usedAt.length ? usedAt.join('\n') : 'No']
        ],
        guidance: Row = ['Guidance', md(spec.guidance)],
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
                ['Description', md(spec.description)],
                guidance,
                ['Value type', spec.value?.type],
                [
                    'Outputs',
                    md(
                        spec.outputs
                            ?.map(
                                (o: PlainObject) =>
                                    `- \`${o.name}\`: ${o.type}${o.description ? ` - ${o.description}` : ''}`
                            )
                            .join('\n')
                    )
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
            extra = [schemaPanel('Config schema'), spec.example ? exampleCard() : null];
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

    return vbox({
        className: 'tb-registry__detail',
        items: [propsTable([...common, ...rows]), ...extra]
    });
});

/** A widget's example: rendered live, as JSON, and added to the library as a blueprint. */
const exampleCard = hoistCmp.factory<RegistryModel>(({model}) => {
    const {exampleModel, exampleError} = model,
        json = JSON.stringify(model.selected.spec.example, null, 2);
    return card({
        title: 'Example',
        icon: Icon.play(),
        items: [
            hbox({
                className: 'tb-registry__example-bar',
                items: [
                    filler(),
                    button({
                        text: 'Add as a new blueprint',
                        icon: Icon.add(),
                        minimal: true,
                        onClick: () => model.loadExample()
                    })
                ]
            }),
            exampleModel
                ? box({
                      className: 'tb-registry__example',
                      item: blueprintView({model: exampleModel})
                  })
                : div({
                      className: 'tb-registry__empty',
                      item: exampleError
                          ? `Cannot render: ${exampleError}`
                          : 'Renders in the Dashboard registry only.'
                  }),
            jsonInput({value: json, readonly: true, height: 160, width: '100%'})
        ]
    });
});

function firstLine(text: string): string {
    return text.split('\n')[0];
}

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
    card({
        title,
        icon: Icon.code(),
        item: grid({model: model.schemaGridModel, height: 300})
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
