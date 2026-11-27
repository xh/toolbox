import {GridModel} from '@xh/hoist/cmp/grid';
import {div, span} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {action, bindable, computed, observable, observableRef} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {debounced} from '@xh/hoist/utils/js';
import {forOwn, isEmpty, omit, pickBy, uniq} from 'lodash';
import type {Rgba} from './ColorMath';
import {apca, fmtOklch, fromOklch, over, toCss, toOklch, toOklchCss, wcag} from './ColorMath';
import type {ColorSpec, PairKind} from './ContrastPairs';
import {CONTRAST_PAIRS, THRESHOLDS} from './ContrastPairs';
import type {ThemeKey, TunerOption, TunerRound, TunerSeed, VarMap} from './TunerRounds';
import {BASE, roundAppliesTo, ROUNDS, SEEDS} from './TunerRounds';

export type TunerView = 'rounds' | 'contrast' | 'vars' | 'export';

export interface Measurement {
    ratio: number;
    lc: number;
    fgCss: string;
    bgCss: string;
}

export interface WatchRow {
    label: string;
    kind: PairKind;
    shipped: Measurement;
    tuned: Measurement;
}

interface TunerState {
    picks: Record<string, string>;
    tweaks: Record<ThemeKey, VarMap>;
}

const STORAGE_KEY = 'themeTuner';
const STYLE_ID = 'tb-theme-tuner-vars';
const THEMES: ThemeKey[] = ['light', 'dark'];
const SECTIONS = uniq(CONTRAST_PAIRS.map(it => it.section));

/**
 * Dev-only tool for tuning Hoist's light and dark theme colors on a running app.
 *
 * Writes candidate values for `--xh-*` vars into a `<style>` element, grades a fixed list of
 * foreground and background pairs for contrast, and exports the result as SCSS. Candidates come
 * from a list of rounds, each one decision with a few options to flip between. Any var can also
 * be tweaked directly.
 *
 * Also reachable as `window.xhTuner`, so a value set can be loaded and read from the console.
 */
export class ThemeTunerModel extends HoistModel {
    readonly rounds: TunerRound[] = ROUNDS;
    readonly seeds: TunerSeed[] = SEEDS;

    @bindable accessor open: boolean = false;
    @bindable accessor view: TunerView = 'rounds';

    /** False to show the shipped theme, with every candidate value switched off. */
    @bindable accessor showTuned: boolean = true;
    @bindable accessor activeRoundId: string = ROUNDS[0].id;
    @bindable accessor failsOnly: boolean = false;

    /** Round id to picked option id. A round with no entry shows its shipped values. */
    @observableRef accessor picks: Record<string, string> = {};

    /** Direct edits per theme. These win over the picked options. */
    @observableRef accessor tweaks: Record<ThemeKey, VarMap> = {light: {}, dark: {}};

    @observableRef accessor watchRows: WatchRow[] = [];
    @observableRef accessor exportText: string = '';

    @observable accessor editVar: string = null;
    @observable accessor editValue: string = null;
    @observableRef accessor editColor: Rgba = null;

    @managed panelModel = new PanelModel({
        side: 'right',
        defaultSize: 420,
        minSize: 340,
        maxSize: 700,
        collapsible: false
    });

    @managed contrastGridModel: GridModel = this.createContrastGridModel();
    @managed varsGridModel: GridModel = this.createVarsGridModel();

    private styleEl: HTMLStyleElement;
    private probe: HTMLDivElement;
    private shippedCache: Record<string, Rgba> = {};
    private _allColorVars: string[];

    get theme(): ThemeKey {
        return XH.darkTheme ? 'dark' : 'light';
    }

    get activeRound(): TunerRound {
        return this.rounds.find(it => it.id === this.activeRoundId) ?? this.rounds[0];
    }

    get activeRoundIdx(): number {
        return this.rounds.indexOf(this.activeRound);
    }

    get activeOption(): TunerOption {
        const round = this.activeRound;
        return round.options.find(it => it.id === this.picks[round.id]);
    }

    get activeSeeds(): TunerSeed[] {
        const names = this.activeRound.seeds ?? [];
        return names.map(name => this.seeds.find(it => it.name === name));
    }

    @computed
    get hasChanges(): boolean {
        return !isEmpty(this.picks) || THEMES.some(t => !isEmpty(this.tweaks[t]));
    }

