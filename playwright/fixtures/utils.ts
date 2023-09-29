import {Page} from '@playwright/test';

export const doAuthZeroLogin = async (page: Page, appCode: string) => {
    const {USERNAME, PASSWORD} = process.env;
    if (!USERNAME || !PASSWORD) throw new Error('USERNAME or PASSWORD missing from .env.');

    await page.goto(appCode);
    await page.getByLabel('Email address').fill(USERNAME);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', {name: 'Continue', exact: true}).click();

    await page.waitForURL(`${appCode}/*`);
};
