import {HoistCoreBlueprintRepository} from '@xh/hoist-chat-kit/blueprint';
import {initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it} from 'vitest';
import {createRepository} from './createRepository';
import {JsonBlobBlueprintRepository} from './JsonBlobBlueprintRepository';

beforeAll(() => initTestAppAsync());

describe('createRepository', () => {
    it('keeps blueprints in JsonBlobs, at the default config', () => {
        expect(createRepository('toolbox.portfolio')).toBeInstanceOf(JsonBlobBlueprintRepository);
    });

    it("keeps them in hoist-core's blueprint storage for hoistCore", () => {
        expect(createRepository('toolbox.portfolio', 'hoistCore')).toBeInstanceOf(
            HoistCoreBlueprintRepository
        );
    });
});
