import {ConsoleMessage, Expect, expect, Locator, Page} from '@playwright/test';
import {GridHelper} from './GridHelper';
import {FormHelper} from './FormHelper';
import {FilterSelectQuery} from './Types';
import {isString} from 'lodash';
import {Route} from 'router5';
import {wait} from './Utils';
import {AppState} from '@xh/hoist/core';

export interface HoistPageCfg {
    baseURL: string;
    page: Page;
}
export type Predicate = TestId | {text?: string; testId?: TestId};
export type TestId = string;

/**
 * Base fixture for testing Hoist applications.
 */
export class HoistPage {
    readonly page: Page;
    private readonly baseURL: string;

    constructor({baseURL, page}: HoistPageCfg) {
        this.page = page;
        this.baseURL = baseURL;
    }

    // -------------------------------
    // Lifecycle
    // -------------------------------
    async initAsync(): Promise<void> {
        this.page.on('console', msg => {
            if (msg.type() === 'error') this.onConsoleError(msg);
        });

        // Inject browser-side helpers available within all page.evaluate() calls.
        // These run in the browser context and have full access to the Hoist runtime.
        await this.page.addInitScript(() => {
            /**
             * Strict model lookup — returns the single active model matching `name`,
             * null if none found, or throws if multiple matches exist (indicating a
             * test isolation issue or leaked model).
             */
            (window as any).getModel = (name: string) => {
                const matches = (window as any).XH?.getModels(name) ?? [];
                if (matches.length > 1) {
                    throw new Error(
                        `getModel('${name}'): expected 0 or 1 match, found ${matches.length}`
                    );
                }
                return matches[0] ?? null;
            };
            /** Typed service lookup — shorthand for XH[serviceName] inside page.evaluate(). */
            (window as any).getSvc = (name: string) => (window as any).XH?.[name];
            /** Async delay for use inside page.evaluate() where Hoist's wait() is not importable. */
            (window as any).wait = (ms: number = 0) =>
                new Promise(resolve => setTimeout(resolve, ms));
        });

        await this.page.goto(this.baseURL);
        await this.waitForAppToBeRunning();
    }

    onConsoleError(msg: ConsoleMessage): void {
        if (this.errorIsFromExternalConcern(msg)) return;
        throw new Error(msg.text());
    }

    errorIsFromExternalConcern(msg: ConsoleMessage): boolean {
        const messageUrl = msg.location().url;
        const text = msg.text();

        // Allow errors that genuinely originate outside the app: blob/data-service URLs.
        if (messageUrl.includes('blob') || messageUrl.includes('data-services')) return true;

        // Browser-level "Failed to load resource" messages on backend XHR endpoints are noise
        // when the app has handled the failure gracefully (e.g. an unconfigured GitHub integration
        // returning 400). Allowlist these specifically:
        //   - The message must be Chrome's auto-generated "Failed to load resource" text.
        //   - The URL must match a backend API path (/api/ on the dev-server origin, or any
        //     URL on the backend port).
        // This still surfaces:
        //   - App-side console.error calls (no "Failed to load resource" prefix).
        //   - Failed JS chunk / asset loads (those URLs aren't /api/).
        const isResourceLoadFailure = text.startsWith('Failed to load resource:');
        const isBackendApi = /\/api\//.test(messageUrl) || /:8080\//.test(messageUrl);
        if (isResourceLoadFailure && isBackendApi) return true;

        return false;
    }

    // -------------------------------
    // Locators
    // -------------------------------

    get(q: Predicate): Locator {
        if (isString(q)) {
            q = {testId: q};
        }
        let rootLocator: Page | Locator = this.page;
        if (q.testId) {
            rootLocator = rootLocator.getByTestId(q.testId);
        }
        if (q.text) {
            rootLocator = rootLocator.getByText(q.text);
        }
        return rootLocator as Locator;
    }

    getMask(): Locator {
        return this.page.locator('.xh-mask');
    }

    async getInput(q: Predicate): Promise<Locator> {
        const elem = this.get(q),
            tagName = await elem.evaluate(el => el.tagName);
        if (tagName.toLowerCase() === 'input' || tagName.toLowerCase() === 'textarea') {
            return elem;
        }
        return elem
            .locator('input')
            .or(elem.getByRole('textbox'))
            .or(elem.locator('textarea'))
            .or(this.page.locator('label', {has: elem}))
            .first();
    }

