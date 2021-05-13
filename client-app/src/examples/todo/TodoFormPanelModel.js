import {HoistModel, managed, XH} from '@xh/hoist/core';
import {
    FormModel,
    lengthIs,
    required
} from '@xh/hoist/cmp/form';
import {Icon} from '@xh/hoist/icon';

export class TodoFormPanelModel extends HoistModel {

    /** @member {TodoPanelModel} */
    parentModel;

    @managed
    formModel = new FormModel({
        fields: [
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

    newTask = '';

    constructor(todoPanelModel) {
        super();
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
            const newTask = {
                id: Date.now(),
                description: values.description,
                dueDate: values.dueDate,
                complete: false
            };
            parentModel.addTask(newTask);
            await parentModel.refreshAsync();
            XH.toast({message: `New task added: '${newTask.description}'`});
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
