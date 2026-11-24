import {describe, expect, it} from 'vitest';
import {createPortfolioRegistry} from '../../../../blueprints/toolboxRegistry';
import {BUILTIN_ROLES, roleWidgets} from './builtinRoles';

const registry = createPortfolioRegistry();

describe('roleWidgets', () => {
    it('lists layout widgets from the container and layout categories', () => {
        const {builtIn} = roleWidgets(
            registry,
            BUILTIN_ROLES.find(it => it.key === 'layout')
        );
        expect(builtIn).toEqual(
            expect.arrayContaining([
                'box',
                'panel',
                'tabContainer',
                'dashboard',
                'tileFrame',
                'toolbar'
            ])
        );
    });

    it("lists an app's own widgets apart, and only widgets with an example", () => {
        const {builtIn, app} = roleWidgets(
            registry,
            BUILTIN_ROLES.find(it => it.key === 'input')
        );
        expect(app).toEqual(['toolbox.portfolioBuilder']);
        expect(builtIn).not.toContain('toolbox.portfolioBuilder');
        const data = roleWidgets(
            registry,
            BUILTIN_ROLES.find(it => it.key === 'data')
        ).builtIn;
        expect(data).not.toContain('placeholder');
        expect(data).toContain('cubeGrid');
    });
});
