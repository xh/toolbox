import {chip} from '@xh/hoist/cmp/chip';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hbox, hframe, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import type {HoistProps, Intent} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput, segmentedControl, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import type {FieldDef} from '@xh/hoist-chat-kit/blueprint';
import type {ReactNode} from 'react';
import {useRef} from 'react';
import {copyTextAsync} from '../copyLink';
import {anchorProps, topAnchor, useScrollTarget} from '../scrollSpy';
import {md} from '../markdown';
import {fieldProps} from './catalogFields';
import {CatalogModel, KINDS_AND_FORMATS} from './CatalogModel';
import type {CatalogItem, DatasetCardModel} from './CatalogModel';

const ANCHORS = 'tb-catalog';

/** A list entry's name, with its short line on the right. */
export function catalogEntryName(name: string, meta: string): ReactNode {
    return hbox({
        className: 'tb-catalog-entry',
        children: [
            span({className: 'tb-catalog-entry__name', children: name}),
            filler(),
            meta ? span({className: 'tb-catalog-entry__meta', children: meta}) : null
        ]
    });
}

/** The list of datasets, and the entry for the kinds and formats, filtered by one query. */
export const catalogList = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) =>
        panel({
            className: 'tb-catalog__list',
            modelConfig: {side: 'left', defaultSize: 260, minSize: 200, collapsible: false},
            tbar: [
                textInput({
                    bind: 'query',
                    placeholder: 'Filter datasets and fields',
                    leftIcon: Icon.filter(),
                    commitOnChange: true,
                    enableClear: true,
                    flex: 1
                }),
                button({
                    icon: Icon.code(),
                    tooltip: "The whole catalog's JSON",
                    onClick: () => model.showJson({kind: 'catalog'})
                })
            ],
            children: grid({model: model.listModel})
        })
});

/** The selected entry's detail: a dataset's fields, or every kind and format. */
export const catalogDetail = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) => {
        if (model.selectedId === KINDS_AND_FORMATS) return kindsAndFormats();
        const ds = model.selectedDataset;
        return ds
            ? datasetDetail({model: ds, key: ds.ds.name})
            : placeholder('Pick a dataset, or the kinds and formats.');
    }
});

/** The JSON of the item selected, as the catalog serves it, with Copy. Closed by default. */
export const catalogJsonPanel = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) => {
        const {json} = model;
        return panel({
            model: model.jsonPanelModel,
            className: 'tb-catalog__json',
            title: json ? `JSON · ${json.title}` : 'JSON',
            icon: Icon.code(),
            compactHeader: true,
            bbar: [
                filler(),
                button({
                    text: 'Copy',
                    icon: Icon.copy(),
                    disabled: !json,
                    onClick: () => copyTextAsync(json.text, 'JSON')
                })
            ],
            children: json
                ? jsonInput({value: json.text, readonly: true, flex: 1, width: '100%'})
                : placeholder('Pick a field, kind or format.')
        });
    }
});

//------------------
// Dataset
//------------------
const datasetDetail = hoistCmp.factory<DatasetCardModel>(({model}) => {
    const catalog = model.catalogModel,
        {ds} = model;
    useScrollTarget(ANCHORS, catalog.scrollTarget, () => catalog.clearScrollTarget());
    return div({
        className: 'tb-catalog-detail',
        children: [
            datasetHeader({model}),
            ...model.groups.map(group =>
                div({
                    key: group.title,
                    className: 'tb-catalog-detail__group',
                    children: [
                        band(group.title, group.fields.length),
                        div({
                            className: 'tb-catalog-detail__cards',
                            children: group.fields.map(f =>
                                fieldCard({key: f.name, model, field: f})
                            )
                        })
                    ]
                })
            )
        ],
        onClick: e => {
            if (e.target === e.currentTarget) catalog.selectItem({kind: 'dataset', name: ds.name});
        }
    });
});

