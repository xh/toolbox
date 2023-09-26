import {ConsoleMessage, expect, Page} from '@playwright/test';
import {AppModel} from '../../client-app/src/desktop/AppModel';
import {XHApi} from '@xh/hoist/core/XH';
import {StoreRecordId} from '@xh/hoist/data/StoreRecord';
import {PlainObject} from '@xh/hoist/core';
import { GridHelper } from './GridHelper';

export interface FilterSelectQuery {
    testId: string;
    filterText: string;
    selectionText?: string;
    asyncOptionUrl?: string;
}

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

    createGridHelper(testId: string): GridHelper{
        return new GridHelper(this, testId)
    }

    get(testId: string) {
        return this.page.getByTestId(testId);
    }

    getByText(text: string) {
        return this.page.getByText(text)
    }

    async click(testId: string) {
        await this.get(testId).click();
    }

    async fill(testId: string, value: string) {
        const elem = this.get(testId);
        if (await elem.locator('input').isVisible()) return elem.locator('input').fill(value);
        if (await elem.getByRole('textbox').isVisible())
            return elem.getByRole('textbox').fill(value);
        if (await elem.locator('textarea').isVisible()) return elem.locator('textarea').fill(value);

        return elem.fill(value);
    }

    async clear(testId: string) {
        const elem = this.get(testId);
        if (await elem.locator('input').isVisible()) return elem.locator('input').clear();
        if (await elem.locator('textarea').isVisible())
            return await elem.locator('textarea').clear();
        if (await elem.locator(testId).getByRole('textbox').isVisible())
            return elem.getByRole('textbox').clear();
        await elem.clear();
    }

    async select(testId: string, selectionText: string) {
        await this.page.getByTestId(testId).locator('svg').click();
        await this.get(`${testId}-menu`).getByText(selectionText).click();
    }

    async filterThenClickSelectOption({
        testId,
        filterText,
        selectionText,
        asyncOptionUrl
    }: FilterSelectQuery) {
        await this.fill(testId, filterText);
        const menu = this.get(`${testId}-menu`);
        if (asyncOptionUrl) this.page.waitForResponse(resp => resp.url().includes(asyncOptionUrl));
        selectionText
            ? await menu.getByText(selectionText).click()
            : await menu.locator('.xh-select__option').first().click();
    }

    // Checkboxes switches and radio inputs
    // Looks for and toggles the label that has the input that matches the given testId
    async toggle(testId: string) {
        await this.page.locator('label', {has: this.page.getByTestId(testId)}).click();
    }

    async check(testId: string) {
        await this.page.locator('label', {has: this.page.getByTestId(testId)}).check();
    }

    async uncheck(testId: string) {
        await this.page.locator('label', {has: this.page.getByTestId(testId)}).uncheck();
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

    //Expect
    async expectText(testId: string, text: string) {
        await expect(this.get(testId)).toHaveText(text);
    }

    async expectTextVisible(text: string) {
        await expect(this.getByText(text)).toBeVisible({timeout: 10000})
    }


    //------------------------
    // Implementation
    //------------------------

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
