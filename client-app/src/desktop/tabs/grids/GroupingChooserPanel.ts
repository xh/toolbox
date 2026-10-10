import type {GridModel} from '@xh/hoist/cmp/grid';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {filler} from '@xh/hoist/cmp/layout';
import type {LoadSpec, Side} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import type {GroupingChooserProps} from '@xh/hoist/desktop/cmp/grouping';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
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

export const groupingChooserPanel = hoistCmp.factory({
    displayName: 'GroupingChooserPanel',
    model: creates(() => GroupingChooserPanelModel),

    render({model}) {
        return wrapper({
            title: 'GroupingChooser',
            icon: Icon.treeList(),
            description: [
                '`GroupingChooser` picks an ordered list of dimensions to group by - City, then',
                'Win/Lose, for example. The trigger shows the current grouping, and its popover',
                'lets users add, remove, and reorder dimensions, and save groupings as favorites.',
                '',
                'Its `GroupingChooserModel` holds the value as an array of dimension names. Set',
                "`bind` to a GridModel to drive the grid's `groupBy`, or to a Cube View to drive",
                'its query dimensions. The binding is two-way.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/GroupingChooserPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/grouping/GroupingChooser.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/grouping/GroupingChooserModel.ts',
                    notes: 'Hoist component model - dimensions, binding, value, and favorites.'
                }
            ],
            options: wrapperOptionGroup({
                label: 'Playground only - props',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Drives the Playground instance. The variant uses its own model.',
                items: [
                    wrapperOption({
                        label: 'Style as input',
                        propName: 'GroupingChooserProps.styleButtonAsInput',
                        control: switchInput({bind: 'styleButtonAsInput'})
                    }),
                    wrapperOption({
                        label: 'Favorites side',
                        propName: 'GroupingChooserProps.favoritesSide',
                        info: 'Where the favorites list sits in the popover.',
                        control: select({
                            bind: 'favoritesSide',
                            enableFilter: false,
                            width: 110,
                            options: ['right', 'left', 'top', 'bottom']
                        })
                    })
                ]
            }),
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            caption: 'Open the popover to add, remove, and drag dimensions.',
                            config: fmtDemoConfig<GroupingChooserProps>('groupingChooser', {
                                model: raw('groupingChooserModel'),
                                styleButtonAsInput: model.styleButtonAsInput ? undefined : false,
                                favoritesSide:
                                    model.favoritesSide === 'right'
                                        ? undefined
                                        : model.favoritesSide
                            }),
                            value: model.groupingChooserModel.value,
                            item: groupingChooser({
                                model: model.groupingChooserModel,
                                styleButtonAsInput: model.styleButtonAsInput,
                                favoritesSide: model.favoritesSide
                            })
                        })
                    }),
                    demoSection({
                        title: 'Bound to a Grid',
                        note: 'Same model as the Playground.',
                        item: tradesGridFrame({
                            gridModel: model.gridModel,
                            label: 'bind: gridModel',
                            info: "Each change to the chooser calls the grid's setGroupBy().",
                            mask: [model.loadObserver]
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        note: 'Uses its own model.',
                        item: demoRow({
                            label: 'Unbound, max depth 2, with favorites, outlined',
                            info: 'maxDepth: 2, initialFavorites, styleButtonAsInput: false.',
                            item: groupingChooser({
                                model: model.variantModel,
                                styleButtonAsInput: false
                            })
                        })
                    }),
                    demoSection({
                        title: 'In a Toolbar',
                        note: 'Bound to the Playground model, so the grid above follows.',
                        items: [
                            demoToolbar({items: toolbarItems(model)}),
                            demoToolbar({compact: true, items: toolbarItems(model)})
                        ]
                    })
                ]
            })
        });
    }
});

function toolbarItems(model: GroupingChooserPanelModel): ReactNode[] {
    return [
        groupingChooser({
            model: model.groupingChooserModel,
            styleButtonAsInput: model.styleButtonAsInput
        }),
        toolbarSep(),
        button({icon: Icon.refresh(), text: 'Refresh'}),
        filler(),
        button({icon: Icon.download(), text: 'Export', outlined: true})
    ];
}

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class GroupingChooserPanelModel extends HoistModel {
    @managed gridModel: GridModel;
    @managed groupingChooserModel: GroupingChooserModel;
    @managed variantModel: GroupingChooserModel;

    // Component options
    @bindable accessor styleButtonAsInput = true;
    @bindable accessor favoritesSide: Side = 'right';

    constructor() {
        super();

        this.gridModel = createTradesGridModel();

        this.groupingChooserModel = new GroupingChooserModel({
            bind: this.gridModel,
            dimensions: DIMENSIONS,
            initialValue: ['city'],
            initialFavorites: [['city', 'winLose'], ['winLose']],
            // Favorites are only offered when persisted - keep the value fresh on each visit.
            persistWith: {...PERSIST_WITH, path: 'playground'}
        });

        this.variantModel = new GroupingChooserModel({
            dimensions: DIMENSIONS,
            maxDepth: 2,
            initialValue: ['winLose', 'city'],
            initialFavorites: [['active'], ['city', 'active']],
            persistWith: {...PERSIST_WITH, path: 'variant'}
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await loadTradesAsync(this.gridModel);
    }
}

const PERSIST_WITH = {localStorageKey: 'toolboxGroupingChooserPanel', persistValue: false};

const DIMENSIONS = [
    {name: 'city'},
    {name: 'winLose', displayName: 'Win/Lose'},
    {name: 'active'},
    {name: 'trade_date', displayName: 'Trade Date'}
];
