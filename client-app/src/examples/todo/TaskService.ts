import {HoistService, XH} from '@xh/hoist/core';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {differenceBy} from 'lodash';

/** Bucket a task falls into based on its completion state and due date. */
export type DueDateGroup = 'Overdue' | 'Today' | 'Upcoming' | 'Complete';

/** A single to-do task, optionally due-dated and grouped by due date. */
export interface Task {
    id: number;
    description?: string;
    complete?: boolean;
    dueDate?: LocalDate;
    dueDateGroup?: DueDateGroup;
}

/**
 * Raw, persisted form of a `Task` as stored in prefs: the due date is serialized to an ISO string
 * and the derived `dueDateGroup` is not stored. Re-hydrated into a `Task` by `getAsync`.
 */
interface StoredTask extends Omit<Task, 'dueDate' | 'dueDateGroup'> {
    dueDate?: string;
}

/**
 * Service to manage fetching, updating and persisting tasks.
 * Tasks are persisted for each user using the Hoist preference system.
 */
export class TaskService extends HoistService {
    static instance: TaskService;

    async getAsync(): Promise<Task[]> {
        // `getPref` is typed `any` - the framework can't know the persisted shape, so we assert
        // the stored array as `StoredTask[]` while re-hydrating each entry into a typed `Task`.
        const stored = XH.getPref('todoTasks') as StoredTask[];
        return stored.map(it => {
            const dueDate = it.dueDate ? LocalDate.get(it.dueDate) : undefined,
                complete = it.complete;

            let dueDateGroup: DueDateGroup;
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
    private saveToPreference(tasks: Task[]) {
        XH.setPref(
            'todoTasks',
            tasks.map(it => ({...it, dueDate: it.dueDate?.toString()}))
        );
    }
}
