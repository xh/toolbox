import {test, expect } from '@playwright/test';

const authFile = './.auth/user.json';
test('authenticate', async ({page}) => {
    const {USERNAME, PASSWORD} = process.env;
    if (!USERNAME || !PASSWORD) throw new Error('USERNAME or PASSWORD missing from .env.');

    await page.goto('app');
    await page.getByLabel('Email address').fill(USERNAME);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', {name: 'Continue', exact: true}).click();

    await page.waitForURL(`app/*`);
    const runHandle = async () => {
        return page.evaluate(() => {
            return window.XH.appIsRunning;
        });
    };

    await expect.poll(runHandle).toBeTruthy();
    await page.context().storageState({path: authFile});
});
