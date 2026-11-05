import type {IconPack} from '@fortawesome/fontawesome-svg-core';
import {far} from '@fortawesome/pro-regular-svg-icons';
import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {initTestAppAsync, TestAppModel} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it, vi} from 'vitest';
// Toolbox's app-wide icons, as at runtime - including brand glyphs (e.g. `github`) with no Pro weight.
import '../../../core/Icons';
import {catalogConfigsForPacks, GlyphService} from './GlyphService';

// Load just the regular pack, in place of all four.
vi.mock('./FaPacks', async () => {
    const {far} = await import('@fortawesome/pro-regular-svg-icons');
    return {loadFaPacksAsync: async () => [far]};
});

class GlyphTestModel extends TestAppModel {
    override async initAsync(ctx: InitContext) {
        await XH.installServicesAsync(GlyphService, ctx);
    }
}

beforeAll(async () => {
    await initTestAppAsync({modelClass: GlyphTestModel});
});

const svc = () => XH.glyphService;

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
        const fresh = {iconName: 'not-yet-cataloged', prefix: 'far', icon: [512, 512, [], '', '']},
            configs = catalogConfigsForPacks([far, {fresh} as unknown as IconPack], () => false),
            byFaName = name => configs.find(it => it.faName === name);

        // Hoist's own `Icon.gear()` factory.
        expect(byFaName('gear').name).toBe('fa-gear');
        expect(byFaName('not-yet-cataloged').name).toBe('not-yet-cataloged');
    });
});

describe('GlyphService', () => {
    it('resolves aliases to canonical names', () => {
        expect(svc().canonicalName('cog')).toBe('gear');
        expect(svc().canonicalName('gear')).toBe('gear');
        expect(svc().canonicalName('not-a-real-glyph')).toBeNull();
    });

    it('lists available weights', () => {
        expect(svc().availablePrefixes('alicorn')).toEqual(['far']);
        expect(svc().availablePrefixes('not-a-real-glyph')).toEqual([]);
    });

    it('returns glyphs, or null when the library does not have one', () => {
        const gear = svc().getGlyph('gear', 'far');
        expect(gear.iconName).toBe('gear');
        expect(gear.prefix).toBe('far');
        expect(gear.paths.length).toBeGreaterThan(0);

        expect(svc().getGlyph('alicorn', 'fas')).toBeNull();
        expect(svc().getGlyph('not-a-real-glyph', 'far')).toBeNull();
        expect(svc().getGlyph(null, 'far')).toBeNull();
    });

    it('treats brand glyphs as unknown, though in the FA library', () => {
        expect(svc().availablePrefixes('github')).toEqual([]);
        expect(svc().canonicalName('github')).toBeNull();
        expect(svc().getGlyph('github', 'far')).toBeNull();
    });

    it('catalogs every glyph once', () => {
        const entry = Icon.getCatalogEntry('alicorn');
        expect(entry.source).toBe('app');
        expect(entry.prefixes).toContain('far');

        // Hoist's `gear` icon is cataloged under its alias `cog` - no second entry for `gear`.
        const gears = Icon.getCatalog().filter(e => svc().canonicalName(e.faName) === 'gear');
        expect(gears).toHaveLength(1);
    });

    it('maps canonical names to picker values', () => {
        expect(svc().toPickerValue('gear')).toBe('cog');
        expect(svc().toPickerValue('alicorn')).toBe('alicorn');
    });

    it('lists canonical names of Pro glyphs only', () => {
        const names = svc().iconNames;
        expect(names).toContain('alicorn');
        expect(names).toContain('gear');
        expect(names).not.toContain('cog');
        expect(names).toEqual([...names].sort());
    });

    it('offers only Pro glyphs to the picker, by their catalog names', () => {
        const icons = svc().pickerIcons;
        expect(icons).toHaveLength(svc().iconNames.length);
        expect(icons).toContain('alicorn');
        expect(icons).toContain('cog');
        expect(icons).not.toContain('gear');
    });

    it('leaves out cataloged brand glyphs', () => {
        for (const brand of ['github', 'markdown', 'react']) {
            expect(Icon.getCatalogEntry(brand), brand).toBeTruthy();
            expect(svc().iconNames, brand).not.toContain(brand);
            expect(svc().pickerIcons, brand).not.toContain(brand);
        }
    });
});
