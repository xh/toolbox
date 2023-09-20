import {ConsoleMessage, expect, Page} from '@playwright/test';
import {AppModel} from '../../client-app/src/desktop/AppModel';
import {XHApi} from '@xh/hoist/core/XH';
import {StoreRecordId} from '@xh/hoist/data/StoreRecord';
import {XH} from '@xh/hoist/core';

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

    get(testId: string) {
        return this.page.getByTestId(testId);
    }

    async click(testId: string) {
        await this.get(testId).click();
    }

    async expectText(testId: string, text: string) {
        await expect(this.get(testId)).toHaveText(text);
    }

    async fill(testId: string, value: string) {
        const elem = this.get(testId);
        if (await elem.locator('input').isVisible()) return elem.locator('input').fill(value);
        if (await elem.locator('textarea').isVisible()) return elem.locator('textarea').fill(value);
        if (await elem.locator(testId).getByRole('textbox').isVisible())
            return elem.getByRole('textbox').fill(value);
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

    async clickSelectOption(testId: string, selectionText: string) {
        await this.page.getByTestId(testId).locator('svg').click();
        await this.get(`${testId}-menu`).getByText(selectionText).click();
    }

    async filterThenClickSelectOption(
        page: Page,
        testid: string,
        filterText: string,
        selectionText?: string
    ) {
        //
    }

    // Checkboxes and radio inputs
    // Looks for and toggles the label that has the input that matches the given testId
    async toggleCheckbox(testId: string) {
        await this.page.locator('label', {has: this.page.getByTestId(testId)}).click();
    }

    async checkCheckBox(testId: string) {
        await this.page.locator('label', {has: this.page.getByTestId(testId)}).check();
    }

    async uncheckCheckBox(testId: string) {
        await this.page.locator('label', {has: this.page.getByTestId(testId)}).uncheck();
    }

    async getGridRowByRecordId(testId: string, id: StoreRecordId) {
        return this.page.evaluate(() =>
            XH.getActiveModelByTestId(testId).gridModel.store.getById(id)
        );
    }

    async getGridRowByCellContents(testId: string, spec: PlainObject) {
        return this.page.evaluate(() => {
            XH.getActiveModelByTestId(testId).gridModel.store.allRecords.find(({data}) =>
                _.isMatch(data, spec)
            );
        });
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
