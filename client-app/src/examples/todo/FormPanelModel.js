import {HoistModel, managed} from '@xh/hoist/core';
import {
    FormModel,
    lengthIs,
    required
} from '@xh/hoist/cmp/form';

export class FormPanelModel extends HoistModel {

    /** @member {TodoPanelModel} */
    parentModel;

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
        this.parentModel = todoPanelModel;

        this.addReaction({
            track: () => this.parentModel.selectedTask,
            run: (selectedTask) => this.formModel.init(selectedTask)
        });
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
        }
    }

    clearForm() {
        this.formModel.init({
            id: null,
            description: null,
            dueDate: null,
            complete: null
        });
    }
}
