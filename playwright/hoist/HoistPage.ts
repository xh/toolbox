import {ConsoleMessage, expect, Locator, Page} from '@playwright/test';
import {XHApi} from '@xh/hoist/core/XH';
import {GridHelper} from './GridHelper';
import {FilterSelectQuery} from './Types';
import {isString} from 'lodash';
import {Route} from 'router5';

interface HoistPageCfg {
    baseURL: string;
    page: Page;
}
type Predicate = TestId | {text: string};
type TestId = string;

/**
 * Base fixture for testing Hoist applications.
 */

export class HoistPage {
    readonly page: Page;
    private readonly baseURL: string;

    constructor({baseURL, page}: HoistPageCfg) {
        this.baseURL = baseURL;
        this.page = page;
    }

    // -------------------------------
    // Lifecycle
    // -------------------------------
    async initAsync(): Promise<void> {
        this.page.on('console', msg => {
            if (msg.type() === 'error') this.onConsoleError(msg);
        });

        await this.page.goto(this.baseURL);
        await this.waitForAppToBeRunning();
    }

    onConsoleError(msg: ConsoleMessage): void {
        throw new Error(msg.text());
    }

    // -------------------------------
    // Locators
    // -------------------------------

    get(q: Predicate): Locator {
        return isString(q) ? this.page.getByTestId(q) : this.page.getByText(q.text);
    }

    getMask(): Locator {
        return this.page.locator('.xh-mask');
    }

    async getInput(q: Predicate): Promise<Locator> {
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

    // -------------------------------
    // Actions
    // -------------------------------

    async click(q: Predicate): Promise<void> {
        return this.get(q).click();
    }

    async fill(q: Predicate, value: string): Promise<void> {
        const input = await this.getInput(q);
        return input.fill(value);
    }

    async clear(q: Predicate): Promise<void> {
        const input = await this.getInput(q);
        return input.clear();
    }

    // todo - cleanup
    async select(testId: string, selectionText: string): Promise<void> {
        await this.page.getByTestId(testId).locator('svg').click();
        await this.get(`${testId}-menu`).getByText(selectionText).click();
    }

    // todo - cleanup
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
    async toggle(q: Predicate): Promise<void> {
        return (await this.getInput(q)).click();
    }

    async check(q: Predicate): Promise<void> {
        return (await this.getInput(q)).check();
    }

    async uncheck(q: Predicate): Promise<void> {
        return (await this.getInput(q)).uncheck();
    }

    // -------------------------------
    // Assertions
    // -------------------------------

    async expectText(q: Predicate, text: string): Promise<void> {
        await expect(this.get(q)).toHaveText(text);
    }

    async expectVisible(q: Predicate, {timeout = 1000, visible = true} = {}): Promise<void> {
        await expect(this.get(q)).toBeVisible({timeout, visible});
    }

    // -------------------------------
    // Utils
    // -------------------------------

    async waitForMaskToClear(): Promise<void> {
        await expect(this.getMask()).toHaveCount(0, {timeout: 10000});
    }

    async toggleTheme(): Promise<void> {
        return this.page.evaluate(() => {
            window.XH.toggleTheme();
        });
    }

    async getRoutes(): Promise<Route[]> {
        return this.page.evaluate(() => window.XH.appModel.getRoutes());
    }

    createGridHelper(testId: string): GridHelper {
        return new GridHelper(this, testId);
    }

    // -------------------------------
    // Implementation
    // -------------------------------

    private async waitForAppToBeRunning(): Promise<void> {
        const runHandle = async () => {
            return this.page.evaluate(() => {
                return window.XH.appIsRunning;
            });
        };

        await expect.poll(runHandle).toBeTruthy();
    }
}

declare global {
    interface Window {
        XH: XHApi;
    }
}
