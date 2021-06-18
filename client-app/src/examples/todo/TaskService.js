import {HoistService, XH} from '@xh/hoist/core';
import {differenceBy} from 'lodash';
import {LocalDate} from '@xh/hoist/utils/datetime';

/**
 * Service to manage fetching, updating and persisting tasks.
 * Tasks are persisted for each user using the Hoist preference system.
 */
export class TaskService extends HoistService {

    /** @returns {Promise<Task[]>} */
    async getAsync() {
        return XH.getPref('todoTasks').map(it => {
            const dueDate = LocalDate.get(it.dueDate),
                complete = it.complete;
            
            let dueDateGroup;
            if (complete) {
                dueDateGroup = 'Complete';
            } else if (!dueDate) {
                dueDateGroup = 'Upcoming';
            } else if (dueDate.isToday) {
                dueDateGroup = 'Today';
            } else if (dueDate < LocalDate.today()) {
                dueDateGroup = 'Overdue';
            } else {
                dueDateGroup = 'Upcoming';
            }

            return {...it, dueDate, dueDateGroup};
        });
    }

    /**
     * @param {Task} task
     */
    async addAsync(task) {
        let curr = await this.getAsync(),
            updated = [...curr, task];
        this.saveToPreference(updated);
    }

    /**
     * @param {Task[]} tasks
     */
    async editAsync(tasks) {
        let curr = await this.getAsync(),
            updated = differenceBy(curr, tasks, 'id');
        updated = [...updated, ...tasks];
        this.saveToPreference(updated);
    }

    /**
     * @param {Task[]} tasks
     */
    async deleteAsync(tasks) {
        let curr = await this.getAsync(),
            updated = differenceBy(curr, tasks, 'id');
        this.saveToPreference(updated);
    }

    /**
     * @param {Task[]} tasks
     */
    async toggleCompleteAsync(tasks) {
        tasks = tasks.map(task => ({...task, complete: !task.complete}));
        return this.editAsync(tasks);
    }

    //------------------
    // Implementation
    //------------------
    saveToPreference(tasks) {
        XH.setPref('todoTasks',
            tasks.map(it => ({...it, dueDate: it.dueDate?.toString()}))
        );
    }
}

/**
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} description
 * @property {boolean} complete
 * @property {LocalDate} dueDate
 * @property {string} dueDateGroup
 */