    /** Every `--xh-*` var in the loaded stylesheets that resolves to a color. */
    get allColorVars(): string[] {
        if (!this._allColorVars) this._allColorVars = this.findColorVars();
        return this._allColorVars;
    }

    constructor() {
        super();
        this.createDomSupport();
        this.loadState();
        window['xhTuner'] = this;

        this.addReaction(
            {
                track: () => [this.picks, this.tweaks, this.showTuned, this.open],
                run: () => {
                    this.applyCss();
                    this.saveState();
                    this.refreshMeasurements();
                },
                fireImmediately: true
            },
            {
                track: () => [XH.darkTheme, this.activeRoundId, this.view, this.failsOnly],
                run: () => {
                    this.saveState();
                    this.refreshMeasurements();
                }
            },
            {
                // Follow a theme switch made outside the tuner to that theme's first round.
                track: () => XH.darkTheme,
                run: () => {
                    const {theme, activeRound, rounds} = this;
                    if (roundAppliesTo(activeRound, theme)) return;
                    this.activeRoundId = rounds.find(it => it.theme === theme).id;
                },
                fireImmediately: true
            },
            {
                track: () => this.contrastGridModel.selectedRecord,
                run: rec => {
                    const fg = rec?.data.fg;
                    if (typeof fg === 'string' && fg.startsWith('--')) this.selectVar(fg);
                }
            },
            {
                track: () => this.varsGridModel.selectedRecord,
                run: rec => rec && this.selectVar(rec.data.name)
            }
        );
    }

    //------------------------------------------------------------------
    // Rounds and picks
    //------------------------------------------------------------------
    /** Activate a round and switch the app to the theme that round is about. */
    @action
    activateRound(id: string) {
        const round = this.rounds.find(it => it.id === id);
        if (!round) return;
        this.activeRoundId = id;
        if (!roundAppliesTo(round, this.theme)) XH.toggleTheme();
    }

    stepRound(delta: number) {
        const {rounds} = this,
            idx = (this.activeRoundIdx + delta + rounds.length) % rounds.length;
        this.activateRound(rounds[idx].id);
    }

    /** Pick an option for a round, or pass a null `optionId` to restore the shipped values. */
    @action
    pick(roundId: string, optionId: string) {
        const round = this.rounds.find(it => it.id === roundId);
        if (!round) return;

        // A pick replaces any direct edit to the vars that this round sets.
        const roundVars = round.options.flatMap(it => [
                ...Object.keys(it.vars),
                ...Object.values(it.varsByTheme ?? {}).flatMap(vars => Object.keys(vars))
            ]),
            tweaks = {...this.tweaks};
        THEMES.filter(theme => roundAppliesTo(round, theme)).forEach(theme => {
            tweaks[theme] = omit(tweaks[theme], roundVars);
        });
        this.tweaks = tweaks;
        this.picks = optionId ? {...this.picks, [roundId]: optionId} : omit(this.picks, roundId);
        this.showTuned = true;
    }

    /** Pick by position in the active round. Zero is the shipped values. */
    pickByIndex(idx: number) {
        const round = this.activeRound;
        if (idx > round.options.length) return;
        this.pick(round.id, idx === 0 ? null : round.options[idx - 1].id);
    }

    @action
    applyRecommended() {
        const picks = {};
        this.rounds.forEach(round => {
            const rec = round.options.find(it => it.recommended);
            if (rec) picks[round.id] = rec.id;
        });
        this.picks = picks;
        this.showTuned = true;
    }

    @action
    resetAll() {
        this.picks = {};
        this.tweaks = {light: {}, dark: {}};
    }

    //------------------------------------------------------------------
    // Direct edits
    //------------------------------------------------------------------
    @action
    setTweak(theme: ThemeKey, name: string, value: string) {
        const cur = this.tweaks[theme],
            next = value == null || value === '' ? omit(cur, name) : {...cur, [name]: value};
        this.tweaks = {...this.tweaks, [theme]: next};
        this.showTuned = true;
    }

    seedValue(seed: TunerSeed): number {
        return parseFloat(this.effectiveVars(this.theme)[seed.name]);
    }

    setSeed(seed: TunerSeed, value: number) {
        this.setTweak(this.theme, seed.name, String(+value.toFixed(3)));
    }

    /** True if the slider has moved the seed away from the value the picks give it. */
    seedIsTweaked(seed: TunerSeed): boolean {
        return this.tweaks[this.theme][seed.name] != null;
    }

