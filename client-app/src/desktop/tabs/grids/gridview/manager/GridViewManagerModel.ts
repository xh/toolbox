import {
    HoistModel,
    managed,
    PersistenceProvider,
    PersistOptions,
    PlainObject,
    XH
} from '@xh/hoist/core';
import {action, bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {capitalize, isEmpty, isEqualWith, isFunction, isNil} from 'lodash';
import {pluralize, throwIf} from '@xh/hoist/utils/js';
import {ManageDialogModel} from './impl/ManageDialogModel';
import {ViewStub, SaveDialogModel} from './impl/SaveDialogModel';
import {RestStore} from '@xh/hoist/desktop/cmp/rest';
import {FieldType, StoreRecord} from '@xh/hoist/data';
import {StoreRecordId} from '@xh/hoist/data/StoreRecord';

export interface GridViewManagerConfig {
    /** Endpoint for rest controller. */
    url: string;
    /** Async callback triggered when view changes. Should be used to recreate the affected models. */
    onChangeAsync?: (PlainObject) => void;
    /** Used to persist this model's selected ID. */
    persistWith: PersistOptions;
    /** True (default) to render a save button alongside the primary menu button when dirty. */
    enableTopLevelSaveButton?: boolean;
    /** Fn to produce a new, empty object - can be async. */
    newViewFnAsync?: () => PlainObject;
}

export class GridViewManagerModel extends HoistModel {
    //------------------------
    // Persistence Provider
    // Pass this to models that implement `persistWith` to include their state in the view.
    //------------------------
    provider: PersistOptions = {
        getData: () => this.pendingValue ?? this.value ?? {},
        setData: value => this.mergePendingValue(value)
    };

    @observable.ref @managed manageDialogModel: ManageDialogModel;

    @observable.ref @managed saveDialogModel: SaveDialogModel;

    enableTopLevelSaveButton: boolean = true;

    newViewFn: () => PlainObject;

    /** Current state of the active view, can include not-yet-persisted changes. */
    @observable.ref pendingValue: PlainObject = null;

    /** Backing RestStore used to hold view state and coordinate RESTful updates. */
    @observable.ref @managed restStore: RestStore;

    @bindable selectedId: StoreRecordId;

    noun: string = 'Grid View';

    get pluralNoun(): string {
        return pluralize(this.noun);
    }

    get capitalNoun(): string {
        return capitalize(this.noun);
    }

    get capitalPluralNoun(): string {
        return capitalize(this.pluralNoun);
    }

    get isAdmin() {
        return XH.getUser().isHoistAdmin;
    }

    onChangeAsync?: (PlainObject) => void;

    get value(): PlainObject {
        return this.selectedView?.data.value;
    }

    get views(): StoreRecord[] {
        return this.restStore.records;
    }

    get selectedView(): StoreRecord {
        return this.restStore.getById(this.selectedId);
    }

    @computed
    get canSave(): boolean {
        const {selectedView} = this;
        if (!selectedView) return false;
        const {data} = selectedView;
        return this.isDirty && (this.isAdmin || data.isPrivate) && !this.loadModel.isPending;
    }

    @computed
    get isDirty(): boolean {
        return !this.isEqualSkipAutosize(this.pendingValue, this.value);
    }

    get isPrivate(): boolean {
        return !!this.selectedView?.data.isPrivate;
    }

    // Internal persistence provider, used to save *this* model's state, i.e. selectedId
    _provider;

    constructor({
        url,
        onChangeAsync,
        persistWith,
        enableTopLevelSaveButton = true,
        newViewFnAsync
    }: GridViewManagerConfig) {
        const {STRING, DATE, JSON, BOOL} = FieldType;

        super();
        makeObservable(this);

        throwIf(
            !isFunction(onChangeAsync),
            'GridViewManagerModel requires an `onChangeAsync` callback function'
        );

        this.restStore = new RestStore({
            url,
            processRawData: raw => this.processRaw(raw),
            fields: [
                {name: 'name', type: STRING, required: true},
                {name: 'value', type: JSON, required: true},
                {name: 'acl', type: JSON, lookupName: 'acl'},
                {name: 'description', type: STRING},
                {name: 'dateCreated', type: DATE, editable: false},
                {name: 'lastUpdatedBy', type: STRING, editable: false},
                {name: 'createdBy', type: STRING, editable: false},
                {name: 'lastUpdated', type: DATE, editable: false},
                {name: 'isGlobal', type: BOOL, editable: false},
                {name: 'isPrivate', type: BOOL, editable: false},
                {name: 'group', type: STRING, editable: false}
            ]
        });

        this.enableTopLevelSaveButton = enableTopLevelSaveButton;
        this.newViewFn = newViewFnAsync ?? (() => ({}));
        this.onChangeAsync = onChangeAsync;

        // Set up internal PersistenceProvider -- fail gently
        if (persistWith) {
            try {
                this._provider = PersistenceProvider.create({
                    path: 'gridViewManager',
                    ...persistWith
                });

                const state = this._provider.read();
                if (state?.selectedId) this.selectedId = state.selectedId;
                this.addReaction({
                    track: () => this.selectedId,
                    run: selectedId => this._provider.write({selectedId})
                });
            } catch (e) {
                console.error(e);
                XH.safeDestroy(this._provider);
                this._provider = null;
            }
        }

        this.loadAsync();
    }

    override async doLoadAsync(loadSpec) {
        await this.restStore.loadAsync();
        const {views} = this;
        // Auto-create an empty view if required
        if (isEmpty(views)) {
            const newValue = await this.newViewFn();
            this.views.push(
                await this.restStore.addRecordAsync({
                    data: {
                        name: `My ${this.capitalNoun}`,
                        value: newValue
                    }
                })
            );
        }

        // Always call selectAsync to ensure pendingValue updated and onChangeAsync callback fired if needed
        const id = this.selectedView?.id ?? this.views[0].id;
        await this.selectAsync(id);
    }

    async selectAsync(id: StoreRecordId) {
        this.selectedId = id;
        if (!this.isDirty) return;

        const {value} = this;
        this.setPendingValue(value);
        await this.onChangeAsync(value);

        // If current value is empty, we know it is the auto-created default view -
        // save it to capture the default state.
        if (isEmpty(value)) {
            await this.saveAsync(true);
        }
    }

    async saveAsync(skipToast: boolean = false) {
        if (!this.isPrivate) {
            if (!(await this.confirmShareObjSaveAsync())) return;
        }

        await this.restStore.saveRecordAsync({
            id: this.selectedId,
            data: {...this.selectedView, value: this.pendingValue}
        });

        if (!skipToast) XH.successToast(`${this.capitalNoun} successfully saved.`);
    }

    async saveAsAsync() {
        const {data} = this.selectedView;

        this.openSaveDialog({
            name: data.name,
            description: data.description,
            value: this.pendingValue,
            isAdd: false
        });
    }

    async createNewAsync() {
        const {data} = this.selectedView,
            newValue = await this.newViewFn();

        this.openSaveDialog({
            name: data.name,
            description: data.description,
            value: newValue,
            isAdd: true
        });
    }

    @action
    openSaveDialog(stub: ViewStub) {
        this.saveDialogModel = new SaveDialogModel(this, stub);
    }

    @action
    closeSaveDialog() {
        const {saveDialogModel} = this;
        this.saveDialogModel = null;
        XH.safeDestroy(saveDialogModel);
    }

    async resetAsync() {
        return this.selectAsync(this.selectedId);
    }

    @action
    openManageDialog() {
        this.manageDialogModel = new ManageDialogModel(this);
    }

    @action
    closeManageDialog() {
        const {manageDialogModel} = this;
        this.manageDialogModel = null;
        XH.safeDestroy(manageDialogModel);
        this.refreshAsync();
    }

    //------------------
    // Implementation
    //------------------
    mergePendingValue(value: PlainObject) {
        value = {...this.pendingValue, ...this.cleanValue(value)};
        this.setPendingValue(value);
    }

    processRaw(raw: PlainObject) {
        const {capitalPluralNoun: noun} = this,
            group = raw.isPrivate ? `My ${noun}` : `Shared ${noun}`;
        return {...raw, group};
    }

    @action
    setPendingValue(value: PlainObject) {
        value = this.cleanValue(value);
        if (!this.isEqualSkipAutosize(this.pendingValue, value)) {
            this.pendingValue = value;
        }
    }

    cleanValue(value: PlainObject): PlainObject {
        // Stringify and parse to ensure that the value is valid JSON
        // (i.e. no object instances, no keys with undefined values, etc.)
        return JSON.parse(JSON.stringify(value));
    }

    isEqualSkipAutosize(a, b) {
        // Skip spurious column autosize differences between states
        const comparer = (aVal, bVal, key, aObj) => {
            if (key === 'width' && !isNil(aObj.colId) && !aObj.manuallySized) return true;
            return undefined;
        };
        return isEqualWith(a, b, comparer);
    }

    async confirmShareObjSaveAsync() {
        return XH.confirm({
            title: 'Please confirm...',
            message: `You are saving a shared public ${this.noun}. Do you wish to continue?`,
            confirmProps: {
                text: 'Yes, save changes',
                intent: 'primary',
                outlined: true
            },
            cancelProps: {
                text: 'Cancel',
                autoFocus: true
            }
        });
    }
}
