import {HoistModel, managed} from '@xh/hoist/core';
import {
    FormModel,
    lengthIs,
    required
} from '@xh/hoist/cmp/form';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class TaskDialogModel extends HoistModel {

    /** @member {TodoPanelModel} */
    parentModel;

    @bindable
    isOpen = false;

    @managed
    formModel = new FormModel({
        fields: [
            {
                name: 'id'
            },
            {
                name: 'description',
                rules: [required, lengthIs({max: 50, min: 1})]
            },
            {
                name: 'dueDate',
                displayName: 'Due Date'
            },
            {
                name: 'complete'
            }
        ]
    });

    constructor(todoPanelModel) {
        super();
        makeObservable(this);
        this.parentModel = todoPanelModel;
    }

    reset() {
        this.formModel.reset();
    }

    async submitAsync() {
        const {formModel, parentModel} = this,
            {values} = formModel,
            isValid = await formModel.validateAsync();

        if (isValid) {
            const existingId = values.id,
                task = {
                    id: existingId ?? Date.now(),
                    description: values.description,
                    dueDate: values.dueDate,
                    complete: values.complete ?? false
                };

            existingId ? await parentModel.editTaskAsync(task) : await parentModel.addTaskAsync(task);
            this.clearForm();
            this.setIsOpen(false);
        }
    }

    openAddForm() {
        this.setIsOpen(true);
        this.clearForm();
    }

    openEditForm(task) {
        this.setIsOpen(true);
        this.formModel.init(task);
    }

    //------------------------
    // Implementation
    //------------------------
    clearForm() {
        this.formModel.init({
            id: null,
            description: null,
            dueDate: null,
            complete: null
        });
    }
}
