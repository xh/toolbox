import { test } from "@playwright/test";
import { PageRunner, wait } from "../Utils";

test("App error Test", async ({ page }) => {
  const p = new PageRunner(page),
    { logIn, click } = p;

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      if (
        msg.location().url === "http://localhost:8080/xh/getTimeZoneOffset" ||
        msg.text() === "Unknown timeZoneId Error: Unknown timeZoneId"
      )
        return;
      throw new Error(
        `
        URL: ${msg.location().url}
        ${msg.text()}`,
      );
    }
  });

  await logIn();

  await click("app-tabs-grids");
  await click("grids-tabs-tree");
  await click("grids-tabs-columnFiltering");
  await click("grids-tabs-inlineEditing");
  await click("grids-tabs-dataview");
  await click("grids-tabs-treeWithCheckBox");
  await click("grids-tabs-groupedCols");
  await click("grids-tabs-rest");
  await click("grids-tabs-agGrid");

  await click("app-tabs-panels");
  await click("panels-tabs-intro");
  await click("panels-tabs-toolbars");
  await click("panels-tabs-sizing");
  await click("panels-tabs-mask");
  await click("panels-tabs-loadingIndicator");

  await click("app-tabs-layout");
  await click("layout-tab-hbox");
  await click("layout-tab-vbox");
  await click("layout-tab-tabPanel");
  await click("layout-tab-dashContainer");
  await wait(1000); // wait for ChartModel in LineChartModel to be set
  await click("layout-tab-dashCanvas");
  await click("layout-tab-dock");
  await click("layout-tab-tileFrame");

  await click("app-tabs-forms");
  await click("forms-tabs-inputs");
  await click("forms-tabs-toolbarForm");

  await click("app-tabs-charts");
  await click("charts-tabs-line");
  await click("charts-tabs-ohlc");
  await click("charts-tabs-simpleTreeMap");
  await click("charts-tabs-gridTreeMap");
  await click("charts-tabs-splitTreeMap");

  await click("app-tabs-mobile");
  await click("app-tabs-other");
  await click("other-tab-appNotifications");
  await click("other-tab-buttons");
  await click("other-tab-clock");
  await click("other-tab-customPackage");
  await click("other-tab-dateFormats");
  await click("other-tab-errorMessage");
  await click("other-tab-exceptionHandler");
  await click("other-tab-jsx");
  await click("other-tab-fileChooser");
  await click("other-tab-icons");
  await click("other-tab-inspector");
  await click("other-tab-leftRightChooser");
  await click("other-tab-numberFormats");
  await click("other-tab-pinPad");
  await click("other-tab-placeholder");
  await click("other-tab-popups");
  await click("other-tab-timestamp");

  await click("app-tabs-examples");
});
