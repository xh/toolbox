import type {IconDefinition, IconName, IconPack} from '@fortawesome/fontawesome-svg-core';
import {findIconDefinition, library} from '@fortawesome/fontawesome-svg-core';
import {HoistService, XH} from '@xh/hoist/core';
import type {HoistIconPrefix, IconRegistrationConfig} from '@xh/hoist/icon';
import {Icon} from '@xh/hoist/icon';
import {isFunction, isString, startCase, union} from 'lodash';
import type {Glyph} from '../lib/FaviconSpec';
import {glyphFromDefinition, PREFIXES} from '../lib/FaviconSpec';
import {loadFaPacksAsync} from './FaPacks';

/**
 * Catalog of the full Font Awesome Pro library, for the Favicon Generator.
 *
 * Loads all four Pro packs at startup, adds them to the FA library and registers every glyph with
 * Hoist's `Icon` catalog, so `IconPicker` can offer them all.
 *
 * Glyphs are identified by their canonical FA `iconName` (e.g. `gear`, never its alias `cog`). The
 * weight is tracked separately, as a {@link HoistIconPrefix}.
 */
export class GlyphService extends HoistService {
    static instance: GlyphService;

    /** Canonical names of all pickable glyphs with a Pro weight, sorted. */
    iconNames: string[] = [];

    /**
     * IconPicker options - the catalog `faName` of each glyph in `iconNames`, which may be an
     * alias. Leaves out catalog entries with no Pro weight, such as Toolbox's brand icons.
     */
    pickerIcons: string[] = [];

    /** Canonical iconName → the catalog `faName` the IconPicker emits for it. */
    private pickerValues = new Map<string, string>();

    override async initAsync() {
        const packs = await loadFaPacksAsync().linkTo({
            observer: XH.appLoadObserver,
            message: 'Loading Font Awesome icons...'
        });

        library.add(...packs);

        // Existing entries may be keyed by an alias (e.g. Hoist's `cog`) - compare canonical names.
        const cataloged = new Set(
            Icon.getCatalog().map(e => this.canonicalName(e.faName) ?? (e.faName as string))
        );
        Icon.registerAll(catalogConfigsForPacks(packs, n => cataloged.has(n)));

        this.indexCatalog();
    }

    /** The glyph for a name and weight, or null if the library does not have it. */
    getGlyph(iconName: string, prefix: HoistIconPrefix): Glyph {
        const def = getIconDef(iconName, prefix);
        return def ? glyphFromDefinition(def) : null;
    }

    /** Weights available for a glyph, in UI order. */
    availablePrefixes(iconName: string): HoistIconPrefix[] {
        return PREFIXES.filter(prefix => !!getIconDef(iconName, prefix));
    }

    /** Canonical iconName for a name or alias, from the first weight that has it, else null. */
    canonicalName(name: string): string {
        for (const prefix of PREFIXES) {
            const def = getIconDef(name, prefix);
            if (def) return def.iconName;
        }
        return null;
    }

    /** IconPicker value for a canonical name - its catalog `faName`, which may be an alias. */
    toPickerValue(iconName: string): string {
        return this.pickerValues.get(iconName) ?? iconName;
    }

    //------------------------
    // Implementation
    //------------------------
    private indexCatalog() {
        const pickerValues = new Map<string, string>(),
            names = new Set<string>();

        Icon.getCatalog().forEach(e => {
            // Null for a glyph with no Pro weight - e.g. a brand icon registered by Toolbox.
            const canonical = this.canonicalName(e.faName);
            if (!canonical) return;

            // Prefer an entry keyed by the canonical name itself, should an alias also have one.
            if (e.faName === canonical || !pickerValues.has(canonical)) {
                pickerValues.set(canonical, e.faName);
            }
            if (!e.hideFromPicker) names.add(canonical);
        });

        this.pickerValues = pickerValues;
        this.iconNames = [...names].sort();
        // Keep catalog order (by display name), as the picker shows its options in the order given.
        this.pickerIcons = [...names].map(it => pickerValues.get(it));
    }
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

/** FA icon definition for a glyph in a given weight, or null if not in the FA library. */
function getIconDef(iconName: string, prefix: HoistIconPrefix): IconDefinition {
    if (!iconName) return null;
    return findIconDefinition({prefix, iconName: iconName as IconName}) ?? null;
}
