import {describe, expect, it} from 'vitest';
import {maximizedOn} from './maximizedOn';

const LIBRARY = 'default.blueprints.portfolio';

describe('maximizedOn', () => {
    it('holds while a blueprint of the type is open', () => {
        expect(maximizedOn('expand', `${LIBRARY}.blueprint`, LIBRARY)).toBe(true);
        expect(maximizedOn('fill', `${LIBRARY}.blueprint`, LIBRARY)).toBe(true);
    });

    it("lets go on the type's library, which has no control to restore it", () => {
        expect(maximizedOn('fill', LIBRARY, LIBRARY)).toBe(false);
    });

    it('never holds while off', () => {
        expect(maximizedOn('off', `${LIBRARY}.blueprint`, LIBRARY)).toBe(false);
    });

    it("lets go on any other route, the type's own Catalog and Registry included", () => {
        expect(maximizedOn('fill', 'default.grids.standard', LIBRARY)).toBe(false);
        expect(maximizedOn('fill', 'default.blueprints.overview', LIBRARY)).toBe(false);
        expect(maximizedOn('fill', `${LIBRARY}Catalog`, LIBRARY)).toBe(false);
        expect(maximizedOn('fill', 'default.blueprints.weather', LIBRARY)).toBe(false);
        expect(maximizedOn('fill', null, LIBRARY)).toBe(false);
    });
});
