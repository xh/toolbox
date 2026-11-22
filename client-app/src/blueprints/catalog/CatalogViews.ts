import {badge} from '@xh/hoist/cmp/badge';
import {dataView} from '@xh/hoist/cmp/dataview';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hbox, hframe, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp, useContextModel, uses} from '@xh/hoist/core';
import type {HoistProps, PlainObject} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import type {ReactNode} from 'react';
import {md} from '../markdown';
import {CatalogModel} from './CatalogModel';
import type {DatasetCardModel, ParamInfo} from './CatalogModel';

/** The datasets beside the one selected: a filtered list of cards, and its detail. */
export const datasetsPage = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) =>
        hframe(
            panel({
                className: 'tb-catalog__list',
                modelConfig: {side: 'left', defaultSize: 340, minSize: 240, collapsible: false},
                tbar: [
                    textInput({
                        bind: 'query',
                        placeholder: 'Filter datasets and fields',
                        leftIcon: Icon.filter(),
                        commitOnChange: true,
                        enableClear: true,
                        flex: 1
                    })
                ],
                children: dataView({model: model.listModel})
            }),
            model.selected ? datasetDetail({model: model.selected}) : placeholder('Pick a dataset.')
        )
});

/** The catalog as the server serves it. */
export const catalogJson = hoistCmp.factory<CatalogModel>(({model}) =>
    jsonInput({
        value: model.catalogJson,
        readonly: true,
        enableSearch: true,
        flex: 1,
        width: '100%'
    })
);

interface DatasetItemProps extends HoistProps {
    data: PlainObject;
}

/** A dataset in the list: its name, what it holds, its grain, and any fields the filter hit. */
export const datasetItem = hoistCmp.factory<DatasetItemProps>({
    model: false,
    render({data}) {
        const {name, label, description, grain, usedCount, fieldHits} = data;
        return vbox({
            className: 'tb-dataset-item',
            children: [
                hbox({
                    className: 'tb-dataset-item__head',
                    children: [
                        span({className: 'tb-dataset__name', children: name}),
                        label ? span({className: 'tb-dataset__label', children: label}) : null,
                        filler(),
                        usedCount
                            ? badge({
                                  intent: 'success',
                                  compact: true,
                                  children: `${usedCount} used`
                              })
                            : null
                    ]
                }),
                description
                    ? div({className: 'tb-dataset-item__desc', children: description})
                    : null,
                fieldHits?.length
                    ? div({
                          className: 'tb-dataset-item__hits',
                          children: `${fieldHits.slice(0, 3).join(', ')}${fieldHits.length > 3 ? ` and ${fieldHits.length - 3} more` : ''} in ${name}`
                      })
                    : grain
                      ? div({className: 'tb-dataset-item__grain', children: `grain ${grain}`})
                      : null
            ]
        });
    }
});

