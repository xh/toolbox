import {HoistService, XH} from '@xh/hoist/core';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {differenceBy} from 'lodash';

/**
 * Service to manage fetching, updating and persisting tasks.
 * Tasks are persisted for each user using the Hoist preference system.
 */
export class TaskService extends HoistService {
    static instance: TaskService;

    async getAsync(): Promise<Task[]> {
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

    async addAsync(task: Task) {
        let curr = await this.getAsync(),
            updated = [...curr, task];
        this.saveToPreference(updated);
    }

    async editAsync(tasks: Task[]) {
        let curr = await this.getAsync(),
            updated = differenceBy(curr, tasks, 'id');
        updated = [...updated, ...tasks];
        this.saveToPreference(updated);
    }

    async deleteAsync(tasks: Task[]) {
        let curr = await this.getAsync(),
            updated = differenceBy(curr, tasks, 'id');
        this.saveToPreference(updated);
    }

    async toggleCompleteAsync(tasks: Task[]) {
        tasks = tasks.map(task => ({...task, complete: !task.complete}));
        return this.editAsync(tasks);
    }

    async resetToDefaultTasksAsync() {
        XH.prefService.unset('todoTasks');
    }

    //------------------
    // Implementation
    //------------------
    private saveToPreference(tasks) {
        XH.setPref(
            'todoTasks',
            tasks.map(it => ({...it, dueDate: it.dueDate?.toString()}))
        );
    }
}

interface Task {
    id: number;
    description?: string;
    complete?: boolean;
    dueDate?: LocalDate;
    dueDateGroup?: string;
}
