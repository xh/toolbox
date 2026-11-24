import {badge} from '@xh/hoist/cmp/badge';
import {div, filler, hbox, hframe, span, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import type {HoistProps, PlainObject} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import {isEmpty} from 'lodash';
import type {ReactNode} from 'react';
import {useRef} from 'react';
import {band, chips, tag} from '../cards';
import {md} from '../markdown';
import {anchorProps, topAnchor, useScrollTarget} from '../scrollSpy';
import {RegistryModel} from './RegistryModel';
import type {SchemaProp, SchemaSection} from './registrySchema';
import {architectView, entryFacts, exampleBody} from './RegistryViews';

const ANCHORS = 'tb-registry';

/**
 * An entry's page: its header and live example, then its config, slots, outputs, presets and
 * usage under an index that follows the scroll, beside what the Architect sees.
 */
export const entryPage = hoistCmp.factory<RegistryModel>({
    model: uses(() => RegistryModel),
    render: ({model}) =>
        hframe({
            className: 'tb-registry__page',
            children: [
                entryBody(),
                panel({
                    model: model.architectPanelModel,
                    className: 'tb-registry__architect',
                    title: 'What the Architect sees',
                    icon: Icon.ai(),
                    compactHeader: true,
                    children: architectView()
                })
            ]
        })
});

const entryHeader = hoistCmp.factory<RegistryModel>({
    model: uses(() => RegistryModel),
    render: ({model}) => {
        const entry = model.selected,
            {spec} = entry,
            name = entry.kind === 'presentation' ? `${entry.widget}.${entry.name}` : entry.name,
            draft = model.panelModel.draftName,
            description = spec.description ?? spec.guidance,
            hasExample = ['widget', 'variableType', 'renderer', 'action', 'resolver'].includes(
                entry.kind
            );
        return vbox({
            className: 'tb-registry__header',
            children: [
                hbox({
                    className: 'tb-registry__title',
                    children: [
                        span({className: 'tb-registry__name', children: name}),
                        entry.label && entry.label !== name
                            ? span({className: 'tb-registry__label-text', children: entry.label})
                            : null,
                        badge({compact: true, children: entry.origin}),
                        badge({compact: true, children: entry.kind}),
                        filler(),
                        entry.kind === 'widget'
                            ? segmentedControl({
                                  bind: 'context',
                                  compact: true,
                                  intent: 'primary',
                                  options: [
                                      {value: 'dashboard', label: 'Dashboard'},
                                      {value: 'answer', label: 'Chat answer'}
                                  ]
                              })
                            : null,
                        button({
                            text: draft ? `Add to ${draft}` : 'Add to a blueprint',
                            icon: Icon.add(),
                            intent: 'primary',
                            minimal: false,
                            omit: !(model.context === 'dashboard' && entry.kind === 'widget'),
                            disabled: !model.canAddToDraft,
                            tooltip: draft ? null : 'Open a blueprint to add to it',
                            onClick: () => model.addToDraft()
                        }),
                        button({
                            text: 'Add as a new blueprint',
                            icon: Icon.copy(),
                            omit: !(
                                model.context === 'dashboard' &&
                                entry.kind === 'widget' &&
                                spec.example &&
                                !model.exampleNeedsBlueprint
                            ),
                            onClick: () => model.loadExample()
                        }),
                        button({
                            icon: Icon.ai(),
                            tooltip: 'What the Architect sees',
                            onClick: () => model.architectPanelModel.toggleCollapsed()
                        })
                    ]
                }),
                description
                    ? div({className: 'tb-registry__description', children: md(description)})
                    : null,
                hasExample
                    ? div({className: 'tb-registry__example-box', children: exampleBody()})
                    : null
            ]
        });
    }
});

const entryBody = hoistCmp.factory<RegistryModel>({
    model: uses(() => RegistryModel),
    render: ({model}) => {
        const scrollRef = useRef<HTMLDivElement>(null),
            sections = model.pageSections;
        useScrollTarget(ANCHORS, model.scrollTarget, () => model.clearScrollTarget());
        return hframe({
            className: 'tb-registry__body',
            children: [
                vbox({
                    className: 'tb-index',
                    children: sections.map(({id, title}) =>
                        div({
                            key: id,
                            className: classNames(
                                'tb-index__entry',
                                model.activeAnchor === id && 'tb-index__entry--active'
                            ),
                            onClick: () => model.goTo(id),
                            children: title
                        })
                    )
                }),
                div({
                    ref: scrollRef,
                    className: 'tb-registry__scroll',
                    onScroll: () => (model.activeAnchor = topAnchor(scrollRef.current)),
                    children: [
                        entryHeader({key: 'header'}),
                        ...sections.map(({id, title}) =>
                            div({
                                key: id,
                                ...anchorProps(ANCHORS, id),
                                className: 'tb-registry__section',
                                children: [
                                    div({className: 'tb-registry__section-title', children: title}),
                                    sectionContent(model, id)
                                ]
                            })
                        )
                    ]
                })
            ]
        });
    }
});

function sectionContent(model: RegistryModel, id: string): ReactNode {
    const spec = model.selected.spec;
    switch (id) {
        case 'config':
            return [
                entryFacts({key: 'facts'}),
                ...model.schemaSections.map(section =>
                    div({
                        key: section.title,
                        className: 'tb-card-group',
                        children: [
                            band(section.title, section.props.length + section.more.length),
                            ...sectionCards(section)
                        ]
                    })
                ),
                isEmpty(model.schemaSections)
                    ? span({key: 'empty', className: 'tb-muted', children: 'No config.'})
                    : null
            ];
        case 'slots':
            return cardList(
                Object.entries<PlainObject>(spec.children.slots).map(([name, slot]) =>
                    simpleCard({
                        key: name,
                        name,
                        tags: [
                            ...acceptsTags(slot.accepts),
                            slot.maxItems ? tag(`at most ${slot.maxItems}`) : null
                        ],
                        prose: slot.description,
                        props: slot.terms?.length ? [['terms', slot.terms.join(', ')]] : []
                    })
                )
            );
        case 'outputs':
            return cardList(
                spec.outputs.map((o: PlainObject) =>
                    simpleCard({
                        key: o.name,
                        name: o.name,
                        tags: [tag(String(o.type))],
                        prose: o.description
                    })
                )
            );
        case 'presets':
            return presetsAndSizes(spec);
        case 'usage':
            return usage(model);
    }
}

interface PropCardProps extends HoistProps<RegistryModel> {
    prop: SchemaProp;
}

/** A property: name, label, types, values and tags, its default, its description, and any properties it holds. */
const propCard = hoistCmp.factory<PropCardProps>({
    model: uses(() => RegistryModel),
    render: ({model, prop}) => {
        const open = model.expanded.has(prop.path);
        return div({
            className: 'tb-card tb-prop-card',
            children: [
                hbox({
                    className: 'tb-card__line',
                    children: [
                        span({className: 'tb-card__name', children: prop.key}),
                        prop.label.toLowerCase() !== prop.key.toLowerCase()
                            ? span({children: prop.label})
                            : null,
                        prop.required ? tag('required', 'danger') : null,
                        filler(),
                        ...prop.tags.map(it => tag(it.text, null, it.title)),
                        ...prop.types.map(it => tag(it))
                    ]
                }),
                prop.enumValues
                    ? chips(prop.enumValues.map(text => ({text, intent: 'primary' as const})))
                    : null,
                prop.description
                    ? div({className: 'tb-card__prose', children: md(prop.description)})
                    : null,
                prop.default !== undefined
                    ? hbox({
                          className: 'tb-card__props',
                          children: span([
                              'default ',
                              span({className: 'tb-mono', children: prop.default})
                          ])
                      })
                    : null,
                prop.children
                    ? div({
                          className: 'tb-prop-card__disclosure',
                          onClick: () => model.toggleExpanded(prop.path),
                          children: [
                              open ? Icon.chevronDown() : Icon.chevronRight(),
                              ` ${prop.children.length} properties of ${prop.childrenOf}`
                          ]
                      })
                    : null,
                open
                    ? div({
                          className: 'tb-prop-card__children',
                          children: prop.childGroups
                              ? prop.childGroups.flatMap(group => [
                                    div({
                                        key: `${group.title}-title`,
                                        className: 'tb-card-group__title',
                                        children: group.title
                                    }),
                                    ...sectionCards(group)
                                ])
                              : prop.children.map(child => propCard({key: child.path, prop: child}))
                      })
                    : null
            ]
        });
    }
});

//------------------
// Implementation
//------------------
// A section's cards, then its advanced ones under More.
function sectionCards(section: SchemaSection): ReactNode[] {
    const {title, props, more} = section,
        cards = (key: string, list: SchemaProp[]) =>
            div({
                key,
                className: 'tb-cards',
                children: list.map(prop => propCard({key: prop.path, prop}))
            });
    return [
        props.length ? cards(`${title}-common`, props) : null,
        more.length
            ? div({key: `${title}-more`, className: 'tb-card-group__title', children: 'More'})
            : null,
        more.length ? cards(`${title}-advanced`, more) : null
    ];
}

interface SimpleCardSpec {
    key: string;
    name: string;
    tags?: ReactNode[];
    prose?: string;
    props?: [string, string][];
}

function simpleCard({key, name, tags = [], prose, props = []}: SimpleCardSpec) {
    return div({
        key,
        className: 'tb-card',
        children: [
            hbox({
                className: 'tb-card__line',
                children: [span({className: 'tb-card__name', children: name}), filler(), ...tags]
            }),
            prose ? div({className: 'tb-card__prose', children: md(prose)}) : null,
            props.length
                ? hbox({
                      className: 'tb-card__props',
                      children: props.map(([k, v]) =>
                          span({
                              key: k,
                              children: [k, ' ', span({className: 'tb-mono', children: v})]
                          })
                      )
                  })
                : null
        ]
    });
}

function cardList(cards: ReactNode[]) {
    return div({className: 'tb-cards tb-cards--bordered', children: cards});
}

function acceptsTags(accepts: PlainObject): ReactNode[] {
    const parts = [...(accepts?.categories ?? []), ...(accepts?.widgets ?? [])];
    return parts.length ? parts.map(it => tag(it, 'success')) : [tag('any widget')];
}

function presetsAndSizes(spec: PlainObject): ReactNode {
    const size = spec.size,
        fmt = (s: PlainObject) => (s ? `${s.w}×${s.h}` : null);
    return div({
        className: 'tb-registry__facts',
        children: [
            [
                'Preset paths',
                spec.presetPaths?.length
                    ? chips(spec.presetPaths.map((text: string) => ({text})))
                    : 'None'
            ],
            [
                'Sizes',
                size
                    ? [
                          `default ${fmt(size.default)}`,
                          size.min ? `min ${fmt(size.min)}` : null,
                          size.max ? `max ${fmt(size.max)}` : null
                      ]
                          .filter(Boolean)
                          .join(', ')
                    : null
            ],
            ['Terms', spec.terms?.join(', ')],
            [
                'Presentations',
                ['panel', ...(spec.presentations ?? []).map((p: PlainObject) => p.name)].join(', ')
            ]
        ]
            .filter(([, v]) => v)
            .flatMap(([label, value]) => [
                span({key: `${label}-k`, className: 'tb-registry__label', children: label}),
                div({key: `${label}-v`, className: 'tb-registry__value', children: value})
            ])
    });
}

function usage(model: RegistryModel): ReactNode {
    const entry = model.selected,
        hasDocument = !!model.panelModel.documentModel.document,
        users = usedBy(model.selectedUsedAt),
        allowed = [
            model.isIn('dashboard', entry) ? 'dashboards' : null,
            model.isIn('answer', entry) ? 'answers' : null
        ].filter(Boolean);
    return div({
        className: 'tb-registry__facts',
        children: [
            span({key: 'u-k', className: 'tb-registry__label', children: 'Used by this blueprint'}),
            div({
                key: 'u-v',
                className: 'tb-registry__value',
                children: !hasDocument
                    ? span({
                          className: 'tb-muted',
                          children: "Open a blueprint to see where it's used."
                      })
                    : users.length
                      ? chips(
                            users.map(({kind, id}) => ({
                                text: id,
                                title: `Show ${id} in the blueprint`,
                                intent: kind === 'source' ? ('success' as const) : null,
                                onClick: () => model.reveal({kind, id})
                            }))
                        )
                      : span({className: 'tb-muted', children: 'Nothing in the blueprint open.'})
            }),
            span({key: 'a-k', className: 'tb-registry__label', children: 'Allowed in'}),
            div({key: 'a-v', className: 'tb-registry__value', children: allowed.join(' and ')})
        ]
    });
}

// The elements and sources a blueprint's usage paths name, each once, in order.
function usedBy(paths: string[]): {kind: 'element' | 'source'; id: string}[] {
    const seen = new Set<string>();
    return paths.flatMap(path => {
        const [, coll, id] = path.split('/'),
            kind = coll === 'elements' ? 'element' : coll === 'sources' ? 'source' : null;
        if (!kind || !id || seen.has(`${kind}:${id}`)) return [];
        seen.add(`${kind}:${id}`);
        return [{kind, id}];
    });
}
