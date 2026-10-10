import {library} from '@fortawesome/fontawesome-svg-core';
import {far} from '@fortawesome/pro-regular-svg-icons';
import {Icon} from '@xh/hoist/icon';
import {beforeAll, describe, expect, it} from 'vitest';
// Toolbox's app-wide icons, as at runtime - including brand glyphs (e.g. `github`) with no Pro weight.
import '../../../core/Icons';
import {
    allIconNames,
    availablePrefixes,
    canonicalIconName,
    catalogConfigsForPacks,
    getIconDef,
    pickerIcons,
    registerFaPacks,
    toPickerValue
} from './FaLibrary';

beforeAll(() => {
    library.add(far);
});

describe('catalogConfigsForPacks', () => {
    it('emits one faName-only config per distinct glyph', () => {
        const configs = catalogConfigsForPacks([far], () => false),
            names = configs.map(it => it.faName),
            distinct = new Set(Object.values(far).map(d => d.iconName));

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
        expect(canonicalIconName('not-a-real-glyph')).toBeNull();
    });

    it('lists available weights in UI order', () => {
        expect(availablePrefixes('alicorn')).toContain('far');
        expect(availablePrefixes('not-a-real-glyph')).toEqual([]);
    });

    it('treats brand glyphs as unknown, though in the FA library', () => {
        expect(getIconDef('github', 'fab')).toBeTruthy();
        expect(availablePrefixes('github')).toEqual([]);
        expect(canonicalIconName('github')).toBeNull();
    });

    it('returns icon definitions or null', () => {
        expect(getIconDef('gear', 'far').iconName).toBe('gear');
        expect(getIconDef('github', 'far')).toBeNull();
        expect(getIconDef(null, 'far')).toBeNull();
    });
});

describe('registerFaPacks', () => {
    beforeAll(() => {
        registerFaPacks([far]);
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

    it('lists canonical names of Pro glyphs only', () => {
        const names = allIconNames();
        expect(names).toContain('alicorn');
        expect(names).toContain('gear');
        expect(names).not.toContain('cog');
        expect(names).toEqual([...names].sort());
    });

    it('offers only Pro glyphs to the picker, by their catalog names', () => {
        const icons = pickerIcons();
        expect(icons).toHaveLength(allIconNames().length);
        expect(icons).toContain('alicorn');
        expect(icons).toContain('cog');
        expect(icons).not.toContain('gear');
    });

    it('leaves out cataloged brand glyphs', () => {
        for (const brand of ['github', 'markdown', 'react']) {
            expect(Icon.getCatalogEntry(brand), brand).toBeTruthy();
            expect(allIconNames(), brand).not.toContain(brand);
            expect(pickerIcons(), brand).not.toContain(brand);
        }
    });
});
