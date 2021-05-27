import {HoistModel, managed} from '@xh/hoist/core';
import {
    FormModel,
    lengthIs,
    required
} from '@xh/hoist/cmp/form';
import {observable, action, makeObservable} from '@xh/hoist/mobx';

export class TaskDialogModel extends HoistModel {

    /** @member {TodoPanelModel} */
    parentModel;

    @observable
    isAdd = false;

    @observable
    isOpen = false;

    @managed
    formModel = new FormModel({
        fields: [
            {
                name: 'id'
            },
            {
                name: 'complete'
            },
            {
                name: 'description',
                rules: [required, lengthIs({max: 1000})]
            },
            {
                name: 'dueDate',
                displayName: 'Due Date'
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
            const {description, dueDate, complete} = values,
                existingId = values.id,
                task = {
                    id: existingId ?? Date.now(),
                    description,
                    dueDate,
                    complete: complete ?? false
                };

            existingId ? await parentModel.editTaskAsync(task) : await parentModel.addTaskAsync(task);
            this.clearForm();
            this.close();
        }
    }

    @action
    openAddForm() {
        this.isAdd = true;
        this.isOpen = true;
        this.clearForm();
    }

    @action
    openEditForm() {
        const task = this.parentModel.selectedTasks[0];
        this.isAdd = false;
        this.isOpen = true;
        this.formModel.init(task);
    }

    @action
    close() {
        this.isOpen = false;
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
