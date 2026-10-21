import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import type {GridModel} from '@xh/hoist/cmp/grid';
import type {LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import type {FilterChooserProps} from '@xh/hoist/desktop/cmp/filter';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import type {ReactNode} from 'react';
import {
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    demoToolbar,
    fmtDemoConfig,
    raw
} from '../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../common/Wrapper';
import {createTradesGridModel, loadTradesAsync, tradesGridFrame} from './helpers/TradesGrid';

export const filterChooserPanel = hoistCmp.factory({
    displayName: 'FilterChooserPanel',
    model: creates(() => FilterChooserPanelModel),

    render({model}) {
        return wrapper({
            title: 'FilterChooser',
            icon: Icon.filter(),
            description: [
                '`FilterChooser` is a type-ahead search box for building filters. Users type a',
                'field name or a value and pick from suggestions to add tags such as',
                '`City = Boston` or `P&L > 1000`, which are combined with AND.',
                '',
                'Its `FilterChooserModel` holds the value as a standard Hoist `Filter`. Set',
                '`bind` to a Store or Cube View to apply it automatically - the binding is two-way,',
                "so the grid's column filters show up as tags too. Users can also save filters as",
                'favorites.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/FilterChooserPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/filter/FilterChooser.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/filter/FilterChooserModel.ts',
                    notes: 'Hoist component model - field specs, binding, value, and favorites.'
                },
                {
                    url: '$HR/data/README.md',
                    text: 'Data docs',
                    notes: 'Stores, Fields, and the Filter classes the model produces.'
                }
            ],
            options: wrapperOptionGroup({
                label: 'Playground only - props',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Drives the Playground instance. The other sections use their own models.',
                items: [
                    wrapperOption({
                        label: 'Enable clear',
                        propName: 'FilterChooserProps.enableClear',
                        control: switchInput({bind: 'enableClear'})
                    }),
                    wrapperOption({
                        label: 'Display count',
                        propName: 'FilterChooserProps.displayCount',
                        info: 'Shows the number of tags next to the left icon.',
                        control: switchInput({bind: 'displayCount'})
                    }),
                    wrapperOption({
                        label: 'Left icon',
                        propName: 'FilterChooserProps.leftIcon',
                        control: switchInput({bind: 'showLeftIcon'})
                    })
                ]
            }),
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 420,
                            caption: 'Type a field name or a value - try "boston" or "p&l > 0".',
                            config: fmtDemoConfig<FilterChooserProps>('filterChooser', {
                                model: raw('filterChooserModel'),
                                enableClear: model.enableClear || undefined,
                                displayCount: model.displayCount || undefined,
                                leftIcon: model.showLeftIcon ? undefined : null
                            }),
                            value: model.filterChooserModel.value?.toJSON() ?? null,
                            item: filterChooser({
                                model: model.filterChooserModel,
                                enableClear: model.enableClear,
                                displayCount: model.displayCount,
                                leftIcon: model.showLeftIcon ? undefined : null,
                                width: '100%'
                            })
                        })
                    }),
                    demoSection({
                        title: 'Bound to a Grid',
                        note: "Same model as the Playground, bound to the grid's store.",
                        item: tradesGridFrame({
                            gridModel: model.gridModel,
                            label: 'bind: gridModel.store',
                            info: 'Column header filters show up as tags in the Playground, and vice versa.',
                            mask: [model.loadObserver, model.filterChooserModel.filterTask]
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        note: 'Each uses its own model.',
                        item: demoRow({
                            label: 'Unbound, with an initial value and favorites',
                            info: 'valueSource: store, no bind - read the value and apply it yourself. Click the star to open favorites.',
                            item: filterChooser({
                                model: model.favoritesModel,
                                width: 420
                            })
                        })
                    }),
                    demoSection({
                        title: 'In a Toolbar',
                        note: 'flex: 1 - fills the space beside the other controls.',
                        items: [
                            demoToolbar({items: toolbarItems(model.toolbarModel)}),
                            demoToolbar({
                                compact: true,
                                items: toolbarItems(model.compactToolbarModel)
                            })
                        ]
                    })
                ]
            })
        });
    }
});

function toolbarItems(filterChooserModel: FilterChooserModel): ReactNode[] {
    return [
        filterChooser({model: filterChooserModel, flex: 1}),
        toolbarSep(),
        button({icon: Icon.refresh(), text: 'Refresh'})
    ];
}

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class FilterChooserPanelModel extends HoistModel {
    @managed gridModel: GridModel;
    @managed filterChooserModel: FilterChooserModel;
    @managed favoritesModel: FilterChooserModel;
    @managed toolbarModel: FilterChooserModel;
    @managed compactToolbarModel: FilterChooserModel;

    // Component options
    @bindable accessor enableClear = true;
    @bindable accessor displayCount = false;
    @bindable accessor showLeftIcon = true;

    constructor() {
        super();

        this.gridModel = createTradesGridModel({
            filterModel: true,
            colDefaults: {filterable: true}
        });

        const {store} = this.gridModel;

        this.filterChooserModel = new FilterChooserModel({bind: store, fieldSpecs: FIELD_SPECS});

        this.favoritesModel = new FilterChooserModel({
            valueSource: store,
            fieldSpecs: FIELD_SPECS,
            initialValue: {field: 'active', op: '=', value: true},
            // Favorites are only offered when persisted - keep the value fresh on each visit.
            persistWith: {localStorageKey: 'toolboxFilterChooserPanel', persistValue: false},
            initialFavorites: [
                {field: 'profit_loss', op: '>', value: 0},
                [
                    {field: 'city', op: '=', value: 'New York'},
                    {field: 'trade_volume', op: '>=', value: 5_000_000_000}
                ]
            ]
        });

        this.toolbarModel = new FilterChooserModel({valueSource: store, fieldSpecs: FIELD_SPECS});
        this.compactToolbarModel = new FilterChooserModel({
            valueSource: store,
            fieldSpecs: FIELD_SPECS
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await loadTradesAsync(this.gridModel);
    }
}

/** Shared by every model on the page - the store supplies types, labels, and suggested values. */
const FIELD_SPECS = [
    'active',
    'company',
    'city',
    'trade_date',
    {field: 'profit_loss', valueRenderer: numberRenderer({precision: 0})},
    {field: 'trade_volume', valueRenderer: millionsRenderer({precision: 1, label: true})}
];
