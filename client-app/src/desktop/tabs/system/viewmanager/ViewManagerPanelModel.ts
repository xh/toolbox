import type {ViewInfo, ViewManagerConfig} from '@xh/hoist/cmp/viewmanager';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import type {ViewManagerStateButtonMode} from '@xh/hoist/desktop/cmp/viewmanager';
import {action, bindable, computed, observableRef, runInAction} from '@xh/hoist/mobx';
import {get, isEqual, isUndefined, trim} from 'lodash';
import {fmtDemoConfig, raw} from '../../../common/Demo';
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

/**
 * The state of one persisted component within the current view. Read from the ViewManagerModel's
 * values, not from the component, so it trails a change by the provider's 250ms write debounce.
 */
export interface PersistState {
    /** True if the pending value holds state at the component's path. */
    isCustom: boolean;
    /** True if the pending value at the component's path differs from the saved value. */
    isDirty: boolean;
}

export class ViewManagerPanelModel extends HoistModel {
    override telemetryPrefix = 'toolbox.client.viewManager';

    @managed @observableRef accessor viewManagerModel: ViewManagerModel = null;
    @managed @observableRef accessor persistedModels: PersistedModels = null;

    rebuildTask = TaskObserver.trackLast({message: 'Building ViewManagerModel...'});

    /** Incremented on each rebuild, so a stale build can tell it lost the race. */
    private buildId = 0;

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
    // Test harness - applied when the bound models are rebuilt
    //------------------------
    /** True to give the DashContainer shorthand initial state, which reproduces a dirty load. */
    @bindable accessor shorthandDashState = false;

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

    /** True if the harness options have changed since the bound models were built. */
    get isHarnessPending(): boolean {
        const {persistedModels} = this;
        return !!persistedModels && persistedModels.shorthandDashState !== this.shorthandDashState;
    }

    get isConfigValid(): boolean {
        return !!trim(this.type);
    }

    get isRebuilding(): boolean {
        return this.rebuildTask.isPending;
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

    /** The current view's identity and flags, for the View State panel. */
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

    /** The `createAsync` call that built the live model, leaving out framework defaults. */
    @computed
    get configSnippet(): string {
        const {appliedConfig} = this;
        if (!appliedConfig) return '';
        const live = createModelConfig(appliedConfig),
            nonDefault = <K extends keyof typeof FRAMEWORK_DEFAULTS>(key: K) =>
                live[key] === FRAMEWORK_DEFAULTS[key] ? undefined : live[key];

        const call = fmtDemoConfig<ViewManagerConfig>('ViewManagerModel.createAsync', {
            type: live.type,
            instance: nonDefault('instance'),
            typeDisplayName: live.typeDisplayName,
            defaultDisplayName: nonDefault('defaultDisplayName'),
            globalDisplayName: nonDefault('globalDisplayName'),
            initialViewSpec: live.initialViewSpec
                ? raw(initialViewSpecCode(appliedConfig))
                : undefined,
            enableDefault: nonDefault('enableDefault'),
            enableAutoSave: nonDefault('enableAutoSave'),
            enableSharing: nonDefault('enableSharing'),
            enableGlobal: nonDefault('enableGlobal'),
            manageGlobal: appliedConfig.manageGlobal ? undefined : false,
            preserveUnsavedChanges: nonDefault('preserveUnsavedChanges')
        });
        return `const viewManagerModel = await ${call};`;
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
        const config = this.railConfig,
            buildId = ++this.buildId;

        this.destroyModels();
        try {
            const viewManagerModel = await this.runner()
                .span('rebuild')
                .linkTo(this.rebuildTask)
                .run(ctx => ViewManagerModel.createAsync(createModelConfig(config), ctx));

            // A later rebuild, or unmounting the page, makes this result stale.
            if (buildId !== this.buildId || this.isDestroyed) {
                XH.safeDestroy(viewManagerModel);
                return;
            }

            runInAction(() => {
                this.viewManagerModel = viewManagerModel;
                this.appliedConfig = config;
            });
            Object.assign(window, {testViewManagerModel: viewManagerModel});
            this.rebuildPersistedModels();
        } catch (e) {
            XH.handleException(e);
        }
    }

    /**
     * Destroy and recreate only the bound models, against the same ViewManagerModel - as when an
     * app unmounts and remounts the components bound to a long-lived model.
     */
    @action
    rebuildPersistedModels() {
        const {viewManagerModel} = this;
        XH.safeDestroy(this.persistedModels);
        this.persistedModels = new PersistedModels(viewManagerModel, {
            shorthandDashState: this.shorthandDashState
        });
        this.persistedModels.loadAsync().catchDefault();
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
        Object.assign(window, {testViewManagerModel: null});
    }
}

/** Framework defaults for the rail's config options. The snippet leaves these out. */
const FRAMEWORK_DEFAULTS = {
    instance: 'default',
    defaultDisplayName: 'default',
    globalDisplayName: 'global',
    enableAutoSave: true,
    enableDefault: true,
    enableGlobal: true,
    enableSharing: true,
    preserveUnsavedChanges: true
} as const;

/** Build a `ViewManagerConfig` from the rail values. */
function createModelConfig(config: DemoModelConfig): ViewManagerConfig {
    return {
        type: trim(config.type),
        // A blank text option falls back to the framework default.
        instance: trim(config.instance) || undefined,
        typeDisplayName: trim(config.typeDisplayName) || undefined,
        defaultDisplayName: trim(config.defaultDisplayName) || undefined,
        globalDisplayName: trim(config.globalDisplayName) || undefined,
        enableAutoSave: config.enableAutoSave,
        enableDefault: config.enableDefault,
        enableGlobal: config.enableGlobal,
        enableSharing: config.enableSharing,
        preserveUnsavedChanges: config.preserveUnsavedChanges,
        // On defers to the server. The client config can only restrict it.
        manageGlobal: config.manageGlobal ? undefined : false,
        initialViewSpec: createInitialViewSpec(config)
    };
}

/**
 * Pick the initial view by name. Required when the default view is off - otherwise the in-code
 * default is the fallback. Keep in step with `initialViewSpecCode` below, which shows this code.
 */
function createInitialViewSpec(config: DemoModelConfig): (views: ViewInfo[]) => ViewInfo {
    const name = trim(config.initialViewName),
        {enableDefault} = config;
    if (!name && enableDefault) return undefined;
    return views => views.find(it => it.name === name) ?? (enableDefault ? null : views[0]);
}

function initialViewSpecCode(config: DemoModelConfig): string {
    const name = trim(config.initialViewName),
        fallback = config.enableDefault ? 'null' : 'views[0]';
    if (!name) return `views => ${fallback}`;
    const literal = `'${name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    return `views => views.find(it => it.name === ${literal}) ?? ${fallback}`;
}
