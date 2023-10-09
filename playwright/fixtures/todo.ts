import {HoistPage} from '../hoist/HoistPage';
import {GridHelper} from '../hoist/GridHelper';
import {test as baseTest} from '@playwright/test';
import {TBoxPage} from "./toolbox";

export class TodoPage extends HoistPage {
    override async initAsync() {
        await super.initAsync();
        await this.click('reset-button');
    }

    get grid(): GridHelper {
        return this.createGridHelper('todo-grid');
    }
}

export const test = baseTest.extend<{todo: TodoPage,roAdmin: TodoPage,standardUser: TodoPage,}>({
    todo: async ({ baseURL, browser}, use) => {
        const context = await browser.newContext({storageState: './.auth/admin.json'})
        const todoPage = new TodoPage({page: await context.newPage(), baseURL: `${baseURL}/todo`});
        await todoPage.initAsync();
        await use(todoPage);
        await context.close();
    }
});