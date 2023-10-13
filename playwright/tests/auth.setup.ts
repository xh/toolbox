import {Page, expect, test} from '@playwright/test';

const authFile = './.auth/admin.json';
test('authenticate admin', async ({page}) => {
    const {ADMINUSERNAME, ADMINPASSWORD} = process.env;
    if (!ADMINUSERNAME || !ADMINPASSWORD)
        throw new Error('ADMINUSERNAME or ADMINPASSWORD missing from .env.');

    await logIn(ADMINUSERNAME, ADMINPASSWORD, authFile, page)

});

const authRoUserFile = './.auth/roUser.json';
test('authenticate read only admin', async ({page}) => {
    const {ROADMINUSERNAME, ROADMINPASSWORD} = process.env;
    if (!ROADMINUSERNAME || !ROADMINPASSWORD)
        throw new Error('ROADMINUSERNAME or ROADMINPASSWORD missing from .env.');

    await logIn(ROADMINUSERNAME, ROADMINPASSWORD, authRoUserFile, page)

});

async function logIn(user: string, password: string, path: string, page: Page) {
    await page.goto('app');
    await page.getByLabel('Email address').fill(user);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', {name: 'Continue', exact: true}).click();

    await page.waitForURL(`app/*`);
    const runHandle = async () => {
        return page.evaluate(() => {
            return window.XH.appIsRunning;
        });
    };

    await expect.poll(runHandle).toBeTruthy();
    await page.context().storageState({path});

}