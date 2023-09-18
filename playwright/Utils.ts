import {expect, Page, test as baseTest, Locator, ConsoleMessage} from '@playwright/test';
import {AppModel} from '../client-app/src/desktop/AppModel';
import {PageState, PlainObject, XHApi} from '@xh/hoist/core';
import { StoreRecordId } from '@xh/hoist/data';
import { HoistPage } from './hoist/HoistPage';



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

//------------------
// Toolbox Fixture
//------------------
export class TBoxPage extends HoistPage{

    onConsoleError(msg: ConsoleMessage): void {
            if (
                msg.location().url?.endsWith('xh/getTimeZoneOffset') ||
                msg.text() === 'Unknown timeZoneId Error: Unknown timeZoneId'
            )
                return;

            super.onConsoleError(msg)
        
    }

    async getActiveTopLevelTabId() {
        return this.page.evaluate(() => {
            const appModel: AppModel = window.XH.appModel;
            return appModel.tabModel.activeTabId;
        });
    }

    async getTabHierarchy(): Promise<PlainObject[]> {
            const routes = await this.getRoutes()
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

    override async authAsync() {
        const {page, baseURL} = this,
            {USERNAME, PASSWORD} = process.env;
        if (!USERNAME || !PASSWORD) throw new Error('USERNAME or PASSWORD missing from .env.');

        await page.goto(baseURL);
        await page.getByLabel('Email address').fill(USERNAME);
        await page.getByLabel('Password').fill(PASSWORD);
        await page.getByRole('button', {name: 'Continue', exact: true}).click();
        await this.waitForMaskToClear();
        await expect(async () => {
            await expect(page).toHaveURL(`${baseURL}/home`);
        }).toPass();
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
