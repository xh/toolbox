import {expect, Page, test as setup} from '@playwright/test';

/**
 * Authentication setup for Toolbox Playwright tests.
 *
 * Authenticates test users via the Hoist password login form (requires
 * APP_TOOLBOX_OAUTH_PROVIDER=NONE in the backend's .env). Caches session state to .auth/ files
 * so subsequent tests skip login entirely.
 *
 * Test users are bootstrapped by BootStrap.groovy in local dev mode when
 * APP_TOOLBOX_TEST_USER_PASSWORD is set. See playwright.config.ts for pre-flight validation.
 */

const TEST_PASSWORD = process.env.APP_TOOLBOX_TEST_USER_PASSWORD;
if (!TEST_PASSWORD) {
    throw new Error('APP_TOOLBOX_TEST_USER_PASSWORD must be set in .env');
}

setup.describe.configure({mode: 'parallel'});

setup('authenticate admin', async ({page, baseURL}) =>
    doLogin(page, baseURL, 'test-admin@xh.io', './.auth/admin.json')
);

setup('authenticate user', async ({page, baseURL}) =>
    doLogin(page, baseURL, 'test-user@xh.io', './.auth/user.json')
);

async function doLogin(page: Page, baseURL: string, username: string, storagePath: string) {
    await page.goto(baseURL + '/');

    const loginPanel = page.getByTestId('xh-login');
    await expect(loginPanel).toBeVisible({timeout: 20000});

    await page.getByTestId('xh-login-username').fill(username);
    await page.getByTestId('xh-login-password').fill(TEST_PASSWORD);
    await page.getByTestId('xh-login-btn').click();

    // Wait for the app to reach RUNNING — confirms login succeeded and init completed.
    await expect
        .poll(() => page.evaluate(() => window.XH?.appState === 'RUNNING').catch(() => false), {
            timeout: 60000
        })
        .toBeTruthy();

    await page.context().storageState({path: storagePath});
    console.log(`Authenticated as ${username}`);
}
