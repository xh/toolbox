import {todoTest} from '../Toolbox';

todoTest('Test app load & grid reset', async ({page, tb}) => {
    const grid = tb.createGridHelper('todo-grid')
    await grid.ensureCount(2)
});

todoTest('Test show completed', async ({page, tb}) => {
    const grid = tb.createGridHelper('todo-grid')

    await grid.ensureCount(2)
    await tb.check('show-completed-switch')
    await grid.ensureCount(3)
});

todoTest('Test mark task complete', async ({page, tb}) => {
    const grid = tb.createGridHelper('todo-grid')
    
    await grid.ensureCount(2)
    await tb.click('toggle-complete-action-1') // Mark task with record id of 1 as completed
    await tb.expectTextVisible('Update JS dependencies for the legacy webapp')
    await grid.ensureCount(1)
    await tb.check('show-completed-switch')
    await grid.ensureCount(3)
    
});

todoTest('Test task add/edit/update/delete', async ({page, tb}) => {
    const grid = tb.createGridHelper('todo-grid')
    
    // add new task
    await tb.click('add-button')
    await tb.fill('task-dialog-description','This is a new task')
    await tb.click('save-task-button') 
    
    // check task is added
    await grid.ensureCount(3)
    
    // edit the task
    await grid.dblClickRow({recordData:{description: 'This is a new task'}}) // check to see if double click opend edit dialog
    await tb.expectText('task-dialog-description-input', 'This is a new task')
    await tb.click('cancel-task-edit-button')
    
    await grid.selectRow({recordData:{description: 'This is a new task'}}) // select grid and check edit buton will open edit dialog
    await tb.click('edit-button')
    await tb.expectText('task-dialog-description-input', 'This is a new task')
    
    // update discription
    await tb.fill('task-dialog-description', 'Updated task description')
    await tb.click('save-task-button')
    
    // check task is updated
    await grid.dblClickRow({recordData: {complete: false, description: 'Updated task description'}})
    await tb.expectText('task-dialog-description-input', 'Updated task description')
    await tb.click('cancel-task-edit-button')
    
    await tb.click('remove-button')
    await tb.expectTextVisible(`Are you sure you want to permanently remove 'Updated task description?'`)
    await tb.click('confirm-delete-button')
    await grid.ensureCount(2)
    await tb.check('show-completed-switch')
    await grid.ensureCount(3)
});

todoTest('Test all task can be completed and placeholder message', async ({page, tb}) => {
    const grid = tb.createGridHelper('todo-grid')
    
    await tb.click('toggle-complete-action-1') // Mark task with record id of 1 as completed
    const signUpRecordId = await grid.getRowId({recordData: {description: 'Sign-up for stress management workshop'}})
    await tb.click(`toggle-complete-action-${signUpRecordId}`)
    
    await grid.ensureCount(0)
    await tb.expectTextVisible('Congratulations. You did it! All of it!')
});