    resetSeed(seed: TunerSeed) {
        this.setTweak(this.theme, seed.name, null);
    }

    /** Load a var into the editor on the Vars tab. */
    @action
    selectVar(name: string) {
        this.editVar = name;
        this.syncEditor();
    }

    setEditValue(value: string) {
        if (this.editVar) this.setTweak(this.theme, this.editVar, value);
    }

    /** Replace the edited var with an `oklch()` value, changing one channel. */
    setEditChannel(channel: 'l' | 'c' | 'h', value: number) {
        const {editVar, editColor} = this;
        if (!editVar || !editColor) return;
        const o = {...toOklch(editColor), [channel]: value},
            alpha = editColor.a < 0.9995 ? ` / ${+editColor.a.toFixed(3)}` : '';
        this.setTweak(
            this.theme,
            editVar,
            `oklch(${+o.l.toFixed(4)} ${+o.c.toFixed(4)} ${+(o.h ?? 0).toFixed(1)}${alpha})`
        );
    }

    clearEdit() {
        if (this.editVar) this.setTweak(this.theme, this.editVar, null);
    }

    get editIsTweaked(): boolean {
        return this.editVar != null && this.tweaks[this.theme][this.editVar] != null;
    }

    //------------------------------------------------------------------
    // State in and out
    //------------------------------------------------------------------
    getState(): TunerState {
        return {picks: this.picks, tweaks: this.tweaks};
    }

    @action
    setState(state: Partial<TunerState>) {
        this.picks = state.picks ?? {};
        this.tweaks = {light: {}, dark: {}, ...state.tweaks};
    }

    /** The graded pair list for the active theme, as plain objects. */
    report(): any[] {
        this.refreshMeasurementsNow();
        return this.contrastGridModel.store.allRecords.map(it => it.data);
    }

    //------------------------------------------------------------------
    // Candidate values
    //------------------------------------------------------------------
    /** The candidate values for a theme, with the source of each. */
    effectiveVarsWithSource(theme: ThemeKey): Record<string, {value: string; source: string}> {
        const ret = {},
            add = (vars: VarMap, source: string) =>
                forOwn(vars, (value, name) => (ret[name] = {value, source}));

        add(BASE[theme], 'Ramp');
        this.rounds.forEach(round => {
            if (!roundAppliesTo(round, theme)) return;
            const option = round.options.find(it => it.id === this.picks[round.id]);
            if (!option) return;
            add(
                {...option.vars, ...option.varsByTheme?.[theme]},
                `${round.title}: ${option.label}`
            );
        });
        add(this.tweaks[theme], 'Direct edit');
        return ret;
    }

    effectiveVars(theme: ThemeKey): VarMap {
        const ret = {};
        forOwn(this.effectiveVarsWithSource(theme), (v, name) => (ret[name] = v.value));
        return ret;
    }

    private applyCss() {
        const block = (theme: ThemeKey) =>
            Object.entries(this.effectiveVars(theme))
                .map(([name, value]) => `  ${name}: ${value};`)
                .join('\n');

        // Selectors match the specificity of an app-level override, and cover both themes so
        // that a light value never leaks into the dark theme.
        const LIGHT = 'body.xh-app:not(.xh-dark)',
            DARK = 'body.xh-app.xh-dark';
        this.styleEl.textContent =
            `${LIGHT} {\n${block('light')}\n}\n` +
            `${DARK} {\n${block('dark')}\n}\n` +
            `${LIGHT} {\n${this.pickedCss('light')}\n}\n` +
            `${DARK} {\n${this.pickedCss('dark')}\n}\n`;
        this.setSheetOn(this.showTuned);
    }

    /** The extra rules of the options picked for a theme. */
    private pickedCss(theme: ThemeKey): string {
        return this.rounds
            .filter(round => roundAppliesTo(round, theme))
            .map(round => round.options.find(it => it.id === this.picks[round.id])?.css)
            .filter(Boolean)
            .join('\n');
    }

    private setSheetOn(on: boolean) {
        this.styleEl.media = on ? 'all' : 'not all';
    }

    /** Run a function with the candidate values forced on or off, then restore. */
    private withSheet<T>(on: boolean, fn: () => T): T {
        this.setSheetOn(on);
        try {
            return fn();
        } finally {
            this.setSheetOn(this.showTuned);
        }
    }

