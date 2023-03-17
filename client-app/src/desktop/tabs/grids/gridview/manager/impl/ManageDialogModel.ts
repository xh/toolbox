import {FormModel} from '@xh/hoist/cmp/form';
import {GridAutosizeMode, GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {lengthIs, required} from '@xh/hoist/data';
import {Icon} from '@xh/hoist/icon';
import {makeObservable, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {isEmpty} from 'lodash';
import {GridViewManagerModel} from '../GridViewManagerModel';
import {StoreRecordId} from '@xh/hoist/data/StoreRecord';

export class ManageDialogModel extends HoistModel {
    parentModel: GridViewManagerModel;

    @observable isOpen: boolean = false;

    @managed gridModel: GridModel;

    @managed formModel: FormModel;

    get noun(): string {
        return this.parentModel.noun;
    }

    get pluralNoun(): string {
        return this.parentModel.pluralNoun;
    }

    get selectedId(): StoreRecordId {
        return this.gridModel.selectedId;
    }

    get selIsPrivate(): boolean {
        return this.gridModel.selectedRecord?.data.isPrivate ?? false;
    }

    get userCreated(): boolean {
        return this.gridModel.selectedRecord?.data.createdBy === XH.getUser().username;
    }

    get canDelete(): boolean {
        return this.parentModel.views.length > 1 && (this.isAdmin || this.selIsPrivate);
    }

    get canEdit(): boolean {
        return this.isAdmin || this.selIsPrivate;
    }

    get showRoles(): boolean {
        return this.isAdmin;
    }

    get showSaveButton(): boolean {
        const {formModel} = this;
        return formModel.isDirty && !formModel.readonly && !this.loadModel.isPending;
    }

    /** True if the selected object would end up shared to all users if saved. */
    get willBeGlobal(): boolean {
        return this.formModel.values.isGlobal;
    }

    /** ACL suitable for POSTing to server, constructed from component form fields. */
    get aclForPost(): string | PlainObject {
        const {roles, isGlobal} = this.formModel.values;
        return isGlobal ? '*' : isEmpty(roles) ? null : {roles};
    }

    get isAdmin(): boolean {
        return this.parentModel.isAdmin;
    }

    constructor(parentModel) {
        super();
        makeObservable(this);

        this.parentModel = parentModel;
        this.gridModel = this.createGridModel();
        this.formModel = this.createFormModel();

        const {gridModel, formModel} = this;
        this.addReaction(
            {
                track: () => gridModel.selectedRecord,
                run: record => {
                    if (record) {
                        formModel.readonly = !this.canEdit;
                        formModel.init({
                            ...record.data,
                            roles: record.data.acl.roles ?? []
                        });
                    }
                }
            },
            {
                track: () => formModel.values.isGlobal,
                run: isGlobal => {
                    if (isGlobal) {
                        formModel.setValues({roles: []});
                    }
                }
            }
        );

        wait()
            .then(() => this.loadAsync())
            .then(() => this.ensureGridHasSelection());
    }

    close() {
        this.parentModel.closeManageDialog();
    }

    async saveAsync() {
        return this.doSaveAsync().linkTo(this.loadModel).catchDefault();
    }

    async deleteAsync() {
        return this.doDeleteAsync().linkTo(this.loadModel).catchDefault();
    }

    //------------------------
    // Implementation
    //------------------------
    override async doLoadAsync(loadSpec) {
        await this.parentModel.loadAsync(loadSpec);
    }

    async doSaveAsync() {
        const {selectedId, formModel, noun, parentModel, aclForPost, isAdmin} = this,
            {fields, isDirty} = formModel,
            {name, description, isGlobal} = formModel.getData(),
            isValid = await formModel.validateAsync();

        if (!isValid || !selectedId || !isDirty) return;

        // Additional sanity-check before POSTing an update - non-admins should never be modifying global views.
        if (isGlobal && !isAdmin)
            throw XH.exception(
                `Cannot save changes to globally-shared ${noun} - missing required permission.`
            );

        if (fields.isGlobal.isDirty) {
            const confirmed = await XH.confirm({
                title: 'Please confirm...',
                message: isGlobal
                    ? `This will share the selected ${noun} with ALL users.`
                    : `The selected ${noun} will no longer be available to all users.`
            });

            if (!confirmed) return;
        }

        await parentModel.restStore.saveRecordAsync({
            id: selectedId as string,
            data: {
                name,
                description,
                acl: aclForPost
            }
        });

        await this.refreshAsync();
    }

    async doDeleteAsync() {
        const {selectedRecord} = this.gridModel;
        if (!selectedRecord) return;

        const {name} = selectedRecord.data;
        const confirmed = await XH.confirm({
            title: 'Delete',
            icon: Icon.delete(),
            message: `Are you sure you want to delete "${name}"?`
        });
        if (!confirmed) return;

        await this.parentModel.restStore.deleteRecordAsync(selectedRecord);
        await this.refreshAsync();
    }

    ensureGridHasSelection() {
        const {gridModel} = this;
        if (gridModel.hasSelection) return;

        const {selectedView} = this.parentModel;
        if (selectedView) {
            gridModel.selModel.select(selectedView.id);
        } else {
            gridModel.preSelectFirstAsync();
        }
    }

    createGridModel(): GridModel {
        return new GridModel({
            sortBy: 'name',
            groupBy: 'group',
            stripeRows: false,
            rowBorders: true,
            hideHeaders: true,
            showGroupRowCounts: false,
            store: this.parentModel.restStore,
            autosizeOptions: {mode: GridAutosizeMode.DISABLED},
            columns: [
                {
                    field: 'isGlobal',
                    width: 40,
                    align: 'center',
                    headerName: Icon.globe(),
                    renderer: v => (v ? Icon.globe() : null),
                    tooltip: v => (v ? 'Shared with all users.' : '')
                },
                {field: 'name', flex: true},
                {field: 'group', hidden: true}
            ]
        });
    }

    createFormModel(): FormModel {
        return new FormModel({
            fields: [
                {name: 'name', rules: [required, lengthIs({max: 255})]},
                {name: 'description'},
                {name: 'isGlobal', displayName: 'Global'},
                {name: 'roles', displayName: 'Roles'},
                {name: 'createdBy', readonly: true},
                {name: 'dateCreated', displayName: 'Created', readonly: true},
                {name: 'lastUpdated', displayName: 'Updated', readonly: true},
                {name: 'lastUpdatedBy', displayName: 'Updated By', readonly: true}
            ]
        });
    }
}
