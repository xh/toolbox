import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {FormModel} from '@xh/hoist/cmp/form';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {div} from '@xh/hoist/cmp/layout';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {ViewManagerModel} from '@xh/hoist/core/persist/viewmanager';
import {required} from '@xh/hoist/data';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {action, computed, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {SampleGridModel} from '../../../desktop/common';

export class ViewManagerTestModel extends HoistModel {
    @managed configFormModel: FormModel;

    @managed @observable.ref viewManagerModel: ViewManagerModel;

    /** Persisted models - all implementing Hoist's {@link Persistable} interface. */
    @managed @observable.ref groupingChooserModel: GroupingChooserModel;
    @managed @observable.ref filterChooserModel: FilterChooserModel;
    @managed @observable.ref tabContainerModel: TabContainerModel;
    @managed @observable.ref panelModel: PanelModel;
    @managed @observable.ref gridModel: SampleGridModel;

    get managedPersistables() {
        return [
            this.viewManagerModel,
            this.groupingChooserModel,
            this.filterChooserModel,
            this.tabContainerModel,
            this.panelModel,
            this.gridModel
        ];
    }

    @computed
    get value(): string {
        if (!this.viewManagerModel) return '[No ViewManagerModel]';
        return JSON.stringify(this.viewManagerModel.value, null, 2);
    }

    @computed
    get pendingValue(): string {
        if (!this.viewManagerModel) return '[No ViewManagerModel]';
        return JSON.stringify(this.viewManagerModel.pendingValue, null, 2);
    }

    constructor() {
        super();
        makeObservable(this);

        this.configFormModel = new FormModel({
            fields: [
                {name: 'entityName', rules: [required], initialValue: 'testView'},
                {name: 'entityDisplayName', rules: [required], initialValue: 'View'},
                {name: 'localStorageKey', initialValue: 'viewManagerTest'},
                {name: 'enableSharing', displayName: 'Sharing', initialValue: true},
                {name: 'enableDefault', displayName: 'Default', initialValue: true},
                {name: 'enableAutoSave', displayName: 'AutoSave', initialValue: true},
                {name: 'enableFavorites', displayName: 'Faves', initialValue: true}
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
                entityName,
                entityDisplayName,
                localStorageKey,
                enableSharing,
                enableDefault,
                enableAutoSave,
                enableFavorites
            } = data;

        const newModel = await ViewManagerModel.createAsync({
            entity: {
                name: entityName,
                displayName: entityDisplayName
            },
            persistWith: localStorageKey ? {localStorageKey: localStorageKey} : null,
            enableSharing,
            enableDefault,
            enableAutoSave,
            enableFavorites
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

        this.groupingChooserModel = new GroupingChooserModel({
            persistWith,
            dimensions: ['Color', 'Size', 'Species', 'Grade'],
            initialValue: ['Color', 'Size']
        });

        this.filterChooserModel = new FilterChooserModel({
            persistWith,
            fieldSpecs: [
                {field: 'color', values: ['green', 'blue', 'red']},
                {field: 'grade', values: ['A', 'B', 'C', 'D']},
                {field: 'size', fieldType: 'number'},
                {field: 'species'}
            ]
        });

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

        this.gridModel = new SampleGridModel({
            gridConfig: {persistWith}
        });
        this.gridModel.loadAsync();
    }
}

const testTab = txt => {
    return div({
        className: 'xh-pad',
        item: txt
    });
};
