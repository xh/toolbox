import type {ViewInfo, ViewManagerConfig} from '@xh/hoist/cmp/viewmanager';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import type {ViewManagerStateButtonMode} from '@xh/hoist/desktop/cmp/viewmanager';
import {action, bindable, computed, observableRef, runInAction} from '@xh/hoist/mobx';
import {get, isEqual, isUndefined, trim} from 'lodash';
import {PersistedModels} from './PersistedModels';

/** The ViewManagerModel config options set from the rail, applied on rebuild. */
export interface DemoModelConfig {
    type: string;
    instance: string;
    typeDisplayName: string;
    defaultDisplayName: string;
    globalDisplayName: string;
    initialViewName: string;
    enableAutoSave: boolean;
    enableDefault: boolean;
    enableGlobal: boolean;
    enableSharing: boolean;
    manageGlobal: boolean;
    preserveUnsavedChanges: boolean;
}

/** The state of one persisted component within the current view. */
export interface PersistState {
    /** True if the component holds state other than its in-code default. */
    isCustom: boolean;
    /** True if the component's state differs from the state saved in the current view. */
    isDirty: boolean;
}

export class ViewManagerPanelModel extends HoistModel {
    override telemetryPrefix = 'toolbox.viewManagerDemo';

    @managed @observableRef accessor viewManagerModel: ViewManagerModel = null;
    @managed @observableRef accessor persistedModels: PersistedModels = null;

    rebuildTask = TaskObserver.trackLast({message: 'Building ViewManagerModel...'});

    //------------------------
    // ViewManagerModel config - applied on rebuild
    //------------------------
    @bindable accessor type = 'viewManagerDemo';
    @bindable accessor instance = 'default';
    @bindable accessor typeDisplayName = 'view';
    @bindable accessor defaultDisplayName = 'default';
    @bindable accessor globalDisplayName = 'global';
    @bindable accessor initialViewName: string = null;
    @bindable accessor enableAutoSave = true;
    @bindable accessor enableDefault = true;
    @bindable accessor enableGlobal = true;
    @bindable accessor enableSharing = true;
    @bindable accessor manageGlobal = true;
    @bindable accessor preserveUnsavedChanges = true;

    /** The config the current ViewManagerModel was built with. */
    @observableRef accessor appliedConfig: DemoModelConfig = null;

    //------------------------
    // ViewManager props - Playground only
    //------------------------
    @bindable accessor showSaveButton: ViewManagerStateButtonMode = 'whenDirty';
    @bindable accessor showRevertButton: ViewManagerStateButtonMode = 'never';
    @bindable accessor buttonSide: 'left' | 'right' = 'right';

    /** Persist path the View State panel is focused on, or null to show the whole view. */
    @bindable accessor focusedPath: string = null;

    @computed
    get railConfig(): DemoModelConfig {
        return {
            type: this.type,
            instance: this.instance,
            typeDisplayName: this.typeDisplayName,
            defaultDisplayName: this.defaultDisplayName,
            globalDisplayName: this.globalDisplayName,
            initialViewName: this.initialViewName,
            enableAutoSave: this.enableAutoSave,
            enableDefault: this.enableDefault,
            enableGlobal: this.enableGlobal,
            enableSharing: this.enableSharing,
            manageGlobal: this.manageGlobal,
            preserveUnsavedChanges: this.preserveUnsavedChanges
        };
    }

    /** True if the rail config has changed since the current model was built. */
    @computed
    get isConfigPending(): boolean {
        return !isEqual(this.railConfig, this.appliedConfig);
    }

    get isConfigValid(): boolean {
        return !!trim(this.type);
    }

    /** The saved value of the current view, narrowed to the focused path if set. */
    @computed
    get savedValue(): unknown {
        const {viewManagerModel, focusedPath} = this;
        if (!viewManagerModel) return null;
        const {value} = viewManagerModel.view;
        return focusedPath ? get(value, focusedPath) : value;
    }

    /** The current value, including unsaved changes, narrowed to the focused path if set. */
    @computed
    get pendingValue(): unknown {
        const {viewManagerModel, focusedPath} = this;
        if (!viewManagerModel) return null;
        const value = viewManagerModel.getValue();
        return focusedPath ? get(value, focusedPath) : value;
    }

    /** A summary of the current view, for the Playground readout. */
    @computed
    get viewSummary(): Record<string, unknown> {
        const {viewManagerModel} = this;
        if (!viewManagerModel) return null;
        const {view, isValueDirty, autoSave} = viewManagerModel;
        return {
            name: view.name,
            token: view.token,
            isDefault: view.isDefault,
            isOwned: view.isOwned,
            isShared: view.isShared,
            isGlobal: view.isGlobal,
            isValueDirty,
            autoSave
        };
    }

    constructor() {
        super();
        this.rebuildAsync();
    }

    /** State of the component persisted at `path`, within the current view. */
    getPersistState(path: string): PersistState {
        const {viewManagerModel} = this,
            saved = get(viewManagerModel.view.value, path),
            current = get(viewManagerModel.getValue(), path);
        return {isCustom: !isUndefined(current), isDirty: !isEqual(saved, current)};
    }

    @action
    toggleFocus(path: string) {
        this.focusedPath = this.focusedPath === path ? null : path;
    }

    /**
     * Destroy the ViewManagerModel and every model bound to it, then build them again from the
     * current rail config.
     */
    async rebuildAsync() {
        if (!this.isConfigValid) return;
        const config = this.railConfig;

        this.destroyModels();
        try {
            const viewManagerModel = await this.runner()
                .span('rebuild')
                .linkTo(this.rebuildTask)
                .run(ctx => ViewManagerModel.createAsync(createModelConfig(config), ctx));

            runInAction(() => {
                this.viewManagerModel = viewManagerModel;
                this.appliedConfig = config;
                this.persistedModels = new PersistedModels(viewManagerModel);
            });

            // Expose the live model to the console and to test automation.
            Object.assign(window, {testViewManagerModel: viewManagerModel});
            this.persistedModels.loadAsync();
        } catch (e) {
            XH.handleException(e);
        }
    }

    //------------------------
    // Implementation
    //------------------------
    @action
    private destroyModels() {
        // Destroy bound models first, so their providers unregister from a live model.
        XH.safeDestroy(this.persistedModels, this.viewManagerModel);
        this.persistedModels = null;
        this.viewManagerModel = null;
    }
}

/** Build a `ViewManagerConfig` from the rail values. */
export function createModelConfig(config: DemoModelConfig): ViewManagerConfig {
    const {initialViewName, enableDefault, manageGlobal} = config;
    return {
        type: trim(config.type),
        // A blank text option falls back to the framework default.
        instance: trim(config.instance) || undefined,
        typeDisplayName: trim(config.typeDisplayName) || undefined,
        defaultDisplayName: trim(config.defaultDisplayName) || undefined,
        globalDisplayName: trim(config.globalDisplayName) || undefined,
        enableAutoSave: config.enableAutoSave,
        enableGlobal: config.enableGlobal,
        enableSharing: config.enableSharing,
        preserveUnsavedChanges: config.preserveUnsavedChanges,
        // On defers to the server. The client config can only restrict it.
        manageGlobal: manageGlobal ? undefined : false,
        // Required when the default view is off. Otherwise the in-code default is the fallback.
        initialViewSpec:
            initialViewName || !enableDefault
                ? (views: ViewInfo[]) =>
                      views.find(it => it.name === initialViewName) ??
                      (enableDefault ? null : views[0])
                : undefined,
        enableDefault
    };
}
