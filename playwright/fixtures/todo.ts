import {HoistPage} from '../hoist/HoistPage';
import {GridHelper} from '../hoist/GridHelper';
import {test as baseTest} from '@playwright/test';

export class TodoPage extends HoistPage {
    override async initAsync() {
        await super.initAsync();
        await this.click('reset-button');
    }

    get grid(): GridHelper {
        return this.createGridHelper('todo-grid');
    }
}

export const test = baseTest.extend<{todo: TodoPage}>({
    todo: async ({ baseURL, browser}, use) => {
        const context = await browser.newContext({storageState: './.auth/user.json'})
        const todoPage = new TodoPage({page: await context.newPage(), baseURL: `${baseURL}/todo`});
        await todoPage.initAsync();
        await use(todoPage);
        await context.close();
    }
});