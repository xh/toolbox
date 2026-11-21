import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {beforeAll, describe, expect, it} from 'vitest';
import {FeatureRequestsModel} from './FeatureRequestsModel';

const REQUEST = {
    id: 'fr-1',
    submitted: 1795200000000,
    user: 'jdoe',
    app: 'blueprintWeather',
    blueprintType: 'toolbox.weather',
    blueprintId: 'weather-new-york',
    category: 'widget',
    summary: 'A wind rose',
    userWords: 'Show me where the wind comes from',
    workaround: null,
    fragment: {component: 'windRose', config: {source: 'forecast'}}
};

beforeAll(() => initTestAppAsync());

describe('FeatureRequestsModel', () => {
    it("asks for the range's requests, and keeps each request's fragment", async () => {
        hoistCore.route('GET', 'blueprints/featureRequests', () => [REQUEST]);
        const model = new FeatureRequestsModel();
        model.startDay = LocalDate.get('2026-11-15');
        model.endDay = LocalDate.get('2026-11-21');
        await model.loadAsync();

        expect(hoistCore.requestsTo('blueprints/featureRequests').at(-1).query).toEqual({
            startDay: '2026-11-15',
            endDay: '2026-11-21'
        });
        const rec = model.gridModel.store.getById('fr-1');
        expect(rec.data).toMatchObject({
            user: 'jdoe',
            summary: 'A wind rose',
            app: 'blueprintWeather'
        });
        model.gridModel.selectAsync('fr-1');
        expect(model.selectedFragment).toBe(JSON.stringify(REQUEST.fragment, null, 2));
        model.destroy();
    });
});
