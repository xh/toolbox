import {test} from '../Toolbox';

test('Navigate to all tabs', async ({ tb}) => {
    test.slow();

    const tabs = await tb.getTabHierarchy();
    for (const tab of tabs) {
        await tb.switchToTopLevelTab(tab.id, {waitForMaskToClear: tab.id !== 'examples'});

        const childTabs = tab.children ?? [];
        for (const child of childTabs) {
            await tb.switchToChildTab(child.id, {waitForMaskToClear: child.id !== 'mask'});
        }
    }
});
