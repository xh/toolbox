import { expect, test } from "@playwright/test";
import { fillByTestId, PageRunner } from "../Utils";

test("Hoist Inputs Test", async ({ page }) => {
  const p = new PageRunner(page),
    { logIn, click, fill, expectText, clear } = p;

  await logIn();

  await click("app-tabs-forms");
  await click("forms-tabs-inputs");
  await page.getByText("Commit on change").nth(1).click();

  await fill("hoist-inputs-textInput1-text-input", "ryan");
  await fill("hoist-inputs-textInput2-text-input", "ryan@xh.io");
  await fill("hoist-inputs-textInput3-text-input", "ryanlee@xh.io");

  await expectText("inputs-panel-textInput1", "ryan");
  await expectText("inputs-panel-textInput2", "ryan@xh.io");
  await expectText("inputs-panel-textInput3", "ryanlee@xh.io");

  await click("hoist-inputs-textInput2-text-input-clear");
  await expect(
    page.getByTestId("hoist-inputs-textInput2-text-input"),
  ).toBeEmpty();
  await expectText("inputs-panel-textInput2", "null");

  await fill("hoist-inputs-textArea-text-area", "Text Area");
  await expectText("inputs-panel-textArea", "Text Area");

  await clear("hoist-inputs-textArea-text-area");
  await expectText("inputs-panel-textArea", "[Empty String]");

  await fillByTestId(page, "hoist-inputs-numberInput1-number-input", "4000");
  await expectText("inputs-panel-numberInput1", "4000");

  await fillByTestId(page, "hoist-inputs-numberInput2-number-input", "4k");
  await expectText("inputs-panel-numberInput2", "4000");

  await fillByTestId(page, "hoist-inputs-numberInput3-number-input", "4");
  await expectText("inputs-panel-numberInput3", "0.04");
});
