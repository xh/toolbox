import {ConsoleMessage, Page, expect} from '@playwright/test';
import {AppModel} from '../../client-app/src/desktop/AppModel';
import {XHApi} from '@xh/hoist/core/XH';
import {logIn} from '../Utils';
import {
    checkCheckBoxByTestid,
    clearByTestId,
    clickByTestId,
    clickSelectOption,
    expectTestIdText,
    fillByTestId,
    fillJsonInputByTestId,
    get,
    toggleCheckboxByTestId,
    uncheckCheckBoxByTestid
} from './HoistUtils';

export class HoistPage {
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
            if (msg.type() === 'error') this.onConsoleError(msg);
        });

        await this.authAsync();
        await this.waitForAppToBeRunning();
    }

    onConsoleError(msg: ConsoleMessage) {
        throw new Error(msg.text());
    }

    async getRoutes() {
        return this.page.evaluate(() => {
            const appModel: AppModel = window.XH.appModel;
            return appModel.getRoutes();
        });
    }

    async toggleTheme() {
        return this.page.evaluate(() => {
            window.XH.toggleTheme();
        });
    }

    async waitForMaskToClear() {
        await expect(this.maskLocator).toHaveCount(0, {timeout: 10000});
    }

    logIn = async () => logIn(this.page);
    getByTestId = (testId: string) => get(this.page, testId);
    click = async (testId: string) => clickByTestId(this.page, testId);
    clear = async (testId: string) => clearByTestId(this.page, testId);
    fill = async (testId: string, text: string) => fillByTestId(this.page, testId, text);
    expectText = async (testId: string, text: string) => expectTestIdText(this.page, testId, text);
    check = async (testId: string) => checkCheckBoxByTestid(this.page, testId);
    uncheck = async (testId: string) => uncheckCheckBoxByTestid(this.page, testId);
    toggle = async (testId: string) => toggleCheckboxByTestId(this.page, testId);
    fillJson = async (testId: string, text: string) =>
        fillJsonInputByTestId(this.page, testId, text);
    select = async (testId: string, selectionText: string) =>
        clickSelectOption(this.page, testId, selectionText);

    protected async authAsync() {}

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
