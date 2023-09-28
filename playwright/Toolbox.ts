import {ConsoleMessage, expect, test as baseTest} from '@playwright/test';
import {AppModel} from '../client-app/src/desktop/AppModel';
import {PlainObject} from '@xh/hoist/core';
import {HoistPage} from './hoist/HoistPage';
import {GridHelper} from './hoist/GridHelper';

export class TBoxPage extends HoistPage {
    override async authAsync() {
        const {page, baseURL} = this,
            {USERNAME, PASSWORD} = process.env;
        if (!USERNAME || !PASSWORD) throw new Error('USERNAME or PASSWORD missing from .env.');

        await page.goto(`${baseURL}/app`);
        await page.getByLabel('Email address').fill(USERNAME);
        await page.getByLabel('Password').fill(PASSWORD);
        await page.getByRole('button', {name: 'Continue', exact: true}).click();
        await this.waitForMaskToClear();
        await expect(async () => {
            await expect(page).toHaveURL(`${baseURL}/home`);
        }).toPass();
    }

    override onConsoleError(msg: ConsoleMessage): void {
        if (
            msg.location().url?.endsWith('xh/getTimeZoneOffset') ||
            msg.text() === 'Unknown timeZoneId Error: Unknown timeZoneId'
        )
            return;

        super.onConsoleError(msg);
    }

    async getActiveTopLevelTabId() {
        return this.page.evaluate(() => {
            const appModel: AppModel = window.XH.appModel;
            return appModel.tabModel.activeTabId;
        });
    }

    async getTabHierarchy(): Promise<PlainObject[]> {
        const routes = await this.getRoutes();
        return routes[0].children.map(route => {
            return {
                id: route.name,
                children: route.children?.map(it => ({id: it.name})) ?? []
            };
        });
    }

    async switchToTopLevelTab(tabId: string, {waitForMaskToClear = true} = {}) {
        await this.page.getByTestId(`toplevel-tab-switcher-${tabId}`).click();
        if (waitForMaskToClear) await this.waitForMaskToClear();
    }

    async switchToChildTab(tabId: string, {waitForMaskToClear = true} = {}) {
        const topLevelTabId = await this.getActiveTopLevelTabId();
        await this.page.getByTestId(`${topLevelTabId}-tab-switcher-${tabId}`).click();
        if (waitForMaskToClear) await this.waitForMaskToClear();
    }
}

export class TodoPage extends HoistPage {
    override async authAsync() {
        const {page, baseURL} = this,
            {USERNAME, PASSWORD} = process.env;
        if (!USERNAME || !PASSWORD) throw new Error('USERNAME or PASSWORD missing from .env.');

        await page.goto(`${baseURL}/todo`);
        await page.getByLabel('Email address').fill(USERNAME);
        await page.getByLabel('Password').fill(PASSWORD);
        await page.getByRole('button', {name: 'Continue', exact: true}).click();
        await this.waitForMaskToClear();
        await expect(async () => {
            await expect(page).toHaveURL(`${baseURL}/home`);
        }).toPass();
    }
    override async init() {
        this.page.on('console', msg => {
            if (msg.type() === 'error') this.onConsoleError(msg);
        });

        await this.authAsync();
        await this.waitForAppToBeRunning();
        await this.click('reset-button');
    }

    get grid(): GridHelper {
        return this.createGridHelper('todo-grid');
    }
}

type TBoxFixtures = {
    tb: TBoxPage;
};
type TodoFixtures = {
    todo: TodoPage;
};

export const test = baseTest.extend<TBoxFixtures>({
    tb: async ({page, baseURL}, use) => {
        const tbPage = new TBoxPage({page, baseURL});
        await tbPage.init();
        await use(tbPage);
    }
});

export const todoTest = baseTest.extend<TodoFixtures>({
    todo: async ({page, baseURL}, use) => {
        const todoPage = new TodoPage({page, baseURL});
        await todoPage.init();
        await use(todoPage);
    }
});
