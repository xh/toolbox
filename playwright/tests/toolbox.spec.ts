import { expect, test } from "@playwright/test";
import { fillByTestId, PageRunner } from "../Utils";

test("Hoist Inputs Test", async ({ page }) => {
  const p = new PageRunner(page),
    { logIn, click, fill, expectText, clear, getByTestId } = p;

  await logIn();

  await click("app-tabs-forms");
  await click("forms-tabs-inputs");

  await page.getByText('Commit on change').nth(1).click();
  // await getByTestId('inputs-panel-commit-radio-switch-input').check()

  expect(await page.getByTestId('inputs-panel-commit-radio-switch-input').isVisible())

  // await page.getByLabel('Commit on change').check()

  await fill("hoist-inputs-textInput1", "ryan");

  await fill("hoist-inputs-textInput2", "ryan@xh.io");
  await fill("hoist-inputs-textInput3", "ryanlee@xh.io");

  await expectText("inputs-panel-textInput1", "ryan");
  await expectText("inputs-panel-textInput2", "ryan@xh.io");
  await expectText("inputs-panel-textInput3", "ryanlee@xh.io");

  await  getByTestId("hoist-inputs-textInput2")
    .locator("button")
    .click();
  await expectText("inputs-panel-textInput2", "null");

  await fill("hoist-inputs-textArea", "Text Area");
  await expectText("inputs-panel-textArea", "Text Area");

  await clear("hoist-inputs-textArea");
  await expectText("inputs-panel-textArea", "[Empty String]");

  await fill("hoist-inputs-numberInput1", "4000");
  await expectText("inputs-panel-numberInput1", "4000");

  await fill("hoist-inputs-numberInput2", "4k");
  await expectText("inputs-panel-numberInput2", "4000");

  await fill("hoist-inputs-numberInput3", "4");
  await expectText("inputs-panel-numberInput3", "0.04");

  // await  getByTestId("hoist-inputs-select2").locator("svg").click();
  // await  getByTestId("hoist-inputs-select4-portal")
  //   .getByText("Alabama")
  //   .click();
  // await expectText("inputs-panel-select2", "AL");

  await  (await getByTestId("hoist-inputs-checkbox").getByText("enabled")).click();
  await expectText("inputs-panel-checkbox", "true");

  await  getByTestId("hoist-inputs-switch").locator("span").click();
  await expectText("inputs-panel-switch", "true");

  await getByTestId("hoist-inputs-buttonGroupInput")
    .getByText("Button 3")
    .click();
  await expectText("inputs-panel-buttonGroupInput", "button3");
});
