import {HoistPage} from '../hoist/HoistPage';
import {ApiHelper} from '../hoist/ApiHelper';
import {Browser, test as baseTest} from '@playwright/test';

const BACKEND_URL = 'http://localhost:8080';

/**
 * Toolbox-specific page object — extends the generic HoistPage with helpers for navigating the
 * Toolbox desktop app shell. Mirrors the JobsiteApp pattern: tiny, app-specific helpers that
 * encode the structure of THIS app's tab tree.
 */
export class ToolboxApp extends HoistPage {
    /** Activate a top-level tab in the desktop app shell. */
    async switchToTopLevelTab(tabId: string) {
        await this.page.evaluate(tabId => {
            (window.XH.appModel as any).tabModel.activateTab(tabId);
        }, tabId);
        await this.waitForMaskToClear();
    }

    /**
     * Activate a child tab inside a top-level container with nested tabs (e.g. 'grids' > 'tree').
     * Toolbox uses Hoist's auto-created `childContainerModel` on the parent TabModel for these
     * nested containers — there is no separate child model class to look up.
     *
     * Activates parent + waits for masks to clear (so the child container has mounted) before
     * activating the child. The two-stage wait avoids a race where the child activate is issued
     * against a stale TabModel before Hoist's lazy mount completes.
     */
    async switchToChildTab(parentTabId: string, childTabId: string) {
        await this.switchToTopLevelTab(parentTabId);
        await this.page.evaluate(
            ([parentId, childId]) => {
                const appModel = window.XH.appModel as any;
                const parent = appModel.tabModel.tabs.find((t: any) => t.id === parentId);
                parent.childContainerModel.activateTab(childId);
            },
            [parentTabId, childTabId]
        );
        await this.waitForMaskToClear();
    }

    /** Returns IDs of top-level tabs visible to the current user (respects role-based omit). */
    async getVisibleTabIds(): Promise<string[]> {
        return this.page.evaluate(() => {
            return (window.XH.appModel as any).tabModel.tabs
                .filter((t: any) => !t.isOmitted)
                .map((t: any) => t.id);
        });
    }

    /** Returns IDs of all child tabs under a given top-level tab. */
    async getChildTabIds(parentTabId: string): Promise<string[]> {
        return this.page.evaluate(parentId => {
            const appModel = window.XH.appModel as any;
            const parent = appModel.tabModel.tabs.find((t: any) => t.id === parentId);
            return parent?.childContainerModel?.tabs.map((t: any) => t.id) ?? [];
        }, parentTabId);
    }
}

async function createFixture(browser: Browser, baseURL: string | undefined, storageState: string) {
    const context = await browser.newContext({storageState});
    const app = new ToolboxApp({page: await context.newPage(), baseURL: `${baseURL}`});
    await app.initAsync();
    return {app, context};
}

function createApiHelper(username: string): ApiHelper {
    const password = process.env.APP_TOOLBOX_TEST_USER_PASSWORD;
    if (!password) throw new Error('APP_TOOLBOX_TEST_USER_PASSWORD is required for API tests');
    return new ApiHelper({baseURL: BACKEND_URL, username, password});
}

/**
 * Role-scoped test fixtures. Each browser-backed fixture boots a fresh BrowserContext with the
 * pre-authenticated storageState saved by auth.setup.ts — no per-test login cost.
 */
export const test = baseTest.extend<{
    admin: ToolboxApp;
    user: ToolboxApp;
    adminApi: ApiHelper;
    userApi: ApiHelper;
}>({
    admin: async ({baseURL, browser}, use) => {
        const {app, context} = await createFixture(browser, baseURL, './.auth/admin.json');
        await use(app);
        await context.close();
    },
    user: async ({baseURL, browser}, use) => {
        const {app, context} = await createFixture(browser, baseURL, './.auth/user.json');
        await use(app);
        await context.close();
    },
    adminApi: async ({}, use) => {
        const api = createApiHelper('test-admin@xh.io');
        await use(api);
        await api.dispose();
    },
    userApi: async ({}, use) => {
        const api = createApiHelper('test-user@xh.io');
        await use(api);
        await api.dispose();
    }
});
