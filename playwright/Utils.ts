import {expect, Page, test as baseTest} from '@playwright/test';
import {AppModel} from '../client-app/src/desktop/AppModel';
import {XHApi} from '@xh/hoist/core';

export async function fillByTestId(page: Page, testId: string, text: string) {
    const elem = getElementByTestId(page, testId);
    if (await elem.locator('input').isVisible()) return elem.locator('input').fill(text);
    if (await elem.locator('textarea').isVisible())
        return await elem.locator('textarea').fill(text);

    await elem.fill(text);
}

export async function clickByTestId(page: Page, testId: string) {
    await getElementByTestId(page, testId).click();
}

export async function expectTestIdText(page: Page, testId: string, text: string) {
    await expect(getElementByTestId(page, testId)).toHaveText(text);
}

export function getElementByTestId(page: Page, testId: string) {
    return page.getByTestId(testId);
}
export async function clearByTestId(page: Page, testId: string) {
    const elem = getElementByTestId(page, testId);
    if (await elem.locator('input').isVisible()) return elem.locator('input').clear();
    if (await elem.locator('textarea').isVisible()) return await elem.locator('textarea').clear();
    await elem.clear();
}

export async function logIn(page: Page) {
    const {USERNAME, PASSWORD} = process.env;
    if (!USERNAME || !PASSWORD) throw new Error('USERNAME or PASSWORD missing from .env.');

    await page.goto('http://localhost:3000/app');
    await page.getByLabel('Email address').fill(USERNAME);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', {name: 'Continue', exact: true}).click();
}

export function wait<T>(interval: number = 0): Promise<T> {
    return new Promise(resolve => setTimeout(resolve, interval)) as Promise<T>;
}

export class PageRunner {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    logIn = async () => logIn(this.page);
    getByTestId = (testId: string) => getElementByTestId(this.page, testId);
    click = async (testId: string) => clickByTestId(this.page, testId);
    clear = async (testId: string) => clearByTestId(this.page, testId);
    fill = async (testId: string, text: string) => fillByTestId(this.page, testId, text);
    expectText = async (testId: string, text: string) => expectTestIdText(this.page, testId, text);
}

//------------------
// Toolbox Fixture
//------------------
export class TBoxPage {
    readonly page: Page;
    readonly baseURL: string;

    get maskLocator() {
        return this.page.locator('.xh-mask');
    }

    constructor({page, baseURL}: {page: Page; baseURL: string}) {
        this.page = page;
        this.baseURL = baseURL;
    }

    async init() {
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                if (
                    msg.location().url?.endsWith('xh/getTimeZoneOffset') ||
                    msg.text() === 'Unknown timeZoneId Error: Unknown timeZoneId'
                )
                    return;

                throw new Error(msg.text());
            }
        });

        await this.login();
        await this.waitForAppToBeRunning();
    }

    async getActiveTopLevelTabId() {
        return this.page.evaluate(() => {
            const appModel: AppModel = window.XH.appModel;
            return appModel.tabModel.activeTabId;
        });
    }

    async getTabHierarchy() {
        return this.page.evaluate(() => {
            const appModel: AppModel = window.XH.appModel,
                routes = appModel.getRoutes();

            return routes[0].children.map(route => {
                return {
                    id: route.name,
                    children: route.children?.map(it => ({id: it.name})) ?? []
                };
            });
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

    async waitForMaskToClear() {
        await expect(this.maskLocator).toHaveCount(0, {timeout: 10000});
    }

    //------------------
    // Implementation
    //------------------
    private async login() {
        const {page, baseURL} = this,
            {USERNAME, PASSWORD} = process.env;
        if (!USERNAME || !PASSWORD) throw new Error('USERNAME or PASSWORD missing from .env.');

        await page.goto(baseURL);
        await page.getByLabel('Email address').fill(USERNAME);
        await page.getByLabel('Password').fill(PASSWORD);
        await page.getByRole('button', {name: 'Continue', exact: true}).click();
        await expect(page).toHaveURL(`${baseURL}/home`);
    }

    private async waitForAppToBeRunning() {
        const runHandle = async () => {
            return this.page.evaluate(() => {
                const XH: XHApi = window.XH;
                return XH.appIsRunning;
            });
        };

        await expect.poll(runHandle).toBeTruthy();
    }
}

type TBoxFixtures = {
    tb: TBoxPage;
};

export const test = baseTest.extend<TBoxFixtures>({
    tb: async ({page, baseURL}, use) => {
        const tbPage = new TBoxPage({page, baseURL});
        await tbPage.init();
        await use(tbPage);
    }
});

//------------------
// Implementation
//------------------