    /** Run a function with the given theme's class on the body, then restore. */
    private withTheme<T>(theme: ThemeKey, fn: () => T): T {
        const {classList} = document.body,
            wasDark = classList.contains('xh-dark');
        classList.toggle('xh-dark', theme === 'dark');
        try {
            return fn();
        } finally {
            classList.toggle('xh-dark', wasDark);
        }
    }

    //------------------------------------------------------------------
    // Measurement
    //------------------------------------------------------------------
    /** Resolve one var name or CSS color to sRGB, under the styles in force right now. */
    readColor(spec: string): Rgba {
        const {probe} = this;
        probe.style.backgroundColor = '';
        probe.style.backgroundColor = spec.startsWith('--') ? `var(${spec})` : spec;
        return parseComputedColor(window.getComputedStyle(probe).backgroundColor);
    }

    resolveSpec(spec: ColorSpec): Rgba {
        if (!Array.isArray(spec)) return this.readColor(spec);
        return spec.map(it => this.readColor(it)).reduce((bg, layer) => over(layer, bg));
    }

    measure(fg: ColorSpec, bg: ColorSpec): Measurement {
        const bgColor = this.resolveSpec(bg);
        let fgColor = this.resolveSpec(fg);
        if (fgColor.a < 0.9995) fgColor = over(fgColor, bgColor);
        return {
            ratio: wcag(fgColor, bgColor),
            lc: apca(fgColor, bgColor),
            fgCss: toCss(fgColor),
            bgCss: toCss(bgColor)
        };
    }

    @debounced(120)
    private refreshMeasurements() {
        this.refreshMeasurementsNow();
    }

    @action
    private refreshMeasurementsNow() {
        if (!this.open) return;
        const {theme, activeRound} = this,
            pairs = CONTRAST_PAIRS,
            watch = roundAppliesTo(activeRound, theme) ? (activeRound.watch ?? []) : [];

        const measureAll = () => ({
            pairs: pairs.map(it => this.measure(it.fg, it.bg)),
            watch: watch.map(it => this.measure(it.fg, it.bg))
        });
        const tuned = this.withSheet(true, measureAll),
            shipped = this.withSheet(false, measureAll);

        this.watchRows = watch.map((it, i) => ({
            label: it.label,
            kind: it.kind,
            shipped: shipped.watch[i],
            tuned: tuned.watch[i]
        }));

        const rows = pairs.map((pair, i) => {
            const s = shipped.pairs[i],
                t = tuned.pairs[i],
                target = THRESHOLDS[pair.kind],
                passes = (m: Measurement) => target == null || m.ratio >= target;
            return {
                id: i,
                ...pair,
                target,
                shipped: s.ratio,
                tuned: t.ratio,
                lc: t.lc,
                fgCss: t.fgCss,
                bgCss: t.bgCss,
                shippedFgCss: s.fgCss,
                shippedBgCss: s.bgCss,
                status: target == null ? 'info' : passes(t) ? 'pass' : 'fail',
                change: passes(s) === passes(t) ? null : passes(t) ? 'fixed' : 'broken'
            };
        });
        this.contrastGridModel.loadData(
            this.failsOnly ? rows.filter(it => it.status === 'fail') : rows
        );

        this.varsGridModel.loadData(this.createVarRows(theme));
        this.syncEditor();
        if (this.view === 'export') this.exportText = this.createExport();
    }

    private createVarRows(theme: ThemeKey) {
        const vars = this.effectiveVarsWithSource(theme),
            names = Object.keys(vars),
            tuned = this.withSheet(true, () => names.map(it => this.readColor(it))),
            shipped = this.withSheet(false, () => names.map(it => this.readColor(it)));

        return names
            .map((name, i) => ({
                id: name,
                name,
                group: name.startsWith('--tn-') ? 'Ramp and seeds' : 'Theme vars',
                value: vars[name].value,
                source: vars[name].source,
                isColor: CSS.supports('color', vars[name].value) || tuned[i].a > 0,
                css: toCss(tuned[i]),
                shippedCss: name.startsWith('--tn-') ? null : toCss(shipped[i]),
                oklch: fmtOklch(tuned[i])
            }))
            .filter(it => it.isColor);
    }

