import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {FormModel} from '@xh/hoist/cmp/form';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {div, frame} from '@xh/hoist/cmp/layout';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, lookup, managed, PersistOptions, XH} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {required} from '@xh/hoist/data';
import {DashCanvasModel, DashContainerModel, DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {action, bindable, computed, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {get} from 'lodash';
import {sampleGrid, SampleGridModel} from '../../../desktop/common';

export class ViewManagerTestModel extends HoistModel {
    @managed @observable.ref viewManagerModel: ViewManagerModel;

    /** FormModel for model configs and component props. */
    @managed configFormModel: FormModel;

    /** Persisted models - all implementing Hoist's {@link Persistable} interface. */
    @managed @observable.ref groupingChooserModel: GroupingChooserModel;
    @managed @observable.ref filterChooserModel: FilterChooserModel;
    @managed @observable.ref tabContainerModel: TabContainerModel;
    @managed @observable.ref panelModel: PanelModel;
    @managed @observable.ref panelPctModel: PanelModel;
    @managed @observable.ref gridModel: SampleGridModel;
    @managed @observable.ref dashContainerModel: DashContainerModel;
    @managed @observable.ref dashCanvasModel: DashCanvasModel;
    @managed @observable.ref persistedPropertyModel: PersistedPropertyModel;

    @bindable focusedPersistable: string = null;

    get managedPersistables() {
        return [
            this.viewManagerModel,
            this.groupingChooserModel,
            this.filterChooserModel,
            this.tabContainerModel,
            this.panelModel,
            this.panelPctModel,
            this.gridModel,
            this.dashCanvasModel,
            this.dashContainerModel,
            this.persistedPropertyModel
        ];
    }

    @computed
    get value(): string {
        const {viewManagerModel, focusedPersistable} = this;
        if (!viewManagerModel) return '[No ViewManagerModel]';
        const value = viewManagerModel.view.value;
        return JSON.stringify(focusedPersistable ? get(value, focusedPersistable) : value, null, 2);
    }

    @computed
    get pendingValue(): string {
        const {viewManagerModel, focusedPersistable} = this;
        if (!viewManagerModel) return '[No ViewManagerModel]';
        const pendingValue = viewManagerModel.getValue();
        return JSON.stringify(
            focusedPersistable ? get(pendingValue, focusedPersistable) : pendingValue,
            null,
            2
        );
    }

    @computed
    get modelConfigDirty(): boolean {
        const dirtyFields = this.configFormModel.fieldList
            .filter(it => it.isDirty)
            .map(it => it.name);
        return [
            'type',
            'typeDisplayName',
            'globalDisplayName',
            'localStorageKey',
            'sessionStorageKey',
            'manageGlobal',
            'enableAutoSave',
            'enableDefault',
            'enableFavorites',
            'initialViewName'
        ].some(it => dirtyFields.includes(it));
    }

    constructor() {
        super();
        makeObservable(this);

        this.configFormModel = new FormModel({
            fields: [
                {name: 'type', rules: [required], initialValue: 'testView'},
                {name: 'typeDisplayName', initialValue: 'view'},
                {name: 'globalDisplayName', initialValue: 'global'},
                {name: 'localStorageKey', initialValue: 'viewManagerTest'},
                {name: 'sessionStorageKey', initialValue: 'viewManagerTest'},
                {name: 'manageGlobal', initialValue: true},
                {name: 'enableFavorites', initialValue: true},
                {name: 'enableAutoSave', initialValue: true},
                {name: 'enableDefault', initialValue: true},
                {name: 'initialViewName', initialValue: null},
                {name: 'settleTime', initialValue: 250},
                {name: 'showSaveButton', initialValue: 'whenDirty'},
                {name: 'showRevertButton', initialValue: 'never'},
                {name: 'buttonSide', initialValue: 'right'},
                {
                    name: 'showPrivateViewsInSubMenu',
                    displayName: 'Show private views in sub-menu',
                    initialValue: false
                },
                {
                    name: 'showGlobalViewsInSubMenu',
                    displayName: 'Show global views in sub-menu',
                    initialValue: false
                },
                {
                    name: 'customMenuButtonProps',
                    displayName: 'Custom menuButtonProps',
                    initialValue: false
                }
            ]
        });
        this.rebuildViewManagerModelAsync();
    }

    async rebuildViewManagerModelAsync() {
        const {configFormModel} = this;
        if (!(await configFormModel.validateAsync())) return;

        this.destroyModels();

        const data = configFormModel.getData(),
            {
                type,
                typeDisplayName,
                globalDisplayName,
                localStorageKey,
                sessionStorageKey,
                manageGlobal,
                enableDefault,
                enableAutoSave,
                enableFavorites,
                initialViewName,
                settleTime
            } = data;

        const persistWith = localStorageKey
            ? {
                  localStorageKey,
                  persistPendingValue: sessionStorageKey ? {sessionStorageKey} : false
              }
            : null;

        const newModel = await ViewManagerModel.createAsync({
            type,
            typeDisplayName,
            globalDisplayName,
            manageGlobal,
            enableDefault,
            enableAutoSave,
            enableFavorites,
            persistWith,
            settleTime,
            initialViewSpec: views => views.find(v => v.name == initialViewName) ?? views[0]
        });

        runInAction(() => {
            this.viewManagerModel = newModel;
            // @ts-ignore
            window.testViewManagerModel = newModel;
            console.log('ViewManagerModel created:', newModel);

            // Clear dirty state of config form.
            configFormModel.init(data);
            this.rebuildPersistedModels();
        });
    }

    @action
    destroyModels() {
        this.logInfo('Destroying models');
        XH.safeDestroy(this.managedPersistables);
    }

    rebuildPersistedModels() {
        this.logInfo('Rebuilding persisted models');
        const persistWith = {viewManagerModel: this.viewManagerModel};

        this.groupingChooserModel = createGroupingChooserModel(persistWith);
        this.filterChooserModel = createFilterChooserModel(
            persistWith,
            this.configFormModel.values.localStorageKey
        );

        this.tabContainerModel = new TabContainerModel({
            persistWith,
            tabs: [
                {id: 'one', title: 'Tab One', content: () => testTab('Tab One Content')},
                {id: 'two', title: 'Tab Two', content: () => testTab('Tab Two Content')},
                {id: 'three', title: 'Tab Three', content: () => testTab('Tab Three Content')}
            ]
        });

        this.panelModel = new PanelModel({
            persistWith,
            side: 'right',
            defaultSize: 200
        });

        this.panelPctModel = new PanelModel({
            persistWith: {...persistWith, path: 'panelPct'},
            side: 'right',
            defaultSize: '50%'
        });

        this.gridModel = new SampleGridModel({
            gridConfig: {persistWith}
        });
        this.gridModel.loadAsync();

        this.dashCanvasModel = new DashCanvasModel({
            persistWith,
            viewSpecs: [
                {
                    id: 'groupingChooser',
                    title: 'Grouping Chooser',
                    icon: Icon.treeList(),
                    content: groupingChooserWidget
                },
                {
                    id: 'filterChooser',
                    title: 'Filter Chooser (favorites in localStorage)',
                    icon: Icon.filter(),
                    content: filterChooserWidget
                },
                {
                    id: 'grid',
                    title: 'Grid',
                    icon: Icon.gridPanel(),
                    content: gridWidget
                }
            ],
            initialState: [
                {
                    layout: {x: 0, y: 0, w: 12, h: 2},
                    viewSpecId: 'groupingChooser'
                },
                {
                    layout: {x: 0, y: 2, w: 12, h: 2},
                    viewSpecId: 'filterChooser'
                },
                {
                    layout: {x: 0, y: 14, w: 12, h: 4},
                    viewSpecId: 'grid'
                }
            ]
        });

        this.dashContainerModel = new DashContainerModel({
            persistWith,
            showMenuButton: true,
            viewSpecs: [
                {
                    id: 'groupingChooser',
                    title: 'Grouping Chooser',
                    icon: Icon.treeList(),
                    content: groupingChooserWidget
                },
                {
                    id: 'filterChooser',
                    title: 'Filter Chooser (favorites in localStorage)',
                    icon: Icon.filter(),
                    content: filterChooserWidget
                },
                {
                    id: 'grid',
                    title: 'Grid',
                    icon: Icon.gridPanel(),
                    content: gridWidget
                }
            ],
            initialState: [
                // Default state as a developer might spec - will immediately be dirty.
                {
                    type: 'column',
                    content: [
                        {type: 'view', id: 'filterChooser'},
                        {type: 'view', id: 'groupingChooser'},
                        {type: 'view', id: 'grid'}
                    ]
                }
            ]
        });

        this.persistedPropertyModel = new PersistedPropertyModel({persistWith});
    }
}

/**
 * Test case for direct persistence of model properties.
 */
class PersistedPropertyModel extends HoistModel {
    @bindable stringValue = 'Some Default Value';

    constructor({persistWith}: {persistWith: PersistOptions}) {
        super();
        makeObservable(this);
        this.persistWith = persistWith;
        this.markPersist('stringValue');
    }
}

//------------------
// Dashboard widgets
//------------------
class BaseWidgetModel extends HoistModel {
    @lookup(ViewManagerTestModel) vmtModel: ViewManagerTestModel;
    @lookup(DashViewModel) dashViewModel: DashViewModel;

    get viewManagerModel(): ViewManagerModel {
        return this.vmtModel.viewManagerModel;
    }

    get localStorageKey(): string {
        return this.vmtModel.configFormModel.values.localStorageKey;
    }

    override onLinked() {
        super.onLinked();
        this.persistWith = {dashViewModel: this.dashViewModel};
    }
}

class GroupingChooserWidgetModel extends BaseWidgetModel {
    groupingChooserModel: GroupingChooserModel;

    override onLinked() {
        super.onLinked();
        this.groupingChooserModel = createGroupingChooserModel(this.persistWith);
    }
}

const groupingChooserWidget = hoistCmp.factory({
    model: creates(GroupingChooserWidgetModel),
    render({model}) {
        return widget(groupingChooser({flex: 1}));
    }
});

const createGroupingChooserModel = (persistWith: PersistOptions) => {
    return new GroupingChooserModel({
        persistWith,
        dimensions: ['Color', 'Size', 'Species', 'Grade'],
        initialValue: ['Color', 'Size']
    });
};

class FilterChooserWidgetModel extends BaseWidgetModel {
    filterChooserModel: FilterChooserModel;

    override onLinked() {
        super.onLinked();
        this.filterChooserModel = createFilterChooserModel(this.persistWith, this.localStorageKey);
    }
}

const filterChooserWidget = hoistCmp.factory({
    model: creates(FilterChooserWidgetModel),
    render({model}) {
        return widget(filterChooser({flex: 1}));
    }
});

const createFilterChooserModel = (persistWith: PersistOptions, localStorageKey: string) => {
    return new FilterChooserModel({
        persistWith: {
            persistValue: persistWith,
            persistFavorites: localStorageKey ? {localStorageKey: localStorageKey} : null
        },
        fieldSpecs: [
            {field: 'color', values: ['green', 'blue', 'red']},
            {field: 'grade', values: ['A', 'B', 'C', 'D']},
            {field: 'size', fieldType: 'number'},
            {field: 'species'}
        ]
    });
};

class gridWidgetModel extends BaseWidgetModel {
    gridModel: SampleGridModel;

    override onLinked() {
        super.onLinked();
        this.gridModel = new SampleGridModel({gridConfig: {persistWith: this.persistWith}});
        this.gridModel.loadAsync();
    }
}

const gridWidget = hoistCmp.factory({
    model: creates(gridWidgetModel),
    render({model}) {
        return widget(sampleGrid({omitGridTools: true}));
    }
});

const widget = hoistCmp.factory({
    render({children}) {
        return frame({
            padding: 10,
            className: 'xh-border-solid xh-bg-alt',
            items: children
        });
    }
});

//------------------
// Other helpers
//------------------
const testTab = txt => {
    return div({
        className: 'xh-pad',
        item: txt
    });
};
