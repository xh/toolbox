import {HoistPage} from '../hoist/HoistPage';
import {ConsoleMessage, test as baseTest} from '@playwright/test';
import {AppModel} from '../../client-app/src/desktop/AppModel';
import {PlainObject} from '@xh/hoist/core';
import {doAuthZeroLogin} from './utils';

export class TBoxPage extends HoistPage {
    override async authAsync() {
        await doAuthZeroLogin(this.page, 'app');
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

export const test = baseTest.extend<{tb: TBoxPage}>({
    tb: async ({page, baseURL}, use) => {
        const tbPage = new TBoxPage({page, baseURL});
        await tbPage.initAsync();
        await use(tbPage);
    }
});
