import { expect, Page } from "@playwright/test";

export async function fillByTestId(page: Page, testId: string, text: string) {
  const elem = getElementByTestId(page,testId)
  if(await elem.locator('input').isVisible()) return elem.locator('input').fill(text)
  if(await elem.locator('textarea').isVisible()) return await elem.locator('textarea').fill(text)

  await elem.fill(text)
}

export async function clickByTestId(page: Page, testId: string) {
  await getElementByTestId(page, testId).click();
}

export async function expectTestIdText(
  page: Page,
  testId: string,
  text: string,
) {
  await expect(getElementByTestId(page, testId)).toHaveText(text);
}

export function getElementByTestId(page: Page, testId: string) {
  return page.getByTestId(testId);
}
export async function clearByTestId(page: Page, testId: string) {
  const elem = getElementByTestId(page,testId)
  if(await elem.locator('input').isVisible()) return elem.locator('input').clear()
  if(await elem.locator('textarea').isVisible()) return await elem.locator('textarea').clear()
  await elem.clear()
}

export async function logIn(page: Page) {
  const { USERNAME, PASSWORD } = process.env;
  if (!USERNAME || !PASSWORD)
    throw new Error("USERNAME or PASSWORD missing from .env.");

  await page.goto("http://localhost:3000/app");
  await page.getByLabel("Email address").fill(USERNAME);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

export function wait<T>(interval: number = 0): Promise<T> {
  return new Promise((resolve) => setTimeout(resolve, interval)) as Promise<T>;
}

export class PageRunner {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  logIn = async () => logIn(this.page);
  getByTestId = (testId: string) => getElementByTestId(this.page, testId);
  click = async (testId: string) => clickByTestId(this.page, testId);
  clear = async (testId: string) => clearByTestId(this.page, testId);
  fill = async (testId: string, text: string) =>
    fillByTestId(this.page, testId, text);
  expectText = async (testId: string, text: string) =>
    expectTestIdText(this.page, testId, text);
}
