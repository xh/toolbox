import {XH} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {afterEach, beforeAll, describe, expect, it} from 'vitest';
import {HomeModel} from './HomeModel';
import {DEFAULT_WIDGET_IDS} from './widgets/WidgetCatalog';

beforeAll(() => initTestAppAsync({isMobileApp: true}));

let model: HomeModel;

// A model over the given saved layout - the mobileHomeWidgets pref as the server last stored it.
function createModel(saved: object = {}) {
    XH.setPref('mobileHomeWidgets', saved);
    return (model = new HomeModel());
}

afterEach(() => model?.destroy());

// The layout as saved to the server, after persistence's 250ms write debounce.
async function savedLayoutAsync() {
    await wait(300);
    await XH.prefService.pushPendingAsync();
    return hoistCore.prefs.mobileHomeWidgets.value;
}

describe('saved layout', () => {
    it('shows every catalog widget, in catalog order, for a new user', () => {
        createModel();
        expect(model.resolvedHomeIds).toEqual(DEFAULT_WIDGET_IDS);
        expect(model.resolvedAvailableIds).toEqual([]);
    });

    it('drops widgets no longer in the catalog and adds new ones to the home stack', () => {
        createModel({
            homeIds: ['commits', 'retired', 'welcome'],
            availableIds: ['meetXh', 'alsoRetired']
        });
        expect(model.resolvedHomeIds).toEqual([
            'commits',
            'welcome',
            'startHere',
            'releases',
            'feedback'
        ]);
        expect(model.resolvedAvailableIds).toEqual(['meetXh']);
    });

    it('keeps a widget saved in both lists under Available only', () => {
        createModel({homeIds: ['welcome', 'commits'], availableIds: ['commits']});
        expect(model.resolvedHomeIds).not.toContain('commits');
        expect(model.resolvedAvailableIds).toEqual(['commits']);
    });
});

describe('managing widgets', () => {
    it('moves a widget off and back onto the home stack, appending it', async () => {
        createModel();
        model.setOnHome('welcome', false);
        expect(model.resolvedAvailableIds).toEqual(['welcome']);

        model.setOnHome('welcome', true);
        expect(model.resolvedHomeIds.at(-1)).toBe('welcome');
        expect(model.resolvedAvailableIds).toEqual([]);

        // Persistence leaves out a value equal to its default, as `availableIds` is here.
        expect(await savedLayoutAsync()).toEqual({
            homeIds: [...DEFAULT_WIDGET_IDS.slice(1), 'welcome']
        });
    });

    it('applies a drag between lists, and ignores a drop outside them', () => {
        createModel();
        model.onDragEnd({
            draggableId: 'releases',
            source: {droppableId: 'home', index: 2},
            destination: {droppableId: 'available', index: 0}
        });
        expect(model.resolvedAvailableIds).toEqual(['releases']);

        model.onDragEnd({
            draggableId: 'welcome',
            source: {droppableId: 'home', index: 0}
        });
        expect(model.resolvedHomeIds[0]).toBe('welcome');
    });

    it('freezes the dashboard while managing, then shows the changes on close', () => {
        createModel();
        model.isManaging = true;
        model.setOnHome('welcome', false);
        expect(model.dashboardWidgets.map(it => it.id)).toEqual(DEFAULT_WIDGET_IDS);

        model.isManaging = false;
        expect(model.dashboardWidgets.map(it => it.id)).not.toContain('welcome');
    });

    it('toggles collapsed widgets and saves them', async () => {
        createModel();
        model.toggleCollapsed('commits');
        expect(model.isCollapsed('commits')).toBe(true);
        expect((await savedLayoutAsync()).collapsedIds).toEqual(['commits']);

        model.toggleCollapsed('commits');
        expect(model.isCollapsed('commits')).toBe(false);
    });

    it('restores the default layout', () => {
        createModel({homeIds: ['meetXh'], availableIds: ['welcome'], collapsedIds: ['meetXh']});
        model.restoreDefaults();
        expect(model.resolvedHomeIds).toEqual(DEFAULT_WIDGET_IDS);
        expect(model.resolvedAvailableIds).toEqual([]);
        expect(model.collapsedIds).toEqual([]);
    });
});
