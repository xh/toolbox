import {HoistModel, managed, XH} from '@xh/hoist/core';
import {
    FormModel,
    lengthIs,
    required
} from '@xh/hoist/cmp/form';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {Icon} from '@xh/hoist/icon';

export class TodoFormPanelModel extends HoistModel {

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
                name: 'complete'
            },
            {
                name: 'dueDate',
                displayName: 'Due Date'
            }
        ]
    });

    constructor() {
        super();
        // makeObservable(this);
    }

    async reset() {
        this.formModel.reset();
    }

    async submitAsync() {
        const {formModel} = this;
        const isValid = await formModel.validateAsync().linkTo(this.validateTask);
        if (isValid) {
            //  add logic to store entry here
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
