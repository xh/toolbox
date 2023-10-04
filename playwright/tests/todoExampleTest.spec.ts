import {test} from '../fixtures/todo';

test('Test app load & grid reset', async ({page, todo}) => {
    await todo.grid.ensureCount(2);
});

test('Test show completed', async ({page, todo}) => {
    await todo.grid.ensureCount(2);
    await todo.check('show-completed-switch');
    await todo.grid.ensureCount(3);
});

test('Test mark task complete', async ({page, todo}) => {
    await todo.grid.ensureCount(2);
    await todo.click('toggle-complete-action-1'); // Mark task with record id of 1 as completed
    await todo.grid.ensureCount(1);
    await todo.check('show-completed-switch');
    await todo.grid.ensureCount(3);
});

test('Test task add/edit/update/delete', async ({page, todo}) => {
    // add new task
    await todo.click('add-button');
    await todo.fill('task-dialog-description', 'This is a new task');
    await todo.click('save-task-button');

    // check task is added
    await todo.grid.ensureCount(3);

    // edit the task
    await todo.grid.dblClickRow({recordData: {description: 'This is a new task'}}); // check to see if double click opened edit dialog
    await todo.expectText('task-dialog-description-input', 'This is a new task');
    await todo.click('cancel-task-edit-button');

    await todo.grid.selectRow({recordData: {description: 'This is a new task'}}); // select grid and check edit button will open edit dialog
    await todo.click('edit-button');
    await todo.expectText('task-dialog-description-input', 'This is a new task');

    // update description
    await todo.fill('task-dialog-description', 'Updated task description');
    await todo.click('save-task-button');

    // check task is updated
    await todo.grid.dblClickRow({
        recordData: {complete: false, description: 'Updated task description'}
    });
    await todo.expectText('task-dialog-description-input', 'Updated task description');
    await todo.click('cancel-task-edit-button');

    await todo.click('remove-button');
    await todo.expectVisible({
        text: "Are you sure you want to permanently remove 'Updated task description?'"
    });
    await todo.click('confirm-delete-button');
    await todo.grid.ensureCount(2);
    await todo.check('show-completed-switch');
    await todo.grid.ensureCount(3);
});

test('Test all task can be completed and placeholder message', async ({page, todo}) => {
    await todo.click('toggle-complete-action-1'); // Mark task with record id of 1 as completed
    const signUpRecordId = await todo.grid.getRecordId({
        recordData: {description: 'Sign-up for stress management workshop'}
    });
    await todo.click(`toggle-complete-action-${signUpRecordId}`);

    await todo.grid.ensureCount(0);
    await todo.expectVisible({text: 'Congratulations. You did it! All of it!'});
});
