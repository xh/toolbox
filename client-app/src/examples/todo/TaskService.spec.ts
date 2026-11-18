import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync, TestAppModel} from '@xh/hoist/test-support';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {TaskService} from './TaskService';

class TodoTestModel extends TestAppModel {
    override async initAsync(ctx: InitContext) {
        await XH.installServicesAsync(TaskService, ctx);
    }
}

// Freeze "today" at Mar 15. Keep time advancing, so debounced pref writes still run.
const setClock = () =>
    vi.useFakeTimers({
        toFake: ['Date'],
        now: new Date('2026-03-15T12:00:00'),
        shouldAdvanceTime: true
    });

// Tasks as the todoTasks pref stores them, with ISO due dates.
const savedTasks = [
    {id: 1, description: 'Past due', complete: false, dueDate: '2026-03-14'},
    {id: 2, description: 'Due today', complete: false, dueDate: '2026-03-15'},
    {id: 3, description: 'Due later', complete: false, dueDate: '2026-03-16'},
    {id: 4, description: 'No due date', complete: false},
    {id: 5, description: 'Done, but past due', complete: true, dueDate: '2026-03-01'}
];

beforeAll(async () => {
    setClock();
    hoistCore.prefs.todoTasks.value = savedTasks;
    await initTestAppAsync({modelClass: TodoTestModel});
});

beforeEach(() => {
    setClock();
    XH.setPref('todoTasks', savedTasks);
});

const svc = () => XH.taskService;

// The pref value as last saved to the server.
async function savedPrefAsync() {
    await XH.prefService.pushPendingAsync();
    return hoistCore.prefs.todoTasks;
}

describe('getAsync', () => {
    it('groups tasks by due date, with complete tasks always Complete', async () => {
        const groups = Object.fromEntries(
            (await svc().getAsync()).map(t => [t.id, t.dueDateGroup])
        );
        expect(groups).toEqual({
            1: 'Overdue',
            2: 'Today',
            3: 'Upcoming',
            4: 'Upcoming',
            5: 'Complete'
        });
    });

    it('parses due dates into LocalDates', async () => {
        const [first] = await svc().getAsync();
        expect(first.dueDate).toBeInstanceOf(LocalDate);
        expect(first.dueDate.isoString).toBe('2026-03-14');
    });
});

describe('saving', () => {
    it('adds a task, storing its due date as an ISO string', async () => {
        await svc().addAsync({id: 6, description: 'New', dueDate: LocalDate.get('2026-04-01')});

        const saved = (await savedPrefAsync()).value;
        expect(saved).toHaveLength(6);
        expect(saved.at(-1)).toMatchObject({id: 6, dueDate: '2026-04-01'});
    });

    it('toggles completion on the given tasks only', async () => {
        const [overdue] = await svc().getAsync();
        await svc().toggleCompleteAsync([overdue]);

        const saved = (await savedPrefAsync()).value;
        expect(saved.find(t => t.id === 1).complete).toBe(true);
        expect(saved.filter(t => t.complete).map(t => t.id)).toEqual([5, 1]);
    });

    it('deletes tasks by id', async () => {
        const tasks = await svc().getAsync();
        await svc().deleteAsync(tasks.filter(t => t.id < 3));

        expect((await savedPrefAsync()).value.map(t => t.id)).toEqual([3, 4, 5]);
    });

    it('resets to the default tasks by unsetting the pref', async () => {
        await svc().resetToDefaultTasksAsync();

        const pref = await savedPrefAsync();
        expect(hoistCore.requestsTo('xh/unsetPrefs')[0].json).toEqual(['todoTasks']);
        expect(pref.value).toBeUndefined();
        expect(XH.getPref('todoTasks')).toEqual(pref.defaultValue);
    });
});
