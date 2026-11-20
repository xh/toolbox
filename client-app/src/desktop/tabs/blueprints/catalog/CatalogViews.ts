import {badge} from '@xh/hoist/cmp/badge';
import {card} from '@xh/hoist/cmp/card';
import {grid} from '@xh/hoist/cmp/grid';
import {box, div, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {jsonInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {md} from '../markdown';
import type {CatalogModel, DatasetCardModel, ParamInfo} from './CatalogModel';

/** The catalog's datasets, each a card that expands to its parameters and fields. */
export const datasetCards = hoistCmp.factory<CatalogModel>(({model}) =>
    vbox({
        className: 'tb-catalog__datasets',
        flex: 1,
        items: model.datasetModels.map(it => datasetCard({model: it, key: it.ds.name}))
    })
);

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

const datasetCard = hoistCmp.factory<DatasetCardModel>(({model}) => {
    const {ds, expanded, usedCount, description, params} = model;
    return div({
        className: `tb-dataset${expanded ? ' tb-dataset--expanded' : ''}`,
        items: [
            hbox({
                className: 'tb-dataset__header',
                onClick: () => (model.expanded = !expanded),
                items: [
                    expanded ? Icon.chevronDown() : Icon.chevronRight(),
                    span({className: 'tb-dataset__name', item: ds.name}),
                    ds.label && ds.label !== ds.name
                        ? span({className: 'tb-dataset__label', item: ds.label})
                        : null,
                    filler(),
                    usedCount
                        ? badge({
                              intent: 'success',
                              icon: Icon.check(),
                              item: `${usedCount} used`
                          })
                        : null,
                    badge({item: `${model.fieldCount} fields`}),
                    params.length ? badge({item: `${params.length} params`}) : null
                ]
            }),
            description ? div({className: 'tb-dataset__description', item: md(description)}) : null,
            expanded ? datasetDetails({model}) : null
        ]
    });
});

const datasetDetails = hoistCmp.factory<DatasetCardModel>(({model}) =>
    vbox({
        className: 'tb-dataset__details',
        items: [
            model.params.length
                ? div({
                      className: 'tb-dataset__params',
                      items: model.params.map(p => paramCard({param: p, key: p.name}))
                  })
                : null,
            card({
                title: 'Fields',
                icon: Icon.list(),
                className: 'tb-dataset__fields',
                items: [
                    storeFilterField({
                        gridModel: model.fieldsGridModel,
                        includeFields: ['name', 'label', 'guidance'],
                        width: '100%'
                    }),
                    box({height: 320, item: grid({model: model.fieldsGridModel})})
                ]
            })
        ]
    })
);

interface ParamCardProps extends HoistProps {
    param: ParamInfo;
}

const paramCard = hoistCmp.factory<ParamCardProps>({
    model: false,
    render({param}) {
        const {name, type, required, kind, options, description} = param;
        return div({
            className: 'tb-dataset__param',
            items: [
                hbox({
                    className: 'tb-dataset__param-header',
                    items: [
                        span({className: 'tb-dataset__param-name', item: name}),
                        span({className: 'tb-dataset__param-type', item: type}),
                        filler(),
                        required ? badge({intent: 'warning', item: 'required'}) : null
                    ]
                }),
                kind ? div({className: 'tb-dataset__param-meta', item: `Kind: ${kind}`}) : null,
                options
                    ? div({className: 'tb-dataset__param-meta', item: `Options: ${options}`})
                    : null,
                description
                    ? div({className: 'tb-dataset__param-desc', item: md(description)})
                    : null
            ]
        });
    }
});
