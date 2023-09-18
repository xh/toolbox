import {Locator, Page, expect} from '@playwright/test';
import {isMatch} from '../node_modules/lodash'
import {StoreRecordId} from '@xh/hoist/data/StoreRecord';
import {XH} from '@xh/hoist/core'

export function get(page: Page, testId: string) {
    return page.getByTestId(testId);
}

export async function clickByTestId(page: Page, testId: string) {
    await get(page, testId).click();
}

export async function expectTestIdText(page: Page, testId: string, text: string) {
    await expect(get(page, testId)).toHaveText(text);
}

export async function fillByTestId(page: Page, testId: string, text: string) {
    const elem = get(page, testId);
    if (await elem.locator('input').isVisible()) return elem.locator('input').fill(text);
    if (await elem.locator('textarea').isVisible()) return elem.locator('textarea').fill(text);
    // TODO add codeinput textbox
    return elem.fill(text);
}

export async function clearByTestId(page: Page, testId: string) {
    const elem = get(page, testId);
    if (await elem.locator('input').isVisible()) return elem.locator('input').clear();
    if (await elem.locator('textarea').isVisible()) return await elem.locator('textarea').clear();
    await elem.clear();
}

// JSON input
export async function fillJsonInputByTestId(page: Page, testId: string, text: string) {
    await page.getByTestId(testId).getByRole('textbox').fill(text);
}

export async function clickSelectOption(page: Page, testId: string, selectionText: string) {
    await page.getByTestId(testId).locator('svg').click();
    await get(page, `${testId}-menu`).getByText(selectionText).click();
}

export async function filterThenClickSelectOption(
    page: Page,
    testid: string,
    filterText: string,
    selectionText?: string
) {
    //
}

// Checkboxes and radio inputs
// Looks for and toggles the label that has the input that matches the given testId
export async function toggleCheckboxByTestId(page: Page, testId: string) {
    await page.locator('label', {has: page.getByTestId(testId)}).click();
}

export async function checkCheckBoxByTestid(page: Page, testId: string) {
    await page.locator('label', {has: page.getByTestId(testId)}).check();
}

export async function uncheckCheckBoxByTestid(page: Page, testId: string) {
    await page.locator('label', {has: page.getByTestId(testId)}).uncheck();
}

export async function getGridRowByRecordId(page: Page, testId: string, id: StoreRecordId) {
    return page.evaluate(() => XH.getActiveModelByTestId(testId).gridModel.store.getById(id));
}

export async function getGridRowByCellContents(page: Page, testId: string, spec: PlainObject) {
    return page.evaluate(() => {
        XH.getActiveModelByTestId(testId).gridModel.store.allRecords.find(({data}) => isMatch(data, spec));
    });
}
