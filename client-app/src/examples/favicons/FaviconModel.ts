import type {SegmentedControlOption} from '@xh/hoist/cmp/input';
import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import type {HoistIconPrefix} from '@xh/hoist/icon';
import {action, bindable, compareStructural, computed, observable} from '@xh/hoist/mobx';
import {downloadBlob} from '@xh/hoist/utils/js';
import {isEqual, omit} from 'lodash';
import {buildConfigSnippet} from './lib/ConfigSnippet';
import {
    allIconNames,
    availablePrefixes,
    canonicalIconName,
    getIconDef,
    pickerIcons,
    PREFIX_ORDER,
    toPickerValue
} from './lib/FaLibrary';
import {buildFaviconZip, renderFaviconFilesAsync, zipFileName} from './lib/FaviconExport';
import type {FaviconPreset, FaviconShape, FaviconSpec, Glyph} from './lib/FaviconSpec';
import {
    DEFAULT_PADDING,
    DEFAULT_SPEC,
    glyphFromDefinition,
    normalizeSpec,
    PREFIX_LABELS
} from './lib/FaviconSpec';
import {LiveTabIcon} from './lib/LiveTabIcon';
import {FAVICON_PRESETS, randomSpec} from './lib/Presets';
import {rasterizePngAsync} from './lib/Rasterizer';
import {buildShareUrl, decodeSpec, writeSpecToUrl} from './lib/SpecUrlCodec';
import {buildFaviconSvg, svgToDataUrl} from './lib/SvgBuilder';

/**
 * Design state and derived output for the Favicon Generator.
 *
 * Created by `AppModel` only once the full Font Awesome library has loaded, so every glyph lookup
 * here can rely on the packs being present. The design is restored from - and kept in sync with -
 * the page URL, so any design can be shared or bookmarked.
 */
export class FaviconModel extends HoistModel {
    /** Canonical FA iconName of the glyph. */
    @bindable accessor iconName: string;
    /** The user's chosen weight - see `prefix` for the effective weight. */
    @bindable accessor preferredPrefix: HoistIconPrefix = 'fas';
    @bindable accessor fgColor: string;
    @bindable accessor bgColor: string;
    /** Set via `setShape()`, which also keeps a default padding in step with the shape. */
    @observable accessor shape: FaviconShape;
    @bindable accessor radius: number;
    @bindable accessor padding: number;
    @bindable accessor appName: string;

    @managed downloadTask = TaskObserver.trackLast({message: 'Building favicons...'});

    readonly liveTabIcon = new LiveTabIcon();

    //------------------
    // Derived state
    //------------------
    /** Effective weight - the preferred one if the glyph has it, else the glyph's first weight. */
    @computed
    get prefix(): HoistIconPrefix {
        const available = availablePrefixes(this.iconName);
        return available.includes(this.preferredPrefix)
            ? this.preferredPrefix
            : (available[0] ?? DEFAULT_SPEC.prefix);
    }

    @computed
    get spec(): FaviconSpec {
        return normalizeSpec({
            iconName: this.iconName,
            prefix: this.prefix,
            fgColor: this.fgColor,
            bgColor: this.bgColor,
            shape: this.shape,
            radius: this.radius,
            padding: this.padding,
            appName: this.appName
        });
    }

    @computed
    get glyph(): Glyph {
        const {iconName, prefix} = this,
            def =
                getIconDef(iconName, prefix) ??
                getIconDef(DEFAULT_SPEC.iconName, DEFAULT_SPEC.prefix);
        return glyphFromDefinition(def);
    }

    @computed
    get svg(): string {
        return buildFaviconSvg(this.glyph, this.spec);
    }

    @computed
    get svgDataUrl(): string {
        return svgToDataUrl(this.svg);
    }

    /** The 180px apple touch icon - always a full-bleed square in the backdrop color. */
    @computed
    get appleSvgDataUrl(): string {
        return svgToDataUrl(buildFaviconSvg(this.glyph, this.spec, {variant: 'apple', size: 180}));
    }

    @computed
    get weightOptions(): SegmentedControlOption[] {
        const available = availablePrefixes(this.iconName);
        return PREFIX_ORDER.map(value => ({
            value,
            label: PREFIX_LABELS[value],
            disabled: !available.includes(value)
        }));
    }

