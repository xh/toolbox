import type {FeatureRequest} from '@xh/hoist-chat-kit/genui/architect';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it} from 'vitest';
import {featureRequestSink} from './featureRequestSink';

const REQUEST: FeatureRequest = {
    summary: 'A wind rose',
    category: 'widget',
    userWords: 'Show me where the wind comes from',
    workaround: null,
    context: {app: 'blueprintWeather', appVersion: '14.0', user: 'jdoe', submitted: 1}
};

beforeAll(() => initTestAppAsync());

describe('featureRequestSink', () => {
    it("posts the request with the open blueprint's type, id and app, and returns its id", async () => {
        hoistCore.route('POST', 'blueprints/featureRequest', () => ({id: 'fr-1'}));
        const sink = featureRequestSink(() => ({
            blueprintType: 'toolbox.weather',
            blueprintId: 'weather-new-york',
            app: 'blueprintWeather'
        }));

        const receipt = await sink.submitAsync(REQUEST);

        expect(hoistCore.requestsTo('blueprints/featureRequest').at(-1).json).toEqual({
            request: REQUEST,
            blueprintType: 'toolbox.weather',
            blueprintId: 'weather-new-york',
            app: 'blueprintWeather'
        });
        expect(receipt.id).toBe('fr-1');
    });
});
