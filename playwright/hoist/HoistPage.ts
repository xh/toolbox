import {ConsoleMessage, expect, Locator, Page, Route} from '@playwright/test';
import {XHApi} from '@xh/hoist/core/XH';
import {GridHelper} from './GridHelper';
import {FilterSelectQuery} from './Types';
import {isString} from 'lodash';

interface HoistPageCfg {
    baseUrl: string;
    page: Page;
}
type Predicate = TestId | {text: string};
type TestId = string;

/**
 * Base fixture for testing Hoist applications.
 */

export class HoistPage {
    readonly page: Page;
    private readonly baseUrl: string;

    constructor({baseUrl, page}: HoistPageCfg) {
        this.baseUrl = baseUrl;
        this.page = page;
    }

    // -------------------------------
    // Lifecycle
    // -------------------------------

    async initAsync(): Promise<void> {
        await this.authAsync();

        this.page.on('console', msg => {
            if (msg.type() === 'error') this.onConsoleError(msg);
        });

        await this.waitForAppToBeRunning();
    }

    onConsoleError(msg: ConsoleMessage): void {
        throw new Error(msg.text());
    }

    // -------------------------------
    // Lookups
    // -------------------------------

    get(q: Predicate): Locator {
        return isString(q) ? this.page.getByTestId(q) : this.page.getByText(q.text);
    }

    async getInputAsync(q: Predicate): Promise<Locator> {
        const elem = this.get(q),
            possibleInputs = [
                elem.locator('input'),
                elem.getByRole('textbox'),
                elem.locator('textarea'),
                this.page.locator('label', {has: elem})
            ];

        for (let input of possibleInputs) {
            if (await input.isVisible()) return input;
        }
        return elem;
    }

    getMask(): Locator {
        return this.page.locator('.xh-mask');
    }

    // todo - understand this
    async getRoutesAsync(): Promise<Route[]> {
        return this.page.evaluate(() => {
            window.XH.appModel.getRoutes();
        });
    }

    // -------------------------------
    // Actions
    // -------------------------------

    async clickAsync(q: Predicate): Promise<void> {
        return this.get(q).click();
    }

    async fillAsync(q: Predicate, value: string): Promise<void> {
        const input = await this.getInputAsync(q);
        return input.fill(value);
    }

    async clearAsync(q: Predicate): Promise<void> {
        const input = await this.getInputAsync(q);
        return input.clear();
    }

    // todo - cleanup
    async selectAsync(testId: string, selectionText: string): Promise<void> {
        await this.page.getByTestId(testId).locator('svg').click();
        await this.get(`${testId}-menu`).getByText(selectionText).click();
    }

    // todo - cleanup
    async filterThenClickSelectOptionAsync({
        testId,
        filterText,
        selectionText,
        asyncOptionUrl
    }: FilterSelectQuery) {
        await this.fillAsync(testId, filterText);
        const menu = this.get(`${testId}-menu`);
        if (asyncOptionUrl) this.page.waitForResponse(resp => resp.url().includes(asyncOptionUrl));
        selectionText
            ? await menu.getByText(selectionText).click()
            : await menu.locator('.xh-select__option').first().click();
    }

    // Checkboxes switches and radio inputs
    // Looks for and toggles the label that has the input that matches the given testId
    async toggleAsync(q: Predicate): Promise<void> {
        return (await this.getInputAsync(q)).click();
    }

    async checkAsync(q: Predicate): Promise<void> {
        return (await this.getInputAsync(q)).check();
    }

    async uncheckAsync(q: Predicate): Promise<void> {
        return (await this.getInputAsync(q)).uncheck();
    }

    async toggleThemeAsync(): Promise<void> {
        return this.page.evaluate(() => {
            window.XH.toggleTheme();
        });
    }

    // -------------------------------
    // Assertions
    // -------------------------------

    async expectTextAsync(q: Predicate, text: string): Promise<void> {
        await expect(this.get(q)).toHaveText(text);
    }

    async expectVisibleAsync(q: Predicate): Promise<void> {
        await expect(this.get(q)).toBeVisible({timeout: 10000});
    }

    // -------------------------------
    // Utils
    // -------------------------------

    async waitForAppToBeRunning(): Promise<void> {
        const runHandle = async () => {
            return this.page.evaluate(() => {
                return window.XH.appIsRunning;
            });
        };

        await expect.poll(runHandle).toBeTruthy();
    }

    async waitForMaskToClear(): Promise<void> {
        await expect(this.getMask()).toHaveCount(0, {timeout: 10000});
    }

    // -------------------------------
    // Helper Factories
    // -------------------------------

    // todo
    // createFormHelper(testId: string): FormHelper {
    //     return new FormHelper(this, testId);
    // }

    createGridHelper(testId: string): GridHelper {
        return new GridHelper(this, testId);
    }

    // -------------------------------
    // Implementation
    // -------------------------------

    protected async authAsync() {}
}

declare global {
    interface Window {
        XH: XHApi;
    }
}
