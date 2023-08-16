import {HoistModel, managed} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {required, lengthIs} from '@xh/hoist/data';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {observable, action, makeObservable} from '@xh/hoist/mobx';
import {TodoPanelModel} from './TodoPanelModel';

export class TaskDialogModel extends HoistModel {
    parentModel: TodoPanelModel;

    @observable
    isOpen = false;

    @managed
    formModel = new FormModel({
        fields: [
            {
                name: 'id'
            },
            {
                name: 'complete',
                initialValue: false
            },
            {
                name: 'description',
                rules: [required, lengthIs({max: 1000})]
            },
            {
                name: 'dueDate',
                displayName: 'Due Date',
                initialValue: () => LocalDate.today()
            }
        ]
    });

    get isAdd() {
        return this.formModel.values.id == null;
    }

    constructor(todoPanelModel) {
        super();
        makeObservable(this);

        this.parentModel = todoPanelModel;
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

            if (existingId) {
                await parentModel.editTaskAsync(task);
            } else {
                await parentModel.addTaskAsync(task);
            }

            this.close();
        }
    }

    @action
    openAddForm() {
        this.isOpen = true;
        this.formModel.init();
    }

    @action
    openEditForm(task) {
        this.isOpen = true;
        this.formModel.init(task);
    }

    @action
    close() {
        this.isOpen = false;
    }
}
