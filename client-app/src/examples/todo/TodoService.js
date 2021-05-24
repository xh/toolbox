import {HoistService, XH} from '@xh/hoist/core';
import {reject} from 'lodash';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {isString} from 'lodash';

/**
 * Service to manage fetching, updating and persisting tasks.
 * Tasks are persisted for each user using the Hoist preference system.
 */
export class TodoService extends HoistService {

    /** @returns {Promise<TaskItem[]>} */
    async getTasksAsync() {
        return XH.getPref('todoApp').map(it => {
            const dueDate = isString(it.dueDate) ? LocalDate.get(it.dueDate) : null;
            let dueDateGroup;

            if (!dueDate) {
                dueDateGroup = 'Upcoming';
            } else if (dueDate.isToday) {
                dueDateGroup = 'Today';
            } else if (dueDate < LocalDate.today()) {
                dueDateGroup = 'Past';
            } else {
                dueDateGroup = 'Upcoming';
            }

            return {...it, dueDate, dueDateGroup};
        });
    }

    /**
     * @param {TaskItem} task
     * @returns {Promise<void>}
     */
    async addTaskAsync(task) {
        let tasks = await this.getTasksAsync();
        tasks = [...tasks, task];
        this.saveToPreference(tasks);
    }

    /**
     * @param {TaskItem} task
     * @returns {Promise<void>}
     */
    async editTaskAsync(task) {
        const {id} = task;
        let tasks = await this.getTasksAsync();
        tasks = reject(tasks, {id});
        tasks = [...tasks, task];
        this.saveToPreference(tasks);
    }

    /**
     * @param {TaskItem} task
     * @returns {Promise<void>}
     */
    async removeTasksAsync(task) {
        const {id} = task;
        let tasks = await this.getTasksAsync();
        tasks = reject(tasks, {id});
        this.saveToPreference(tasks);
    }

    saveToPreference(tasks) {
        XH.setPref('todoApp', tasks.map(it => {
            return {
                id: it.id,
                description: it.description,
                complete: it.complete,
                dueDate: it.dueDate?.toString(),
                completeTimestamp: it.completeTimestamp
            };
        }));
    }
}

/**
 * @typedef {Object} TaskItem
 * @property {number} id
 * @property {string} description
 * @property {boolean} complete
 * @property {LocalDate} dueDate
 * @property {string} dueDateGroup
 * @property {LocalDate} completeTimestamp
 */
