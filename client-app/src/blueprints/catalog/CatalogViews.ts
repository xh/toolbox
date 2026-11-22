import {chip} from '@xh/hoist/cmp/chip';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hbox, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {hoistCmp, uses} from '@xh/hoist/core';
import type {HoistProps, Intent} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {segmentedControl, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import type {ReactNode} from 'react';
import {jsonDialog} from '../jsonDialog';
import {md} from '../markdown';
import {CatalogModel} from './CatalogModel';
import type {DatasetCardModel} from './CatalogModel';

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

/** The list of datasets, kinds and formats, filtered by one query. */
export const catalogList = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) =>
        panel({
            className: 'tb-catalog__list',
            modelConfig: {side: 'left', defaultSize: 300, minSize: 220, collapsible: false},
            tbar: [
                textInput({
                    bind: 'query',
                    placeholder: 'Filter datasets, fields, kinds',
                    leftIcon: Icon.filter(),
                    commitOnChange: true,
                    enableClear: true,
                    flex: 1
                }),
                popover({
                    position: 'bottom-right',
                    children: button({
                        icon: Icon.ellipsisHorizontal(),
                        minimal: true,
                        title: 'More'
                    }),
                    content: menu(
                        menuItem({
                            text: 'Catalog JSON',
                            icon: Icon.code(),
                            onClick: () => model.showCatalogJson()
                        })
                    )
                })
            ],
            children: grid({model: model.listModel})
        })
});

/** The selected entry's detail: a dataset, a kind or a format. */
export const catalogDetail = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) => {
        switch (model.selection?.kind) {
            case 'dataset':
                return model.selectedDataset ? datasetDetail({model: model.selectedDataset}) : null;
            case 'kind':
                return kindDetail();
            case 'format':
                return formatDetail();
            default:
                return placeholder('Pick a dataset, kind or format.');
        }
    }
});

/** The selected entry's JSON, or the catalog's, with Copy. */
export const catalogJsonDialog = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) => jsonDialog({shown: model.shownJson, onClose: () => model.closeJson()})
});

//------------------
// Details
//------------------
const datasetDetail = hoistCmp.factory<DatasetCardModel>(({model}) => {
    const catalog = model.catalogModel,
        {ds, joins, params, description} = model,
        draft = catalog.panelModel.draftName,
        {sources, elements} = catalog.users,
        hasDocument = !!catalog.panelModel.documentModel.document;
    return panel({
        className: 'tb-catalog-detail',
        children: [
            detailHeader({
                name: ds.name,
                label: ds.label && ds.label !== ds.name ? ds.label : null,
                onJson: () => catalog.showEntryJson(),
                action: button({
                    text: `Add as source to ${draft}`,
                    icon: Icon.add(),
                    intent: 'primary',
                    minimal: false,
                    omit: !draft,
                    onClick: () => catalog.addAsSource()
                })
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
                                  title: p.description
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
                                    intent: 'success',
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
            ]),
            panel({
                className: 'tb-catalog-detail__fields',
                tbar: [
                    span({className: 'tb-catalog-detail__fields-title', children: 'Fields'}),
                    span({className: 'tb-muted', children: String(model.fieldCount)}),
                    storeFilterField({
                        gridModel: model.fieldsGridModel,
                        includeFields: ['name', 'label', 'guidance'],
                        placeholder: 'Filter fields',
                        key: ds.name,
                        width: 220
                    }),
                    filler(),
                    segmentedControl({
                        model: catalog,
                        bind: 'fieldsGrouping',
                        compact: true,
                        options: [
                            {value: 'group', label: 'By group'},
                            {value: 'kind', label: 'By kind'}
                        ]
                    })
                ],
                children: grid({model: model.fieldsGridModel, key: ds.name})
            })
        ]
    });
});

const kindDetail = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) => {
        const {name} = model.selection,
            kind = model.catalog.kinds[name],
            fields = model.fieldsOfKind(name);
        return panel({
            className: 'tb-catalog-detail',
            children: [
                detailHeader({name, label: 'kind', onJson: () => model.showEntryJson()}),
                facts([
                    ['Base', kind?.base ? span({className: 'tb-mono', children: kind.base}) : null],
                    ['Format', model.kindFormat(name)],
                    ['Aggregator', describeSpecText(kind?.aggregator)],
                    ['Renderer', describeSpecText(kind?.renderer)],
                    [
                        'Fields',
                        fields.length
                            ? vbox({
                                  className: 'tb-catalog-detail__kind-fields',
                                  children: fields.map(({dataset, fields}) =>
                                      hbox({
                                          key: dataset,
                                          className: 'tb-catalog-detail__kind-row',
                                          children: [
                                              factChip({
                                                  text: dataset,
                                                  title: `Show ${dataset}`,
                                                  intent: 'success',
                                                  onClick: () => model.select(`dataset:${dataset}`)
                                              }),
                                              span({
                                                  className: 'tb-mono',
                                                  children: fields.join(', ')
                                              })
                                          ]
                                      })
                                  )
                              })
                            : span({className: 'tb-muted', children: 'No field carries it.'})
                    ]
                ])
            ]
        });
    }
});

const formatDetail = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) => {
        const {name} = model.selection,
            kinds = model.kindsOfFormat(name);
        return panel({
            className: 'tb-catalog-detail',
            children: [
                detailHeader({name, label: 'format', onJson: () => model.showEntryJson()}),
                facts([
                    [
                        'Options',
                        span({
                            className: 'tb-mono',
                            children: model.formatOptions(name) || 'None'
                        })
                    ],
                    [
                        'Samples',
                        vbox({
                            className: 'tb-catalog-detail__samples',
                            children: model.formatSamples(name).map(({value, text}) =>
                                hbox({
                                    key: value,
                                    className: 'tb-catalog-detail__sample',
                                    children: [
                                        span({
                                            className: 'tb-mono tb-muted',
                                            children: String(value)
                                        }),
                                        span({
                                            className: 'tb-catalog-detail__sample-arrow',
                                            children: '→'
                                        }),
                                        span({
                                            className: 'tb-catalog-detail__sample-text',
                                            children: text
                                        })
                                    ]
                                })
                            )
                        })
                    ],
                    [
                        'Kinds',
                        kinds.length
                            ? chips(
                                  kinds.map(k => ({
                                      text: k,
                                      title: `Show the ${k} kind`,
                                      onClick: () => model.select(`kind:${k}`)
                                  }))
                              )
                            : span({className: 'tb-muted', children: 'No kind uses it.'})
                    ]
                ])
            ]
        });
    }
});

//------------------
// Implementation
//------------------
interface DetailHeaderProps extends HoistProps {
    name: string;
    label?: string;
    onJson: () => void;
    action?: ReactNode;
}

const detailHeader = hoistCmp.factory<DetailHeaderProps>({
    model: false,
    render: ({name, label, onJson, action}) =>
        hbox({
            className: 'tb-catalog-detail__header',
            children: [
                span({className: 'tb-catalog-detail__name', children: name}),
                label ? span({className: 'tb-catalog-detail__label', children: label}) : null,
                filler(),
                button({text: 'JSON', icon: Icon.code(), onClick: onJson}),
                action
            ]
        })
});

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

function describeSpecText(spec: unknown): string {
    if (spec == null) return null;
    return typeof spec === 'string' ? spec : JSON.stringify(spec);
}