    /** Thumbnail data URLs for `FAVICON_PRESETS`, in order. */
    @computed
    get presetThumbs(): string[] {
        return FAVICON_PRESETS.map(p => {
            const def = getIconDef(p.iconName, p.prefix);
            if (!def) return null;
            const spec = normalizeSpec({...omit(p, 'name'), appName: ''});
            return svgToDataUrl(buildFaviconSvg(glyphFromDefinition(def), spec, {size: 64}));
        });
    }

    /** Index of the preset the current design matches exactly, or -1. */
    @computed
    get activePresetIdx(): number {
        const current = omit(this.spec, 'appName');
        return FAVICON_PRESETS.findIndex(p => isEqual(omit(p, 'name'), current));
    }

    @computed
    get configSnippet(): string {
        return buildConfigSnippet(this.spec);
    }

    @computed
    get shareUrl(): string {
        return buildShareUrl(this.spec);
    }

    @computed
    get zipFileName(): string {
        return zipFileName(this.spec.appName);
    }

    /** IconPicker value for the current glyph - its catalog `faName`, which may be an alias. */
    get pickerValue(): string {
        return toPickerValue(this.iconName);
    }

    /** Glyphs offered by the IconPicker - only those with a Pro weight. */
    get pickerIcons(): string[] {
        return pickerIcons();
    }

    /** True inside a frame (e.g. the Toolbox Examples tab), where the tab icon is not ours. */
    get isFramed(): boolean {
        return !this.liveTabIcon.canPreview;
    }

    //------------------
    // Lifecycle
    //------------------
    constructor() {
        super();

        const spec = decodeSpec(window.location.search);
        if (!availablePrefixes(spec.iconName).length) spec.iconName = DEFAULT_SPEC.iconName;
        this.applySpec(spec);

        this.addReaction({
            track: () => this.spec,
            run: spec => writeSpecToUrl(spec),
            equals: compareStructural,
            debounce: 250,
            fireImmediately: true
        });

        if (!this.isFramed) {
            this.addReaction({
                track: () => this.svgDataUrl,
                run: url => this.liveTabIcon.show(url),
                debounce: 100,
                fireImmediately: true
            });
        }
    }

    override destroy() {
        this.liveTabIcon.restore();
        super.destroy();
    }

    //------------------
    // Actions
    //------------------
    /** Apply a full or partial design - unspecified fields keep their current values. */
    @action
    applySpec(s: Partial<FaviconSpec>) {
        const base = this.iconName ? this.spec : DEFAULT_SPEC,
            n = normalizeSpec({...base, ...s});

        this.iconName = n.iconName;
        this.preferredPrefix = n.prefix;
        this.fgColor = n.fgColor;
        this.bgColor = n.bgColor;
        this.shape = n.shape;
        this.radius = n.radius;
        this.padding = n.padding;
        this.appName = n.appName;
    }

    /** Change the shape, moving the padding to the new shape's default if it was at the old one's. */
    @action
    setShape(shape: FaviconShape) {
        if (shape === this.shape) return;
        if (this.padding === DEFAULT_PADDING[this.shape]) {
            this.padding = DEFAULT_PADDING[shape];
        }
        this.shape = shape;
    }

    @action
    setIconFromPicker(v: string) {
        if (v) this.iconName = canonicalIconName(v) ?? this.iconName;
    }

    /** Apply a preset design, keeping the current app name. */
    @action
    applyPreset(p: FaviconPreset) {
        this.applySpec({...omit(p, 'name'), appName: this.appName});
    }

    @action
    surpriseMe() {
        this.applySpec(randomSpec(Math.random, allIconNames(), this.spec));
    }

    @action
    reset() {
        this.applySpec({...DEFAULT_SPEC, appName: this.appName});
    }

    @action
    swapColors() {
        const {fgColor, bgColor} = this;
        this.fgColor = bgColor;
        this.bgColor = fgColor;
    }

    /** Render the full favicon set and download it as a zip. */
    async downloadAsync() {
        const {glyph, spec, shareUrl, zipFileName} = this;
        await renderFaviconFilesAsync(glyph, spec, {
            rasterize: rasterizePngAsync,
            comment: `Made with the Hoist Favicon Generator: ${shareUrl}`
        })
            .then(files => {
                const zip = buildFaviconZip(files);
                downloadBlob(new Blob([zip.slice()], {type: 'application/zip'}), zipFileName);
                XH.successToast(`Downloaded ${zipFileName} - unzip it into client-app/public.`);
            })
            .linkTo(this.downloadTask)
            .catchDefault();
    }
}
