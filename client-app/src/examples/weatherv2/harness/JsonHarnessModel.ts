import {HoistModel, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {DashSpec, ValidationResult} from '../dash/types';
import {validateSpec, migrateSpec} from '../dash/validation';
import {EXAMPLE_SPECS, ExampleSpec} from '../dash/exampleSpecs';

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
            const {AppModel} = require('../AppModel');
            const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
            const persistable = dashModel.getPersistableState();
            const spec: DashSpec = {version: 1, state: persistable?.value?.state ?? []};
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
            const {AppModel} = require('../AppModel');
            const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
            dashModel.setPersistableState({value: {state: spec.state}});
            XH.successToast('Dashboard spec applied.');
        } catch (e) {
            this.lastError = `Apply error: ${e.message}`;
        }
    }

    /** Copy current dashboard spec to clipboard. */
    async copySpecAsync() {
        try {
            const {AppModel} = require('../AppModel');
            const dashModel = AppModel.instance.weatherV2DashModel.dashCanvasModel;
            const persistable = dashModel.getPersistableState();
            const spec: DashSpec = {version: 1, state: persistable?.value?.state ?? []};
            const json = JSON.stringify(spec, null, 2);
            await navigator.clipboard.writeText(json);
            XH.successToast('Spec copied to clipboard.');
        } catch (e) {
            XH.dangerToast('Failed to copy spec.');
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

        this.lastValidation = validateSpec(spec);
    }
}