    @action
    private syncEditor() {
        const {editVar} = this;
        if (!editVar) return;
        this.editValue =
            this.effectiveVars(this.theme)[editVar] ??
            window.getComputedStyle(document.body).getPropertyValue(editVar).trim();
        this.editColor = this.withSheet(true, () => this.readColor(editVar));
    }

    //------------------------------------------------------------------
    // Export
    //------------------------------------------------------------------
    /** SCSS for `styles/vars.scss`, with each changed var flattened to a literal color. */
    createExport(): string {
        const blocks = THEMES.map(theme => {
            const names = Object.keys(this.effectiveVars(theme)).filter(
                it => !it.startsWith('--tn-')
            );
            const lines = this.withTheme(theme, () => {
                const tuned = this.withSheet(true, () => names.map(it => this.readColor(it))),
                    shipped = this.withSheet(false, () => names.map(it => this.readColor(it)));
                return names
                    .map((name, i) => ({name, now: tuned[i], was: shipped[i]}))
                    .filter(it => toCss(it.now) !== toCss(it.was))
                    .map(
                        it =>
                            `  ${it.name}: ${toCss(it.now)}; // was ${toCss(it.was)} | ${toOklchCss(it.now)}`
                    );
            });
            const selector = theme === 'light' ? 'body' : 'body:where(.xh-dark)';
            return `// ${theme} theme - ${lines.length} vars\n${selector} {\n${lines.join('\n')}\n}`;
        });

        const state = JSON.stringify(this.getState(), null, 2);
        return `${blocks.join('\n\n')}\n\n/* Tuner state. Reload with xhTuner.setState(...)\n${state}\n*/\n`;
    }

    //------------------------------------------------------------------
    // Implementation
    //------------------------------------------------------------------
    private createDomSupport() {
        document.getElementById(STYLE_ID)?.remove();
        this.styleEl = document.createElement('style');
        this.styleEl.id = STYLE_ID;
        document.head.appendChild(this.styleEl);

        this.probe = document.createElement('div');
        this.probe.style.cssText = 'position:fixed;width:0;height:0;visibility:hidden;';
        document.body.appendChild(this.probe);
    }

    private findColorVars(): string[] {
        const names = new Set<string>();
        const visit = (rules: CSSRuleList) => {
            for (const rule of Array.from(rules)) {
                if (rule instanceof CSSStyleRule) {
                    if (!rule.selectorText.includes('body')) continue;
                    for (const prop of Array.from(rule.style)) {
                        if (prop.startsWith('--xh-')) names.add(prop);
                    }
                } else if ('cssRules' in rule) {
                    visit((rule as CSSGroupingRule).cssRules);
                }
            }
        };
        for (const sheet of Array.from(document.styleSheets)) {
            try {
                visit(sheet.cssRules);
            } catch (e) {
                // Cross-origin sheets cannot be read. They hold no Hoist vars.
            }
        }
        const style = window.getComputedStyle(document.body);
        return Array.from(names)
            .filter(it => CSS.supports('color', style.getPropertyValue(it).trim()))
            .sort();
    }

    private loadState() {
        const state = XH.localStorageService.get(STORAGE_KEY, {});
        this.picks = pickBy(state.picks ?? {}, (optionId, roundId) =>
            this.rounds.some(r => r.id === roundId && r.options.some(o => o.id === optionId))
        );
        this.tweaks = {light: {}, dark: {}, ...state.tweaks};
        this.open = !!state.open;
        if (this.rounds.some(it => it.id === state.activeRoundId)) {
            this.activeRoundId = state.activeRoundId;
        }
    }

    private saveState() {
        XH.localStorageService.set(STORAGE_KEY, {
            ...this.getState(),
            open: this.open,
            activeRoundId: this.activeRoundId
        });
    }

