import {HoistModel, PersistableState, XH} from '@xh/hoist/core';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {DashSpec, DashWidgetState, ValidationResult} from '../dash/types';
import {validateSpec, migrateSpec} from '../dash/validation';
import {EXAMPLE_SPECS, ExampleSpec} from '../dash/exampleSpecs';
import {AppModel} from '../AppModel';

/**
 * Model for the JSON harness — manages the editor state, validation,
 * and the apply/export workflow.
 */
export class JsonHarnessModel extends HoistModel {
    @bindable editorValue: string = '';
    @observable.ref lastValidation: ValidationResult = null;
    @bindable lastError: string = null;

    get exampleSpecs(): ExampleSpec[] {
        return EXAMPLE_SPECS;
    }

    constructor() {
        super();
        makeObservable(this);
        this.syncFromDashboard();
    }

    /** Load current dashboard state into the editor. */
    @action
    syncFromDashboard() {
        try {
            const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
            const spec: DashSpec = {version: 1, state: this.buildSpecState(dashModel)};
            this.editorValue = JSON.stringify(spec, null, 2);
            this.lastValidation = null;
            this.lastError = null;
        } catch (e) {
            this.editorValue = '{"version": 1, "state": []}';
        }
    }

    /** Parse, migrate, validate, and apply the editor JSON to the dashboard. */
    @action
    applySpec() {
        this.lastError = null;
        this.lastValidation = null;

        // Parse
        let raw: any;
        try {
            raw = JSON.parse(this.editorValue);
        } catch (e) {
            this.lastError = `JSON parse error: ${e.message}`;
            return;
        }

        // Migrate
        let spec: DashSpec;
        try {
            spec = migrateSpec(raw as DashSpec);
        } catch (e) {
            this.lastError = `Migration error: ${e.message}`;
            return;
        }

        // Validate
        const result = validateSpec(spec);
        this.lastValidation = result;

        if (!result.valid) return;

        // Apply to dashboard
        try {
            const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
            dashModel.setPersistableState(new PersistableState({state: spec.state}));
            XH.successToast('Dashboard spec applied.');
        } catch (e) {
            this.lastError = `Apply error: ${e.message}`;
        }
    }

    /** Load an example spec into the editor. */
    @action
    loadExample(name: string) {
        const example = EXAMPLE_SPECS.find(e => e.name === name);
        if (example) {
            this.editorValue = JSON.stringify(example.spec, null, 2);
            this.lastValidation = null;
            this.lastError = null;
        }
    }

    /** Validate without applying. */
    @action
    validateOnly() {
        this.lastError = null;
        this.lastValidation = null;

        let raw: any;
        try {
            raw = JSON.parse(this.editorValue);
        } catch (e) {
            this.lastError = `JSON parse error: ${e.message}`;
            return;
        }

        let spec: DashSpec;
        try {
            spec = migrateSpec(raw as DashSpec);
        } catch (e) {
            this.lastError = `Migration error: ${e.message}`;
            return;
        }

        const result = validateSpec(spec);
        if (result.valid && result.warnings.length === 0) {
            XH.successToast('Spec is valid.');
        } else {
            this.lastValidation = result;
        }
    }

    /** Clear validation/error display. */
    @action
    dismissValidation() {
        this.lastValidation = null;
        this.lastError = null;
    }

    //------------------------
    // Implementation
    //------------------------
    /**
     * Build the current DashSpec state from the DashCanvasModel's live viewModels and layout.
     *
     * Workaround for https://github.com/xh/hoist-react/issues/4276 —
     * getPersistableState() can return stale initialState after persistence restore.
     * Once that issue is resolved, this method and its callers could be simplified to
     * use getPersistableState() directly.
     */
    private buildSpecState(dashModel: DashCanvasModel): DashWidgetState[] {
        return dashModel.layout
            .map(({i: id, x, y, w, h}) => {
                const vm = dashModel.viewModels.find(v => v.id === id);
                if (!vm) return null;
                return {
                    layout: {x, y, w, h},
                    viewSpecId: vm.viewSpec.id,
                    title: vm.title,
                    state: vm.viewState
                };
            })
            .filter(Boolean);
    }
}
