import {HoistPage} from '../hoist/HoistPage';
import {ConsoleMessage, test as baseTest} from '@playwright/test';
import {AppModel} from '../../client-app/src/desktop/AppModel';
import {PlainObject} from '@xh/hoist/core';
import { GridHelper } from '../hoist/GridHelper';

export class TBoxPage extends HoistPage {
    override onConsoleError(msg: ConsoleMessage): void {
        if (
            msg.location().url?.endsWith('xh/getTimeZoneOffset') ||
            msg.location().url?.endsWith('xh/track') ||
            msg.text() === 'Unknown timeZoneId Error: Unknown timeZoneId'
        )
            return;

        super.onConsoleError(msg);
    }

    get configGrid(): GridHelper {
        return this.createGridHelper('config-grid');
    }

    async getActiveTopLevelTabId() {
        return this.page.evaluate(() => {
            // @ts-ignore
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

export const test = baseTest.extend<{tb: TBoxPage; admin: TBoxPage;}>({
    tb: async ({baseURL, browser}, use) => {
        const context = await browser.newContext({storageState: './.auth/roUser.json'});
        const tbPage = new TBoxPage({page: await context.newPage(), baseURL: `${baseURL}/app`});
        await tbPage.initAsync();
        await use(tbPage);
        await context.close();
    },
    admin: async ({baseURL, browser}, use) => {
        const context = await browser.newContext({storageState: './.auth/admin.json'});
        const tbPage = new TBoxPage({page: await context.newPage(), baseURL: `${baseURL}/app`});
        await tbPage.initAsync();
        await use(tbPage);
        await context.close();
    },
});