    private createContrastGridModel(): GridModel {
        return new GridModel({
            store: {
                idSpec: 'id',
                fields: [
                    'kind',
                    'fg',
                    'bg',
                    'target',
                    'fgCss',
                    'bgCss',
                    'shippedFgCss',
                    'shippedBgCss',
                    'change'
                ]
            },
            groupBy: 'section',
            groupSortFn: (a, b) => SECTIONS.indexOf(a) - SECTIONS.indexOf(b),
            sortBy: 'id',
            sizingMode: 'compact',
            emptyText: 'No failing pairs.',
            hideHeaders: false,
            columns: [
                {field: 'id', hidden: true},
                {field: 'section', hidden: true},
                {field: 'use', headerName: 'Pair', flex: 1, minWidth: 130},
                {
                    field: 'swatch',
                    headerName: '',
                    width: 76,
                    sortable: false,
                    renderer: (v, {record}) => pairSwatches(record.data)
                },
                {
                    field: 'shipped',
                    headerName: 'Was',
                    width: 56,
                    align: 'right',
                    renderer: v => fmtRatio(v)
                },
                {
                    field: 'tuned',
                    headerName: 'Now',
                    width: 56,
                    align: 'right',
                    renderer: (v, {record}) =>
                        span({
                            className: `tb-tuner__ratio tb-tuner__ratio--${record.data.status}`,
                            children: fmtRatio(v)
                        })
                },
                {
                    field: 'lc',
                    headerName: 'Lc',
                    headerTooltip: 'APCA lightness contrast. Advisory only.',
                    width: 46,
                    align: 'right',
                    renderer: v => Math.round(Math.abs(v))
                },
                {
                    field: 'status',
                    headerName: '',
                    width: 44,
                    align: 'center',
                    renderer: (v, {record}) => statusIcon(v, record.data.change)
                }
            ]
        });
    }

    private createVarsGridModel(): GridModel {
        return new GridModel({
            store: {idSpec: 'id', fields: ['value', 'css', 'shippedCss', 'isColor']},
            groupBy: 'group',
            sortBy: 'name',
            sizingMode: 'compact',
            emptyText: 'No candidate values for this theme yet.',
            columns: [
                {field: 'group', hidden: true},
                {
                    field: 'swatch',
                    headerName: '',
                    width: 60,
                    sortable: false,
                    renderer: (v, {record}) =>
                        div({
                            className: 'tb-tuner__swatches',
                            children: [
                                chip(record.data.shippedCss ?? record.data.css),
                                chip(record.data.css)
                            ]
                        })
                },
                {field: 'name', headerName: 'Var', flex: 1, minWidth: 140},
                {field: 'oklch', headerName: 'OKLCH', width: 110},
                {field: 'source', headerName: 'From', width: 110}
            ]
        });
    }
}

export function fmtRatio(v: number): string {
    return v == null ? '' : v.toFixed(v >= 10 ? 1 : 2);
}

function chip(background: string) {
    return div({className: 'tb-tuner__chip', style: {background}});
}

/** Shipped and tuned renderings of a pair, side by side. */
function pairSwatches(data: any) {
    const sample = (background: string, color: string) =>
        div({
            className: 'tb-tuner__chip tb-tuner__chip--sample',
            style: {background, color},
            children: ['body', 'sec'].includes(data.kind)
                ? 'Aa'
                : div({className: 'tb-tuner__chip-dot', style: {background: color}})
        });
    return div({
        className: 'tb-tuner__swatches',
        children: [sample(data.shippedBgCss, data.shippedFgCss), sample(data.bgCss, data.fgCss)]
    });
}

function statusIcon(status: string, change: string) {
    const title =
        change === 'fixed'
            ? 'Fixed by the tuned values'
            : change === 'broken'
              ? 'Passed before, fails now'
              : null;
    switch (status) {
        case 'pass':
            return Icon.check({intent: 'success', prefix: change ? 'fas' : 'far', title});
        case 'fail':
            return Icon.warning({intent: 'danger', prefix: change ? 'fas' : 'far', title});
        default:
            return null;
    }
}

/** Parse a computed CSS color. Chrome reports `rgb()`, `color(srgb ...)` or `oklch()`. */
function parseComputedColor(css: string): Rgba {
    const nums = (css.match(/-?[\d.]+(?:e-?\d+)?%?/g) ?? []).map(it =>
        it.endsWith('%') ? parseFloat(it) / 100 : parseFloat(it)
    );
    const alpha = nums[3] ?? 1;
    if (css.startsWith('rgb')) return {r: nums[0], g: nums[1], b: nums[2], a: alpha};
    if (css.startsWith('color(srgb')) {
        return {r: nums[0] * 255, g: nums[1] * 255, b: nums[2] * 255, a: alpha};
    }
    if (css.startsWith('oklch')) {
        const {r, g, b} = fromOklch({l: nums[0], c: nums[1], h: nums[2]}, alpha);
        return {r, g, b, a: alpha};
    }
    return {r: 0, g: 0, b: 0, a: 0};
}
