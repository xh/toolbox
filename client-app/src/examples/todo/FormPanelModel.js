import {HoistModel, managed, XH} from '@xh/hoist/core';
import {
    FormModel,
    lengthIs,
    required
} from '@xh/hoist/cmp/form';
import {Icon} from '@xh/hoist/icon';

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
            }
        ]
    });

    // newTask = '';

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
            {gridModel} = parentModel,
            isValid = await formModel.validateAsync();

        if (isValid) {
            const existingId = values.id,
                task = {
                    id: existingId ?? Date.now(),
                    description: values.description,
                    dueDate: values.dueDate,
                    complete: values.complete ?? false
                };
            existingId ? parentModel.editTask(task) : parentModel.addTask(task);
            await parentModel.refreshAsync();
            gridModel.clearSelection();
            this.reset();
            XH.toast({message: existingId ? `Task updated: '${task.description}'`: `New task added: '${task.description}'`});
        } else {
            XH.toast({
                icon: Icon.warning(),
                intent: 'danger',
                message: 'Task cannot be empty.'
            });
        }
    }
}