/** The selected dataset: its header, and its fields, parameters and users. */
const datasetDetail = hoistCmp.factory<DatasetCardModel>(({model}) => {
    const catalog = useContextModel(CatalogModel),
        {ds, joins, params, description} = model,
        draft = catalog.panelModel.draftName;
    return panel({
        className: 'tb-dataset',
        children: [
            vbox({
                className: 'tb-dataset__header',
                children: [
                    hbox({
                        className: 'tb-dataset__title',
                        children: [
                            span({className: 'tb-dataset__name', children: ds.name}),
                            ds.label && ds.label !== ds.name
                                ? span({className: 'tb-dataset__label', children: ds.label})
                                : null,
                            filler(),
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
                        ? div({className: 'tb-dataset__description', children: md(description)})
                        : null,
                    ds.key?.length ? metaRow('Grain', span(ds.key.join(', '))) : null,
                    joins.length
                        ? metaRow(
                              'Joins',
                              hbox({
                                  className: 'tb-dataset__chips',
                                  children: joins.map(j =>
                                      button({
                                          key: j.dataset,
                                          className: 'tb-dataset__chip',
                                          text: `${j.dataset} on ${j.on.join(', ')}`,
                                          minimal: true,
                                          tooltip: `Show ${j.dataset}`,
                                          onClick: () =>
                                              catalog.listModel.selModel.select(j.dataset)
                                      })
                                  )
                              })
                          )
                        : null,
                    params.length
                        ? metaRow(
                              'Params',
                              span(
                                  params
                                      .map(
                                          p =>
                                              `${p.name} · ${p.type}${p.required ? ' required' : ''}`
                                      )
                                      .join(', ')
                              )
                          )
                        : null
                ]
            }),
            tabContainer({model: catalog.detailTabsModel})
        ]
    });
});

function metaRow(label: string, value: ReactNode) {
    return hbox({
        className: 'tb-dataset__meta',
        children: [span({className: 'tb-dataset__meta-label', children: label}), value]
    });
}

/** The selected dataset's fields, as a tree, at full height. */
export const datasetFields = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) => {
        const {selected} = model;
        if (!selected) return null;
        return panel({
            tbar: [
                storeFilterField({
                    gridModel: selected.fieldsGridModel,
                    includeFields: ['name', 'label', 'guidance'],
                    key: selected.ds.name,
                    flex: 1
                }),
                span({className: 'tb-dataset__count', children: `${selected.fieldCount} fields`})
            ],
            children: grid({model: selected.fieldsGridModel, key: selected.ds.name})
        });
    }
});

/** The selected dataset's parameters. */
export const datasetParams = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) => {
        const params = model.selected?.params ?? [];
        return params.length
            ? div({
                  className: 'tb-dataset__params',
                  children: params.map(p => paramCard({param: p, key: p.name}))
              })
            : placeholder('This dataset takes no parameters.');
    }
});

/** The open blueprint's sources over the selected dataset, and the widgets that read them. */
export const datasetUsedBy = hoistCmp.factory<CatalogModel>({
    model: uses(() => CatalogModel),
    render: ({model}) => {
        const {sources, elements} = model.users;
        if (!model.panelModel.documentModel.document) {
            return placeholder('Open a blueprint to see what in it reads this dataset.');
        }
        if (!sources.length)
            return placeholder('Nothing in the blueprint open reads this dataset.');
        const chips = (kind: 'source' | 'element', ids: string[]) =>
            hbox({
                className: 'tb-dataset__chips',
                children: ids.map(id =>
                    button({
                        key: id,
                        className: 'tb-dataset__chip',
                        text: id,
                        minimal: true,
                        tooltip: `Show ${id} in the blueprint`,
                        onClick: () => model.reveal({kind, id})
                    })
                )
            });
        return vbox({
            className: 'tb-dataset__used-by',
            children: [
                metaRow('Sources', chips('source', sources)),
                metaRow('Widgets', elements.length ? chips('element', elements) : span('None'))
            ]
        });
    }
});

interface ParamCardProps extends HoistProps {
    param: ParamInfo;
}

const paramCard = hoistCmp.factory<ParamCardProps>({
    model: false,
    render({param}) {
        const {name, type, required, kind, options, description} = param;
        return div({
            className: 'tb-dataset__param',
            children: [
                hbox({
                    className: 'tb-dataset__param-header',
                    children: [
                        span({className: 'tb-dataset__param-name', children: name}),
                        span({className: 'tb-dataset__param-type', children: type}),
                        filler(),
                        required ? badge({intent: 'warning', children: 'required'}) : null
                    ]
                }),
                kind ? div({className: 'tb-dataset__param-meta', children: `Kind: ${kind}`}) : null,
                options
                    ? div({className: 'tb-dataset__param-meta', children: `Options: ${options}`})
                    : null,
                description
                    ? div({className: 'tb-dataset__param-desc', children: md(description)})
                    : null
            ]
        });
    }
});
