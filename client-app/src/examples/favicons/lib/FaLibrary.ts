import type {IconDefinition, IconName, IconPack} from '@fortawesome/fontawesome-svg-core';
import {findIconDefinition, library} from '@fortawesome/fontawesome-svg-core';
import type {HoistIconPrefix, IconRegistrationConfig} from '@xh/hoist/icon';
import {Icon} from '@xh/hoist/icon';
import {isFunction, isString, startCase, union} from 'lodash';

/**
 * Catalog and name helpers for the full Font Awesome library.
 *
 * Glyphs are identified throughout this app by their canonical FA `iconName` (e.g. `gear`, never
 * its alias `cog`). The weight is tracked separately, as a {@link HoistIconPrefix}.
 */

/** FA weights in the order the UI offers them. */
export const PREFIX_ORDER: HoistIconPrefix[] = ['fas', 'far', 'fal', 'fat', 'fab'];

/** Canonical iconName → the catalog `faName` the IconPicker emits for it (may be an alias). */
let pickerValueByCanonical = new Map<string, string>();

/** Canonical names of all cataloged glyphs, split into Pro glyphs and brand-only glyphs. */
let iconNames: {pro: string[]; brands: string[]} = {pro: [], brands: []};

/**
 * Add the given packs to the FA library and register every glyph not already cataloged by Hoist
 * or Toolbox with Hoist's `Icon` catalog, so they are all offered by IconPicker.
 */
export function registerFaPacks(packs: IconPack[]): void {
    library.add(...packs);

    // Existing entries may be keyed by an alias (e.g. Hoist's `cog`) - compare canonical names.
    const cataloged = new Set(
        Icon.getCatalog().map(e => canonicalIconName(e.faName) ?? (e.faName as string))
    );
    Icon.registerAll(catalogConfigsForPacks(packs, n => cataloged.has(n)));

    indexCatalog();
}

/**
 * Registration configs for every distinct glyph across the given packs, keyed by FA name only.
 * Configs carry no `defs`, as the packs are expected to be in the FA library already - a defs-based
 * registration would call `library.add` once per glyph, which is far too slow at this scale.
 *
 * @param packs - FA packs, possibly holding several exports (aliases) of one glyph.
 * @param skip - return true for a canonical name that should not be registered.
 */
export function catalogConfigsForPacks(
    packs: IconPack[],
    skip: (iconName: string) => boolean
): IconRegistrationConfig[] {
    // Group by canonical name - drops duplicate alias exports, and merges weights of one glyph.
    const keywordsByName = new Map<string, string[]>();
    packs.forEach(pack => {
        Object.values(pack).forEach((def: IconDefinition) => {
            const {iconName} = def,
                aliases = def.icon[2].filter(isString);
            keywordsByName.set(iconName, union(keywordsByName.get(iconName) ?? [], aliases));
        });
    });

    const ret: IconRegistrationConfig[] = [];
    keywordsByName.forEach((keywords, iconName) => {
        if (skip(iconName)) return;
        ret.push({
            // Avoid clobbering an existing factory or method on Icon (e.g. `gear`, `icon`).
            name: isFunction((Icon as any)[iconName]) ? `fa-${iconName}` : iconName,
            faName: iconName as IconName,
            displayName: startCase(iconName),
            keywords
        });
    });
    return ret;
}

/** Canonical FA iconName for a name or alias, from the first weight that has it, else null. */
export function canonicalIconName(name: string): string | null {
    for (const prefix of PREFIX_ORDER) {
        const def = getIconDef(name, prefix);
        if (def) return def.iconName;
    }
    return null;
}

/** Weights available in the FA library for a glyph, in {@link PREFIX_ORDER}. */
export function availablePrefixes(iconName: string): HoistIconPrefix[] {
    return PREFIX_ORDER.filter(prefix => !!getIconDef(iconName, prefix));
}

/** FA icon definition for a glyph in a given weight, or null if not in the FA library. */
export function getIconDef(iconName: string, prefix: HoistIconPrefix): IconDefinition | null {
    if (!iconName) return null;
    return findIconDefinition({prefix, iconName: iconName as IconName}) ?? null;
}

/** IconPicker value for a canonical name - the catalog's `faName`, which may be an alias. */
export function toPickerValue(iconName: string): string {
    return pickerValueByCanonical.get(iconName) ?? iconName;
}

/** Canonical names of all cataloged glyphs, split into Pro and brand-only lists. */
export function allIconNames(): {pro: string[]; brands: string[]} {
    return iconNames;
}

//------------------------
// Implementation
//------------------------
function indexCatalog() {
    const byCanonical = new Map<string, string>(),
        pro = new Set<string>(),
        brands = new Set<string>();

    Icon.getCatalog().forEach(e => {
        const canonical = canonicalIconName(e.faName);
        if (!canonical) return;

        // Prefer an entry keyed by the canonical name itself, should an alias also have one.
        if (e.faName === canonical || !byCanonical.has(canonical)) {
            byCanonical.set(canonical, e.faName);
        }
        if (e.hideFromPicker) return;

        const prefixes = availablePrefixes(canonical);
        if (prefixes.some(it => it !== 'fab')) {
            pro.add(canonical);
        } else if (prefixes.includes('fab')) {
            brands.add(canonical);
        }
    });

    pickerValueByCanonical = byCanonical;
    iconNames = {pro: [...pro].sort(), brands: [...brands].sort()};
}
