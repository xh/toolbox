import {HoistPage} from '../hoist/HoistPage';
import {GridHelper} from '../hoist/GridHelper';
import {test as baseTest} from '@playwright/test';
import {doAuthZeroLogin} from './utils';

export class TodoPage extends HoistPage {
    override async authAsync() {
        await doAuthZeroLogin(this.page, 'todo');
    }

    override async initAsync() {
        await super.initAsync();
        await this.clickAsync('reset-button');
    }

    get grid(): GridHelper {
        return this.createGridHelper('todo-grid');
    }
}

export const test = baseTest.extend<{todo: TodoPage}>({
    todo: async ({page, baseURL}, use) => {
        const todoPage = new TodoPage({page, baseURL});
        await todoPage.initAsync();
        await use(todoPage);
    }
});
