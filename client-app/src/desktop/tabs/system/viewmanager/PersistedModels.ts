import {CardModel} from '@xh/hoist/cmp/card';
import {DateRangePickerModel} from '@xh/hoist/cmp/daterange';
import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {FormModel} from '@xh/hoist/cmp/form';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {div, frame} from '@xh/hoist/cmp/layout';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import type {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {ZoneGridModel} from '@xh/hoist/cmp/zoneGrid';
import type {LoadSpec, PersistOptions} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, lookup, managed, persist, XH} from '@xh/hoist/core';
import type {
    DashCanvasViewSpec,
    DashContainerViewSpec,
    DashContainerViewState
} from '@xh/hoist/desktop/cmp/dash';
import {DashCanvasModel, DashContainerModel, DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {cityCol, companyCol} from '../../../../core/columns/Demographics';
import {profitLossCol, tradeDateCol, tradeVolumeCol} from '../../../../core/columns/Trades';
import {
    sampleColumnGroupsGrid,
    SampleColumnGroupsGridModel
} from '../../../common/grid/SampleColumnGroupsGrid';
import {sampleGrid} from '../../../common/grid/SampleGrid';
import {SampleGridModel} from '../../../common/grid/SampleGridModel';

/**
 * The models on the page that persist their state to the ViewManagerModel. They are built as one
 * unit, so a rebuild can destroy them all and recreate them against a new ViewManagerModel. The
 * FormFieldSet card is the exception - its component creates its own model.
 *
 * Most models set no `path` and use their built-in default. A model sets one only where two of
 * the same kind would otherwise share a path.
 */
export class PersistedModels extends HoistModel {
    @managed propsModel: PersistedPropsModel;
    @managed groupingChooserModel: GroupingChooserModel;
    @managed filterChooserModel: FilterChooserModel;
    @managed dateRangePickerModel: DateRangePickerModel;
    @managed tabContainerModel: TabContainerModel;
    @managed cardModel: CardModel;
    @managed formModel: FormModel;
    @managed fieldSetFormModel: FormModel;
    @managed panelModel: PanelModel;
    @managed panelPctModel: PanelModel;
    @managed gridModel: SampleGridModel;
    @managed columnGroupsGridModel: SampleColumnGroupsGridModel;
    @managed zoneGridModel: ZoneGridModel;
    @managed dashCanvasModel: DashCanvasModel;
    @managed dashContainerModel: DashContainerModel;

    /** True if the DashContainer was given shorthand initial state - see the test harness. */
    readonly shorthandDashState: boolean;

    constructor(viewManagerModel: ViewManagerModel, {shorthandDashState = false} = {}) {
        super();
        const persistWith = {viewManagerModel},
            {type, instance} = viewManagerModel;
        this.shorthandDashState = shorthandDashState;

        this.propsModel = new PersistedPropsModel(persistWith);
        this.groupingChooserModel = createGroupingChooserModel(persistWith);
        this.filterChooserModel = createFilterChooserModel(
            persistWith,
            // Favorites are not part of a view. Keep a separate list for each type and instance.
            `toolboxViewManagerFilterFavorites.${type}.${instance}`
        );
        this.dateRangePickerModel = new DateRangePickerModel({persistWith});

        this.tabContainerModel = new TabContainerModel({
            persistWith,
            tabs: [
                {id: 'one', title: 'Tab One', content: () => tabContent('Tab One content')},
                {id: 'two', title: 'Tab Two', content: () => tabContent('Tab Two content')},
                {id: 'three', title: 'Tab Three', content: () => tabContent('Tab Three content')}
            ]
        });

        this.cardModel = new CardModel({collapsible: true, persistWith});

        this.formModel = new FormModel({
            persistWith,
            fields: [
                {name: 'name', initialValue: 'Jane Doe'},
                // A LocalDate value - persisted in a tagged form that restores it as a LocalDate.
                {name: 'startDate', initialValue: LocalDate.get('2026-01-05')},
                {name: 'quantity', initialValue: 100},
                {name: 'active', initialValue: true}
            ]
        });

        // Holds the fields inside the FormFieldSet. Not persisted - only the collapsed state is.
        this.fieldSetFormModel = new FormModel({
            fields: [
                {name: 'street', initialValue: '1 Main St'},
                {name: 'city', initialValue: 'Springfield'}
            ]
        });

        this.panelModel = new PanelModel({persistWith, side: 'right', defaultSize: 200});

        this.panelPctModel = new PanelModel({
            persistWith: {...persistWith, path: 'panelPct'},
            side: 'right',
            defaultSize: '50%'
        });

        this.gridModel = new SampleGridModel({gridConfig: {persistWith}});

        this.columnGroupsGridModel = new SampleColumnGroupsGridModel({
            gridConfig: {persistWith: {...persistWith, path: 'columnGroupsGrid'}}
        });

        this.zoneGridModel = new ZoneGridModel({
            persistWith,
            sortBy: 'profit_loss|desc|abs',
            zoneMapperModel: true,
            columns: [companyCol, cityCol, profitLossCol, tradeVolumeCol, tradeDateCol],
            mappings: {
                tl: 'company',
                tr: 'profit_loss',
                bl: ['city', 'trade_date'],
                br: {field: 'trade_volume', showLabel: true}
            }
        });

        this.dashCanvasModel = new DashCanvasModel({
            persistWith,
            viewSpecs: dashCanvasViewSpecs,
            initialState: [
                {layout: {x: 0, y: 0, w: 6, h: 2}, viewSpecId: 'groupingChooser'},
                {layout: {x: 6, y: 0, w: 6, h: 2}, viewSpecId: 'filterChooser'},
                {layout: {x: 0, y: 2, w: 12, h: 6}, viewSpecId: 'grid'}
            ]
        });

        this.dashContainerModel = new DashContainerModel({
            persistWith,
            showMenuButton: true,
            viewSpecs: dashContainerViewSpecs,
            initialState: shorthandDashState ? SHORTHAND_DASH_STATE : NORMALIZED_DASH_STATE
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {gridModel, columnGroupsGridModel, zoneGridModel} = this;
        await Promise.all([
            gridModel.loadAsync(),
            columnGroupsGridModel.loadAsync(),
            XH.fetchJson({url: 'trade'}, {loadSpec}).then(({trades}) =>
                zoneGridModel.loadData(trades)
            )
        ]);
    }
}

//------------------------------------------------------------------
// DashContainer initial state
//------------------------------------------------------------------
/** `DashContainerViewState`, plus the fields GoldenLayout adds when it fills in a layout. */
type FullDashState = DashContainerViewState & {
    allowRemove?: boolean;
    activeItemIndex?: number;
    viewModelId?: string;
    content?: FullDashState[];
};

/**
 * The layout in the full form GoldenLayout produces once it renders. It matches the state the
 * DashContainer publishes, so the Default view loads clean.
 */
const NORMALIZED_DASH_STATE: FullDashState[] = [
    {
        type: 'row',
        allowRemove: true,
        content: [
            {
                type: 'column',
                allowRemove: true,
                width: 40,
                content: [
                    {
                        type: 'stack',
                        allowRemove: true,
                        height: 50,
                        activeItemIndex: 0,
                        content: [
                            {type: 'view', viewModelId: 'groupingChooser_0', id: 'groupingChooser'}
                        ]
                    },
                    {
                        type: 'stack',
                        allowRemove: true,
                        height: 50,
                        activeItemIndex: 0,
                        content: [
                            {type: 'view', viewModelId: 'filterChooser_0', id: 'filterChooser'}
                        ]
                    }
                ]
            },
            {
                type: 'stack',
                allowRemove: true,
                width: 60,
                activeItemIndex: 0,
                content: [
                    {type: 'view', viewModelId: 'grid_0', id: 'grid'},
                    {type: 'view', viewModelId: 'columnGroupsGrid_0', id: 'columnGroupsGrid'}
                ]
            }
        ]
    }
];

/**
 * The same layout in the shorthand an app might write. GoldenLayout fills it in when it renders,
 * and the filled-in state no longer matches the captured default. Whether the view then goes
 * dirty depends on render timing - a known hoist-react issue, reachable from the test harness.
 */
const SHORTHAND_DASH_STATE: DashContainerViewState[] = [
    {
        type: 'row',
        content: [
            {
                type: 'column',
                width: 40,
                content: [
                    {type: 'view', id: 'groupingChooser'},
                    {type: 'view', id: 'filterChooser'}
                ]
            },
            {
                type: 'stack',
                content: [
                    {type: 'view', id: 'grid'},
                    {type: 'view', id: 'columnGroupsGrid'}
                ]
            }
        ]
    }
];

//------------------------------------------------------------------
// Persisted model properties
//------------------------------------------------------------------
/**
 * Sets `persistWith` before subclass fields initialize, so `@persist` can read it.
 *
 * In an app, the ViewManagerModel is a module-level singleton, and a class field such as
 * `override persistWith = {viewManagerModel: viewManagers.myView}` is all a model needs. This page
 * rebuilds its ViewManagerModel, so it passes the options in instead.
 */
class PersistWithModel extends HoistModel {
    constructor(persistWith: PersistOptions) {
        super();
        this.persistWith = persistWith;
    }
}

/** Plain model properties, persisted with `markPersist()` and with the `@persist` decorator. */
class PersistedPropsModel extends PersistWithModel {
    @bindable accessor notes = 'Some default notes';
    @bindable @persist accessor priority = 'Medium';

    constructor(persistWith: PersistOptions) {
        super(persistWith);
        this.markPersist('notes');
    }
}

//------------------------------------------------------------------
// Shared chooser configs - used directly and in dashboard widgets
//------------------------------------------------------------------
function createGroupingChooserModel(persistWith: PersistOptions) {
    return new GroupingChooserModel({
        persistWith,
        dimensions: ['Color', 'Size', 'Species', 'Grade'],
        initialValue: ['Color', 'Size']
    });
}

/** Favorites are offered only when `favoritesKey` is set. */
function createFilterChooserModel(persistWith: PersistOptions, favoritesKey?: string) {
    return new FilterChooserModel({
        persistWith: {
            persistValue: persistWith,
            persistFavorites: favoritesKey ? {localStorageKey: favoritesKey} : false
        },
        fieldSpecs: [
            {field: 'color', values: ['green', 'blue', 'red']},
            {field: 'grade', values: ['A', 'B', 'C', 'D']},
            {field: 'size', fieldType: 'number'},
            {field: 'species'}
        ]
    });
}

//------------------------------------------------------------------
// Dashboard widgets - each persists to its DashViewModel, which the dashboard
// collects into its own state.
//------------------------------------------------------------------
class WidgetModel extends HoistModel {
    @lookup(DashViewModel) dashViewModel: DashViewModel;

    override onLinked() {
        super.onLinked();
        this.persistWith = {dashViewModel: this.dashViewModel};
    }
}

class GroupingChooserWidgetModel extends WidgetModel {
    @managed groupingChooserModel: GroupingChooserModel;

    override onLinked() {
        super.onLinked();
        this.groupingChooserModel = createGroupingChooserModel(this.persistWith);
    }
}

const groupingChooserWidget = hoistCmp.factory({
    model: creates(GroupingChooserWidgetModel),
    render() {
        return widget(groupingChooser({flex: 1}));
    }
});

class FilterChooserWidgetModel extends WidgetModel {
    @managed filterChooserModel: FilterChooserModel;

    override onLinked() {
        super.onLinked();
        this.filterChooserModel = createFilterChooserModel(this.persistWith);
    }
}

const filterChooserWidget = hoistCmp.factory({
    model: creates(FilterChooserWidgetModel),
    render() {
        return widget(filterChooser({flex: 1}));
    }
});

class GridWidgetModel extends WidgetModel {
    @managed gridModel: SampleGridModel;

    override onLinked() {
        super.onLinked();
        this.gridModel = new SampleGridModel({gridConfig: {persistWith: this.persistWith}});
        this.gridModel.loadAsync();
    }
}

const gridWidget = hoistCmp.factory({
    model: creates(GridWidgetModel),
    render() {
        return sampleGrid({omitGridTools: true});
    }
});

class ColumnGroupsGridWidgetModel extends WidgetModel {
    @managed columnGroupsGridModel: SampleColumnGroupsGridModel;

    override onLinked() {
        super.onLinked();
        this.columnGroupsGridModel = new SampleColumnGroupsGridModel({
            gridConfig: {persistWith: this.persistWith}
        });
        this.columnGroupsGridModel.loadAsync();
    }
}

const columnGroupsGridWidget = hoistCmp.factory({
    model: creates(ColumnGroupsGridWidgetModel),
    render() {
        return sampleColumnGroupsGrid();
    }
});

const widget = hoistCmp.factory({
    render({children}) {
        return frame({className: 'xh-pad', alignItems: 'center', items: children});
    }
});

const groupingChooserViewSpec = {
    id: 'groupingChooser',
    title: 'Grouping Chooser',
    icon: Icon.treeList(),
    content: groupingChooserWidget
};

const filterChooserViewSpec = {
    id: 'filterChooser',
    title: 'Filter Chooser',
    icon: Icon.filter(),
    content: filterChooserWidget
};

const gridViewSpec = {
    id: 'grid',
    title: 'Grid',
    icon: Icon.gridPanel(),
    content: gridWidget
};

const dashCanvasViewSpecs: DashCanvasViewSpec[] = [
    groupingChooserViewSpec,
    filterChooserViewSpec,
    gridViewSpec
];

const dashContainerViewSpecs: DashContainerViewSpec[] = [
    groupingChooserViewSpec,
    filterChooserViewSpec,
    gridViewSpec,
    {
        id: 'columnGroupsGrid',
        title: 'Column Groups Grid',
        icon: Icon.gridPanel(),
        content: columnGroupsGridWidget
    }
];

function tabContent(text: string) {
    return div({className: 'xh-pad', item: text});
}
