import {HoistModel, managed, XH} from '@xh/hoist/core';
import {
    FormModel,
    lengthIs,
    required
} from '@xh/hoist/cmp/form';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {Icon} from '@xh/hoist/icon';

export class TodoFormPanelModel extends HoistModel {

    /** @member {TodoPanelModel} */
    parentModel;

    @managed
    validateTask = new PendingTaskModel();

    @managed
    formModel = new FormModel({
        fields: [
            {
                name: 'task',
                rules: [required, lengthIs({max: 50, min: 1})]
            },
            {
                name: 'dueDate',
                displayName: 'Due Date'
            }
        ]
    });

    constructor(todoPanelModel) {
        super();
        this.parentModel = todoPanelModel;
    }

    async reset() {
        this.formModel.reset();
    }

    async submitAsync() {
        const {formModel} = this;
        const isValid = await formModel.validateAsync().linkTo(this.validateTask);
        if (isValid) {
            this.parentModel.data.push({
                id: Date.now(),
                task: formModel.values.task,
                complete: false,
                dueDate: formModel.values.dueDate ? formModel.values.dueDate : null
            });
            this.parentModel.refreshAsync();
            XH.toast({message: 'New task added to todo list.'});
            this.reset();
        } else {
            XH.toast({
                icon: Icon.warning(),
                intent: 'danger',
                message: 'Task cannot be empty.'
            });
        }
    }
}
