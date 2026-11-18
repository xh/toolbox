import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {hoistCore, initTestAppAsync, TestAppModel} from '@xh/hoist/test-support';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {DirectoryPanelModel} from './DirectoryPanelModel';
import {ContactService} from './svc/ContactService';

class ContactTestModel extends TestAppModel {
    override async initAsync(ctx: InitContext) {
        await XH.installServicesAsync(ContactService, ctx);
    }
}

// Contacts as the server's `contacts` config holds them.
const contacts = [
    {id: 'a', name: 'Ann', location: 'Boston', tags: ['react', 'grails']},
    {id: 'b', name: 'Bob', location: 'Denver', tags: ['react']},
    {id: 'c', name: 'Cy', location: 'Boston', tags: ['design']},
    {id: 'd', name: 'Di', location: 'Austin'}
];

let model: DirectoryPanelModel;

beforeAll(async () => {
    hoistCore.route('GET', 'contacts', () => contacts);
    await initTestAppAsync({modelClass: ContactTestModel});
    model = new DirectoryPanelModel();
    await model.loadAsync();
});

afterAll(() => model.destroy());

beforeEach(() => {
    model.locationFilter = null;
    model.tagFilters = [];
});

const visibleIds = () => model.records.map(it => it.id).sort();

describe('load', () => {
    it('lists unique tags and locations, sorted', () => {
        expect(model.tagList).toEqual(['design', 'grails', 'react']);
        expect(model.locationList).toEqual(['Austin', 'Boston', 'Denver']);
    });
});

describe('filters', () => {
    it('filters by location', () => {
        model.locationFilter = 'Boston';
        expect(visibleIds()).toEqual(['a', 'c']);
    });

    it('filters by tag, skipping contacts with no tags', () => {
        model.tagFilters = ['react'];
        expect(visibleIds()).toEqual(['a', 'b']);
    });

    it('combines the location and tag filters', () => {
        model.locationFilter = 'Boston';
        model.tagFilters = ['react'];
        expect(visibleIds()).toEqual(['a']);
    });

    it('shows every contact once both filters clear', () => {
        model.locationFilter = 'Denver';
        model.tagFilters = ['react'];
        model.locationFilter = null;
        model.tagFilters = [];
        expect(visibleIds()).toEqual(['a', 'b', 'c', 'd']);
    });

    it('matches a contact with any one of several selected tags', () => {
        model.tagFilters = ['design', 'grails'];
        expect(visibleIds()).toEqual(['a', 'c']);
    });
});

describe('favorites', () => {
    it('toggles a favorite in the grid and saves it to the contactAppState pref', async () => {
        const rec = model.gridModel.store.getById('b');
        model.toggleFavorite(rec);
        expect(model.gridModel.store.getById('b').data.isFavorite).toBe(true);

        // Persistence writes after a 250ms debounce.
        await wait(300);
        await XH.prefService.pushPendingAsync();
        expect(hoistCore.prefs.contactAppState.value.userFaves).toEqual(['b']);
    });
});