const datasetHeader = hoistCmp.factory<DatasetCardModel>(({model}) => {
    const catalog = model.catalogModel,
        {ds, joins, params, description} = model,
        draft = catalog.panelModel.draftName,
        {sources, elements} = catalog.users,
        hasDocument = !!catalog.panelModel.documentModel.document;
    return div({
        className: 'tb-catalog-detail__head',
        children: [
            hbox({
                className: 'tb-catalog-detail__head-top',
                children: [
                    span({className: 'tb-catalog-detail__name', children: ds.name}),
                    ds.label && ds.label !== ds.name
                        ? span({className: 'tb-muted', children: ds.label})
                        : null,
                    filler(),
                    segmentedControl({
                        model: catalog,
                        bind: 'fieldsGrouping',
                        intent: 'primary',
                        options: [
                            {value: 'group', label: 'By group'},
                            {value: 'kind', label: 'By kind'}
                        ]
                    }),
                    jsonButton(catalog, {kind: 'dataset', name: ds.name}),
                    button({
                        text: `Add as source to ${draft}`,
                        icon: Icon.add(),
                        intent: 'primary',
                        minimal: false,
                        omit: !draft,
                        onClick: () => catalog.addAsSource()
                    })
                ]
            }),
            description
                ? div({className: 'tb-catalog-detail__description', children: md(description)})
                : null,
            facts([
                [
                    'Grain',
                    ds.key?.length
                        ? span({className: 'tb-mono', children: ds.key.join(' · ')})
                        : null
                ],
                [
                    'Joins',
                    joins.length
                        ? chips(
                              joins.map(j => ({
                                  text: `${j.dataset} on ${j.on.join(', ')}`,
                                  title: `Show ${j.dataset}`,
                                  intent: 'success',
                                  onClick: () => catalog.select(`dataset:${j.dataset}`)
                              }))
                          )
                        : null
                ],
                [
                    'Parameters',
                    params.length
                        ? chips(
                              params.map(p => ({
                                  text: [p.name, p.type, p.required ? 'required' : null]
                                      .filter(Boolean)
                                      .join(' · '),
                                  title: [p.label, p.description].filter(Boolean).join(': ')
                              }))
                          )
                        : null
                ],
                [
                    'Used by',
                    !hasDocument
                        ? span({
                              className: 'tb-muted',
                              children: 'Open a blueprint to see what reads it.'
                          })
                        : sources.length
                          ? chips([
                                ...sources.map(id => ({
                                    text: id,
                                    title: `Show ${id} in the blueprint`,
                                    intent: 'success' as Intent,
                                    onClick: () => catalog.reveal({kind: 'source', id})
                                })),
                                ...elements.map(id => ({
                                    text: id,
                                    title: `Show ${id} in the blueprint`,
                                    onClick: () => catalog.reveal({kind: 'element', id})
                                }))
                            ])
                          : span({
                                className: 'tb-muted',
                                children: 'Nothing in the blueprint open.'
                            })
                ]
            ])
        ]
    });
});

interface FieldCardProps extends HoistProps<DatasetCardModel> {
    field: FieldDef;
}

