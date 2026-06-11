/**
 * Smoke tests — verify the desktop app loads, both test users can authenticate, and the top-level
 * tab tree initialises cleanly without errors for each.
 *
 * These are intentionally shallow. Per-feature spec files will go alongside.
 */
import {test} from '../fixtures/ToolboxApp';
import {expect} from '@playwright/test';

test('Admin can navigate to each top-level tab without error', async ({admin}) => {
    const tabs = await admin.getVisibleTabIds();
    expect(tabs.length).toBeGreaterThan(0);
    for (const tabId of tabs) {
        // Wrap in test.step so the HTML report breaks navigation down per-tab, with traces.
        await test.step(`Activate tab: ${tabId}`, async () => {
            await admin.switchToTopLevelTab(tabId);
        });
    }
});

test('Standard user can also load the app and see the public tabs', async ({user}) => {
    const tabs = await user.getVisibleTabIds();
    // Toolbox does not currently gate desktop tabs by role, so a standard user sees the same set.
    // Asserting non-empty + 'home' guards against accidental future regressions in either direction.
    expect(tabs).toContain('home');
    expect(tabs.length).toBeGreaterThan(0);
});

test('Admin sees the grids tab and can drill into a child tab', async ({admin}) => {
    await admin.switchToTopLevelTab('grids');
    const childTabs = await admin.getChildTabIds('grids');
    expect(childTabs).toContain('standard');

    await admin.switchToChildTab('grids', 'standard');
});
