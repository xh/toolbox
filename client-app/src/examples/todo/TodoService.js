import {HoistService, XH} from '@xh/hoist/core';
import {reject} from 'lodash';

export class TodoService extends HoistService {

    async getTasksAsync() {
        return XH.getPref('todoApp');
    }

    async addTaskAsync(task) {
        let tasks = await this.getTasksAsync();
        tasks = [...tasks, task];
        XH.setPref('todoApp', tasks);
    }

    async editTaskAsync(task) {
        const {id} = task;
        let tasks = await this.getTasksAsync();
        tasks = reject(tasks, {id});
        tasks = [...tasks, task];
        XH.setPref('todoApp', tasks);
    }

    async removeTaskAsync(task) {
        const {id} = task;
        let tasks = await this.getTasksAsync();
        tasks = reject(tasks, {id});
        XH.setPref('todoApp', tasks);
    }
}
