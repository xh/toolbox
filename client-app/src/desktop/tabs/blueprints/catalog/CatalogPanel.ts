import {grid} from '@xh/hoist/cmp/grid';
import {filler, vframe} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, jsonInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {CatalogModel} from './CatalogModel';

/** The server's Data Catalog: datasets and their fields, kinds, formats, or the raw JSON. */
export const catalogPanel = hoistCmp.factory({
    displayName: 'CatalogPanel',
    model: creates(CatalogModel),

    render({model}) {
        const {view, showJson} = model;
        return panel({
            tbar: [
                buttonGroupInput({
                    bind: 'view',
                    disabled: showJson,
                    items: [
                        button({value: 'datasets', text: 'Datasets'}),
                        button({value: 'kinds', text: 'Kinds'}),
                        button({value: 'formats', text: 'Formats'})
                    ]
                }),
                filler(),
                button({
                    text: 'JSON',
                    icon: Icon.json(),
                    active: showJson,
                    tooltip: 'Show the catalog as the server serves it',
                    onClick: () => (model.showJson = !showJson)
                })
            ],
            item: showJson
                ? jsonInput({
                      value: model.catalogJson,
                      readonly: true,
                      enableSearch: true,
                      flex: 1,
                      width: '100%'
                  })
                : view === 'datasets'
                  ? datasetsView()
                  : grid({
                        model: view === 'kinds' ? model.kindsGridModel : model.formatsGridModel
                    })
        });
    }
});

const datasetsView = hoistCmp.factory<CatalogModel>(({model}) =>
    vframe(
        panel({
            modelConfig: {side: 'top', defaultSize: 170},
            item: grid({model: model.datasetsGridModel})
        }),
        panel({
            title: model.selectedDataset
                ? `Parameters of ${model.selectedDataset.name}`
                : 'Parameters',
            compactHeader: true,
            modelConfig: {side: 'top', defaultSize: 120},
            item: grid({model: model.paramsGridModel})
        }),
        panel({
            title: model.selectedDataset ? `Fields of ${model.selectedDataset.name}` : 'Fields',
            compactHeader: true,
            tbar: [
                storeFilterField({
                    gridModel: model.fieldsGridModel,
                    includeFields: ['name', 'label', 'guidance'],
                    flex: 1
                })
            ],
            item: grid({model: model.fieldsGridModel}),
            bbar: [model.fieldsSummary]
        })
    )
);
