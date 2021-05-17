import {HoistService, XH} from '@xh/hoist/core';
import {reject} from 'lodash';

export class TodoService extends HoistService {
    tasks;

    async initAsync() {
        await this.loadAsync();
    }

    async doLoadAsync() {
        this.tasks = XH.getPref('todoApp');
    }

    async addTaskAsync(task) {
        XH.setPref('todoApp', [...this.tasks, task]);
        await this.refreshAsync();
    }

    async editTaskAsync(task) {
        const {id} = task;
        let tasks = XH.getPref('todoApp');
        tasks = reject(tasks, {id});
        tasks = [...tasks, task];
        XH.setPref('todoApp', tasks);
        await this.refreshAsync();
    }

    async removeTaskAsync(id) {
        this.tasks = reject(this.tasks, {id});
        XH.setPref('todoApp', this.tasks);
        await this.refreshAsync();
    }
}
