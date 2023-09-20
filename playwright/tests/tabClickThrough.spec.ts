import {test} from '../Toolbox';

test('Navigate to all tabs', async ({page, tb}) => {
    test.slow();

    //testing get row by recordId
    // await tb.click('toplevel-tab-switcher-grids')
    // await getGridRowByRecordId(page,'standard-grid',1)

    const tabs = await tb.getTabHierarchy();
    for (const tab of tabs) {
        await tb.switchToTopLevelTab(tab.id, {waitForMaskToClear: tab.id !== 'examples'});

        const childTabs = tab.children ?? [];
        for (const child of childTabs) {
            await tb.switchToChildTab(child.id, {waitForMaskToClear: child.id !== 'mask'});
        }
    }
});