    // -------------------------------
    // Actions
    // -------------------------------
    async putValue(testId: string, value: string) {
        const elem = this.get(testId),
            [tagName, className] = await elem.evaluate(el => [el.tagName, el.className]);
        if (tagName.toLowerCase() === 'input' || tagName.toLowerCase() === 'textarea') {
            return this.fill(testId, value);
        }
        if (className.includes('xh-select')) {
            return this.select(testId, value);
        }
        throw new Error(
            `putValue is not supported for element ${testId} - tagName: [${tagName}], className: [${className}]`
        );
    }

    async click(q: Predicate): Promise<void> {
        return this.get(q).click();
    }

    async fill(q: Predicate, value: string): Promise<void> {
        const input = await this.getInput(q);
        await input.fill(value);
        return input.blur();
    }

    async clear(q: Predicate): Promise<void> {
        const input = await this.getInput(q);
        await input.clear();
        return input.blur();
    }

    async select(testId: string, selectionText: string): Promise<void> {
        const elem = this.get(testId);
        await expect(elem.locator('input')).toBeEditable();
        await elem.click();
        return this.get(`${testId}-menu`).getByText(selectionText).first().click();
    }

    async filterThenClickSelectOption({
        testId,
        filterText,
        selectionText,
        asyncOptionUrl
    }: FilterSelectQuery) {
        await this.fill(testId, filterText);
        const menu = this.get(`${testId}-menu`);
        if (asyncOptionUrl) {
            await this.page.waitForResponse(resp => resp.url().includes(asyncOptionUrl));
        }
        if (selectionText) {
            return menu.getByText(selectionText).first().click();
        } else {
            return menu.locator('.xh-select__option').first().click();
        }
    }

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

    async expectText(q: Predicate, text: string, {soft = false} = {}): Promise<void> {
        let _expect = expect;
        if (soft) _expect = _expect.soft as Expect;
        await _expect(this.get(q)).toHaveText(text);
    }

    async expectValue(q: Predicate, value: string, {soft = false} = {}): Promise<void> {
        let _expect = expect;
        if (soft) _expect = _expect.soft as Expect;
        await _expect(this.get(q)).toHaveValue(value);
    }

    async expectVisible(
        q: Predicate,
        {timeout = 1000, visible = true, soft = false} = {}
    ): Promise<void> {
        let _expect = expect;
        if (soft) _expect = _expect.soft as Expect;
        await _expect(this.get(q)).toBeVisible({timeout, visible});
    }

    // -------------------------------
    // Utils
    // -------------------------------

    async buttonRefresh(): Promise<void> {
        await this.page.getByRole('button', {name: 'Refresh'}).click();
        return this.waitForMaskToClear();
    }

    async waitForMaskToClear(): Promise<void> {
        return expect(this.getMask()).toHaveCount(0, {timeout: 30000});
    }

    async toggleTheme(): Promise<void> {
        return this.page.evaluate(() => {
            window.XH.toggleTheme();
        });
    }

    async getRoutes(): Promise<Route[]> {
        return this.page.evaluate(() => window.XH.appModel.getRoutes());
    }

    async impersonate(
        user: string,
        {waitForAppState = 'RUNNING'}: {waitForAppState?: AppState} = {}
    ) {
        await this.page.evaluate<void, string>(async user => {
            return window.XH.identityService.impersonateAsync(user);
        }, user);
        await wait(2000);
        await this.waitForAppState(waitForAppState);
    }

    createGridHelper(testId: string): GridHelper {
        return new GridHelper(this, testId);
    }

    createFormHelper(testId: string): FormHelper {
        return new FormHelper(this, testId);
    }

    // -------------------------------
    // Implementation
    // -------------------------------

    private async waitForAppToBeRunning(): Promise<void> {
        await this.waitForAppState('RUNNING');
    }

    private async waitForAppState(state: AppState): Promise<void> {
        const runHandle = async () => {
            return this.page.evaluate(state => {
                return window.XH.appState === state;
            }, state);
        };

        await expect.poll(runHandle, {timeout: 60000}).toBeTruthy();
    }
}

// Global type augmentations for the browser-side helpers injected by HoistPage live in
// `hoist/globals.d.ts` so they are visible to specs without needing to import this file.