const fieldCard = hoistCmp.factory<FieldCardProps>(({model, field}) => {
    const catalog = model.catalogModel,
        item: CatalogItem = {kind: 'field', dataset: model.ds.name, name: field.name},
        {item: sel} = catalog,
        selected = sel?.kind === 'field' && sel.dataset === item.dataset && sel.name === item.name,
        usedAt = model.usedAt(field.name),
        guidance = [field.description, field.guidance].filter(Boolean).join(' '),
        props = fieldProps(field);
    return div({
        ...anchorProps(ANCHORS, `field:${model.ds.name}.${field.name}`),
        className: classNames('tb-field-card', selected && 'tb-field-card--selected'),
        onClick: () => catalog.selectItem(item),
        children: [
            hbox({
                className: 'tb-field-card__line',
                children: [
                    span({className: 'tb-field-card__name', children: field.name}),
                    field.label && field.label !== field.name
                        ? span({children: field.label})
                        : null,
                    filler(),
                    usedAt ? tag('used', 'success', `Used at:\n${usedAt}`) : null,
                    tag(field.type),
                    field.isDimension ? tag('dimension', 'primary') : tag('measure', 'success'),
                    jsonButton(catalog, item)
                ]
            }),
            guidance ? div({className: 'tb-field-card__guidance', children: md(guidance)}) : null,
            props.length
                ? hbox({
                      className: 'tb-field-card__props',
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
});

//------------------
// Kinds and formats
//------------------
const kindsAndFormats = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) => {
        const {kinds, formats} = model.kindsAndFormats,
            scrollRef = useRef<HTMLDivElement>(null);
        useScrollTarget(ANCHORS, model.scrollTarget, () => model.clearScrollTarget());
        return hframe({
            className: 'tb-kinds',
            children: [
                vbox({
                    className: 'tb-index',
                    children: [
                        indexGroup(model, 'Kinds', 'kind', kinds),
                        indexGroup(model, 'Formats', 'format', formats)
                    ]
                }),
                div({
                    ref: scrollRef,
                    className: 'tb-catalog-detail',
                    onScroll: () => (model.activeAnchor = topAnchor(scrollRef.current)),
                    children: [
                        band('Kinds', kinds.length),
                        div({
                            className: 'tb-catalog-detail__cards',
                            children: kinds.map(name => kindCard({key: name, name}))
                        }),
                        band('Formats', formats.length),
                        div({
                            className: 'tb-catalog-detail__cards',
                            children: formats.map(name => formatCard({key: name, name}))
                        })
                    ]
                })
            ]
        });
    }
});

function indexGroup(model: CatalogModel, title: string, kind: string, names: string[]) {
    return vbox({
        key: kind,
        className: 'tb-index__group',
        children: [
            hbox({
                className: 'tb-index__head',
                children: [span(title), filler(), span(String(names.length))]
            }),
            ...names.map(name => {
                const anchor = `${kind}:${name}`;
                return div({
                    key: anchor,
                    className: classNames(
                        'tb-index__entry',
                        model.activeAnchor === anchor && 'tb-index__entry--active'
                    ),
                    onClick: () => model.goTo(anchor),
                    children: name
                });
            })
        ]
    });
}

interface NamedProps extends HoistProps<CatalogModel> {
    name: string;
}

const kindCard = hoistCmp.factory<NamedProps>({
    model: uses(() => CatalogModel),
    render: ({model, name}) => {
        const kind = model.catalog.kinds[name],
            fields = model.fieldsOfKind(name),
            agg = kind?.aggregator ? describeText(kind.aggregator) : null;
        return entryCard(model, {
            item: {kind: 'kind', name},
            head: kind?.base ? tag(kind.base) : null,
            left: [
                div({
                    className: 'tb-entry-card__hint',
                    children: [
                        'Format ',
                        span({className: 'tb-mono', children: model.kindFormat(name) ?? 'none'}),
                        agg ? ` · aggregator ${agg}` : null
                    ]
                }),
                samplesTable(model.samples({kind: name}))
            ],
            right: [
                div({className: 'tb-entry-card__hint', children: 'Used by'}),
                fields.length
                    ? chips(
                          fields.map(({dataset, field}) => ({
                              text: `${dataset}.${field}`,
                              title: `Show ${field} in ${dataset}`,
                              intent: 'success',
                              onClick: () => model.openField(dataset, field)
                          }))
                      )
                    : span({className: 'tb-muted', children: 'No field carries it.'})
            ]
        });
    }
});

const formatCard = hoistCmp.factory<NamedProps>({
    model: uses(() => CatalogModel),
    render: ({model, name}) => {
        const kinds = model.kindsOfFormat(name);
        return entryCard(model, {
            item: {kind: 'format', name},
            left: [
                div({
                    className: 'tb-entry-card__hint',
                    children: [
                        'Options ',
                        span({className: 'tb-mono', children: model.formatOptions(name) || 'none'})
                    ]
                }),
                samplesTable(model.samples({format: name}))
            ],
            right: [
                div({className: 'tb-entry-card__hint', children: 'Kinds'}),
                kinds.length
                    ? chips(
                          kinds.map(k => ({
                              text: k,
                              title: `Show the ${k} kind`,
                              onClick: () => model.goTo(`kind:${k}`)
                          }))
                      )
                    : span({className: 'tb-muted', children: 'No kind uses it.'})
            ]
        });
    }
});

interface EntryCardSpec {
    item: {kind: 'kind' | 'format'; name: string};
    head?: ReactNode;
    left: ReactNode[];
    right: ReactNode[];
}

// A kind's or format's card, which selects it on a click.
function entryCard(model: CatalogModel, {item, head, left, right}: EntryCardSpec) {
    const sel = model.item,
        selected = sel?.kind === item.kind && sel.name === item.name;
    return div({
        ...anchorProps(ANCHORS, `${item.kind}:${item.name}`),
        className: classNames('tb-entry-card', selected && 'tb-entry-card--selected'),
        onClick: () => model.selectItem(item),
        children: [
            hbox({
                className: 'tb-entry-card__head',
                children: [
                    span({className: 'tb-entry-card__name', children: item.name}),
                    head,
                    filler(),
                    jsonButton(model, item)
                ]
            }),
            hbox({
                className: 'tb-entry-card__body',
                children: [
                    vbox({className: 'tb-entry-card__col', children: left}),
                    vbox({className: 'tb-entry-card__col', children: right})
                ]
            })
        ]
    });
}

function samplesTable(samples: {value: number; text: ReactNode}[]) {
    return div({
        className: 'tb-entry-card__samples',
        children: samples.flatMap(({value, text}) => [
            span({key: `${value}-v`, className: 'tb-mono tb-muted', children: String(value)}),
            span({
                key: `${value}-t`,
                className: classNames('tb-mono', value < 0 && 'xh-red'),
                children: text
            })
        ])
    });
}

//------------------
// Implementation
//------------------
// A div, not a box, whose inline position would undo the sticky one.
function band(title: string, count: number) {
    return div({
        className: 'tb-catalog-detail__band',
        children: [span(title), span({className: 'tb-catalog-detail__band-count', children: count})]
    });
}

function tag(text: string, intent?: Intent, title?: string) {
    return span({
        key: `tag-${text}`,
        title,
        children: chip({
            className: 'xh-font-family-mono',
            minimal: true,
            size: 'compact',
            intent,
            children: text
        })
    });
}

function jsonButton(model: CatalogModel, item: CatalogItem) {
    return button({
        key: 'json',
        icon: Icon.code(),
        minimal: true,
        tooltip: 'Show its JSON',
        onClick: e => {
            e.stopPropagation();
            model.showJson(item);
        }
    });
}

type Fact = [string, ReactNode];

function facts(rows: Fact[]) {
    return div({
        className: 'tb-catalog-detail__facts',
        children: rows
            .filter(([, v]) => v != null && v !== '')
            .flatMap(([label, value]) => [
                span({
                    key: `${label}-k`,
                    className: 'tb-catalog-detail__fact-label',
                    children: label
                }),
                div({
                    key: `${label}-v`,
                    className: 'tb-catalog-detail__fact-value',
                    children: value
                })
            ])
    });
}

interface ChipSpec {
    text: string;
    title?: string;
    /** As for the kind of thing it names: `success` for a dataset or source, none for an element. */
    intent?: Intent;
    onClick?: () => void;
}

function chips(specs: ChipSpec[]) {
    return hbox({
        className: 'tb-catalog-detail__chips',
        children: specs.map((it, idx) => factChip({...it, key: `${idx}-${it.text}`}))
    });
}

/** A chip for a fact, clickable when given an `onClick`, with its title as a tooltip. */
function factChip({key, text, title, intent, onClick}: ChipSpec & {key?: string}) {
    return span({
        key,
        className: 'tb-catalog-detail__chip',
        title,
        // Keeps a card behind the chip from taking the click.
        onClick: onClick ? e => e.stopPropagation() : undefined,
        children: chip({
            className: 'xh-font-family-mono',
            minimal: true,
            size: 'compact',
            intent,
            onClick: onClick ? () => onClick() : undefined,
            children: text
        })
    });
}

function describeText(spec: unknown): string {
    return typeof spec === 'string' ? spec : JSON.stringify(spec);
}
