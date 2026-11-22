import {DataCatalog, validateBlueprint} from '@xh/hoist-chat-kit/blueprint';
import {describe, expect, it} from 'vitest';
import {createPortfolioRegistry} from '../../../../blueprints/toolboxRegistry';
import catalogJson from '../../../../test-support/blueprintsCatalog.json';
import {builtinExample, INPUTS_OVERVIEW} from './builtinExamples';

const catalog = new DataCatalog(catalogJson as any),
    registry = createPortfolioRegistry();

describe('builtinExample', () => {
    it('validates every example with no errors', () => {
        const names = [...Object.keys(registry.widgets), INPUTS_OVERVIEW],
            problems = names.flatMap(name => {
                const bp = builtinExample(name, registry, catalog);
                return bp
                    ? validateBlueprint(bp, {registry, catalog})
                          .filter(it => it.severity === 'error')
                          .map(it => `${name}: ${it.code} ${it.path} ${it.message}`)
                    : [];
            });
        expect(problems).toEqual([]);
    });

    it('labels every variable of the inputs overview', () => {
        const {variables} = builtinExample(INPUTS_OVERVIEW, registry, catalog);
        expect(Object.values(variables).every(it => it.label)).toBe(true);
    });
});
