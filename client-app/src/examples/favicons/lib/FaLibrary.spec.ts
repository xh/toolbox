import {library} from '@fortawesome/fontawesome-svg-core';
import {fab} from '@fortawesome/free-brands-svg-icons';
import {far} from '@fortawesome/pro-regular-svg-icons';
import {Icon} from '@xh/hoist/icon';
import {beforeAll, describe, expect, it} from 'vitest';
import {
    allIconNames,
    availablePrefixes,
    canonicalIconName,
    catalogConfigsForPacks,
    getIconDef,
    registerFaPacks,
    toPickerValue
} from './FaLibrary';

beforeAll(() => {
    library.add(far, fab);
});

describe('catalogConfigsForPacks', () => {
    it('emits one faName-only config per distinct glyph', () => {
        const configs = catalogConfigsForPacks([far, fab], () => false),
            names = configs.map(it => it.faName),
            distinct = new Set([...Object.values(far), ...Object.values(fab)].map(d => d.iconName));

        expect(names.length).toBe(distinct.size);
        expect(new Set(names).size).toBe(names.length);
        expect(configs.every(it => !it.defs)).toBe(true);
        // `faCog` is an alias export of `faGear` - it must not produce its own config.
        expect(names).toContain('gear');
        expect(names).not.toContain('cog');
    });

    it('takes keywords from string aliases', () => {
        const xmark = catalogConfigsForPacks([far], () => false).find(it => it.faName === 'xmark');
        expect(xmark.keywords).toContain('close');
        expect(xmark.keywords.every(it => typeof it === 'string')).toBe(true);
        expect(xmark.displayName).toBe('Xmark');
    });

    it('leaves out skipped names', () => {
        const configs = catalogConfigsForPacks([far], n => n === 'alicorn');
        expect(configs.some(it => it.faName === 'alicorn')).toBe(false);
        expect(configs.some(it => it.faName === 'anchor')).toBe(true);
    });

    it('prefixes names that collide with existing Icon functions', () => {
        const configs = catalogConfigsForPacks([far], () => false),
            byFaName = name => configs.find(it => it.faName === name);

        expect(byFaName('gear').name).toBe('fa-gear');
        expect(byFaName('alicorn').name).toBe('alicorn');
        expect(byFaName('arrow-left').name).toBe('arrow-left');
    });
});

describe('name helpers', () => {
    it('resolves aliases to canonical names', () => {
        expect(canonicalIconName('cog')).toBe('gear');
        expect(canonicalIconName('gear')).toBe('gear');
        expect(canonicalIconName('github')).toBe('github');
        expect(canonicalIconName('not-a-real-glyph')).toBeNull();
    });

    it('lists available weights in UI order', () => {
        expect(availablePrefixes('github')).toEqual(['fab']);
        expect(availablePrefixes('alicorn')).toContain('far');
        expect(availablePrefixes('not-a-real-glyph')).toEqual([]);
    });

    it('returns icon definitions or null', () => {
        expect(getIconDef('gear', 'far').iconName).toBe('gear');
        expect(getIconDef('github', 'far')).toBeNull();
        expect(getIconDef(null, 'far')).toBeNull();
    });
});

describe('registerFaPacks', () => {
    beforeAll(() => {
        registerFaPacks([far, fab]);
    });

    it('catalogs every glyph once', () => {
        const entry = Icon.getCatalogEntry('alicorn');
        expect(entry.source).toBe('app');
        expect(entry.prefixes).toContain('far');

        // Hoist's `gear` icon is cataloged under its alias `cog` - no second entry for `gear`.
        expect(Icon.getCatalog().filter(e => canonicalIconName(e.faName) === 'gear')).toHaveLength(
            1
        );
    });

    it('maps canonical names to picker values', () => {
        expect(toPickerValue('gear')).toBe('cog');
        expect(toPickerValue('alicorn')).toBe('alicorn');
    });

    it('splits names into pro and brands', () => {
        const {pro, brands} = allIconNames();
        expect(pro).toContain('alicorn');
        expect(pro).toContain('gear');
        expect(pro).not.toContain('github');
        expect(brands).toContain('github');
        expect(brands).not.toContain('gear');
    });
});
