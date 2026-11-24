import {DataCatalog, validateBlueprint} from '@xh/hoist-chat-kit/blueprint';
import {describe, expect, it} from 'vitest';
import {createPortfolioRegistry} from '../../../../blueprints/toolboxRegistry';
import catalogJson from '../../../../test-support/blueprintsCatalog.json';
import {CONCEPT_PAGES} from './conceptPages';

const catalog = new DataCatalog(catalogJson as any),
    registry = createPortfolioRegistry();

describe('CONCEPT_PAGES', () => {
    it('validates each example blueprint with no issues', () => {
        const problems = CONCEPT_PAGES.flatMap(({id, example}) =>
            example
                ? validateBlueprint(example, {registry, catalog}).map(
                      it => `${id}: ${it.code} ${it.path} ${it.message}`
                  )
                : []
        );
        expect(problems).toEqual([]);
    });

    it('has unique ids, each with copy', () => {
        expect(new Set(CONCEPT_PAGES.map(it => it.id)).size).toBe(CONCEPT_PAGES.length);
        expect(CONCEPT_PAGES.every(it => it.paragraphs.length)).toBe(true);
    });
});
