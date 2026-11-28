import type {ColorSpec, PairKind} from './ContrastPairs';

export type ThemeKey = 'light' | 'dark';

/** The theme a round is about. A round for both themes sets the same values in each. */
export type RoundTheme = ThemeKey | 'both';

export function roundAppliesTo(round: TunerRound, theme: ThemeKey): boolean {
    return round.theme === 'both' || round.theme === theme;
}

/** CSS custom property name to value. Values can be any CSS, including `var()` and `calc()`. */
export type VarMap = Record<string, string>;

/** A numeric custom property that the neutral ramp reads, exposed as a slider. */
export interface TunerSeed {
    name: string;
    label: string;
    help: string;
    min: number;
    max: number;
    step: number;
    themes: ThemeKey[];
}

export interface TunerOption {
    id: string;
    label: string;
    note: string;
    /** True for the option proposed as the starting point. */
    recommended?: boolean;
    vars: VarMap;
    /** Values that differ by theme, for an option in a round for both themes. */
    varsByTheme?: Partial<Record<ThemeKey, VarMap>>;
    /**
     * Extra rules, for a structural change that vars cannot express. The tuner nests them under
     * the body selector of the round's theme.
     */
    css?: string;
}

export interface WatchPair {
    label: string;
    fg: ColorSpec;
    bg: ColorSpec;
    kind: PairKind;
}

/** Topics for grouping rounds in the picker, in display order. */
export const TOPICS = [
    'Neutrals and text',
    'Surfaces',
    'Grids and trees',
    'Charts',
    'Inputs and forms',
    'Intents and toasts',
    'Buttons',
    'Demos'
] as const;

export type TunerTopic = (typeof TOPICS)[number];

/** One decision, shown as a set of options to flip between. */
export interface TunerRound {
    id: string;
    theme: RoundTheme;
    topic: TunerTopic;
    title: string;
    why: string;
    lookAt: string;
    options: TunerOption[];
    seeds?: string[];
    watch?: WatchPair[];
}

export const SEEDS: TunerSeed[] = [
    {
        name: '--xh-neutral-hue',
        label: 'Neutral hue',
        help: 'OKLCH hue shared by every neutral. 232 is the slate blue Hoist uses today.',
        min: 0,
        max: 360,
        step: 1,
        themes: ['light', 'dark']
    },
    {
        name: '--xh-neutral-tint',
        label: 'Neutral tint',
        help: 'Chroma multiplier for every neutral. 0 is pure gray.',
        min: 0,
        max: 3,
        step: 0.05,
        themes: ['light', 'dark']
    },
    {
        name: '--xh-neutral-depth',
        label: 'Surface depth',
        help: 'Lightness added to every dark surface and border. Text is not moved.',
        min: -0.04,
        max: 0.1,
        step: 0.005,
        themes: ['dark']
    }
];

//------------------------------------------------------------------
// Neutral ramps and their seeds. Hoist defines these in `styles/vars.scss`. This copy must match
// it. The tuner holds a copy so each step and seed can be edited and reset. They change nothing
// until a round option points an --xh-* var at them.
//------------------------------------------------------------------
const RAMP_VAR = /^--xh-neutral-(hue|tint|depth|\d+)$/;

/** True for a step or a seed of the neutral ramp. */
export function isRampVar(name: string): boolean {
    return RAMP_VAR.test(name);
}

const LEGACY_VARS: Record<string, string> = {
    '--tn-h': '--xh-neutral-hue',
    '--tn-c': '--xh-neutral-tint',
    '--tn-d': '--xh-neutral-depth'
};

/** The current name of a ramp var, for state saved before the ramp moved into Hoist. */
export function currentVarName(name: string): string {
    return LEGACY_VARS[name] ?? name.replace(/^--tn-(\d+)$/, '--xh-neutral-$1');
}

const n = (l: number, c: number) =>
    `oklch(${l} calc(${c} * var(--xh-neutral-tint)) var(--xh-neutral-hue))`;
const d = (l: number, c: number) =>
    `oklch(calc(${l} + var(--xh-neutral-depth)) calc(${c} * var(--xh-neutral-tint)) var(--xh-neutral-hue))`;

export const BASE: Record<ThemeKey, VarMap> = {
    light: {
        '--xh-neutral-hue': '232',
        '--xh-neutral-tint': '1',
        '--xh-neutral-1': n(0.985, 0.002), // stripe, subtle fill
        '--xh-neutral-2': n(0.968, 0.004), // chrome: toolbars, app bar, sidebars
        '--xh-neutral-3': n(0.94, 0.006), // hover fill, tracks
        '--xh-neutral-4': n(0.915, 0.007), // hairlines
        '--xh-neutral-5': n(0.87, 0.009), // quiet border
        '--xh-neutral-6': n(0.8, 0.012), // defined border
        '--xh-neutral-7': n(0.63, 0.016), // control outline, 3:1 on white
        '--xh-neutral-8': n(0.53, 0.02), // muted text, 4.5:1 on chrome
        '--xh-neutral-9': n(0.45, 0.025), // secondary text
        '--xh-neutral-10': n(0.31, 0.02), // body text
        '--xh-neutral-11': n(0.24, 0.018) // strong text
    },
    dark: {
        '--xh-neutral-hue': '232',
        '--xh-neutral-tint': '1',
        '--xh-neutral-depth': '0',
        '--xh-neutral-0': d(0.155, 0.008), // sunken: tracks, wells
        '--xh-neutral-1': d(0.19, 0.01), // app background
        '--xh-neutral-2': d(0.215, 0.011), // stripe
        '--xh-neutral-3': d(0.245, 0.013), // chrome: toolbars, app bar, sidebars
        '--xh-neutral-4': d(0.285, 0.015), // raised, hover fill
        '--xh-neutral-5': d(0.33, 0.016), // hairlines
        '--xh-neutral-6': d(0.39, 0.018), // border
        '--xh-neutral-7': d(0.55, 0.02), // control outline, 3:1 on chrome
        '--xh-neutral-8': n(0.72, 0.018), // muted text
        '--xh-neutral-9': n(0.8, 0.015), // secondary text
        '--xh-neutral-10': n(0.94, 0.008), // body text
        '--xh-neutral-11': n(0.98, 0.004) // strong text
    }
};

const lightNeutrals: VarMap = {
    '--xh-bg-alt': 'var(--xh-neutral-2)',
    '--xh-panel-collapsed-strip-bg': 'var(--xh-neutral-2)',
    '--xh-panel-collapsed-strip-hover-bg': 'var(--xh-neutral-4)',
    '--xh-resizable-bg': 'var(--xh-neutral-2)',
    '--xh-resizable-border-color': 'var(--xh-neutral-5)',
    '--xh-loading-indicator-bg': 'var(--xh-neutral-4)'
};

const lightSecondaryText: VarMap = {
    // Deliberately quieter than other secondary text: a hint, not a label.
    '--xh-input-placeholder-text-color': 'var(--xh-neutral-7)',
    '--xh-neutral-val-color': 'var(--xh-neutral-8)',
    '--xh-menu-heading-text-color': 'var(--xh-neutral-9)',
    '--xh-separator-label-text-color': 'var(--xh-neutral-9)',
    '--xh-property-table-label-text-color': 'var(--xh-neutral-9)',
    '--xh-property-table-empty-text-color': 'var(--xh-neutral-9)',
    '--xh-panel-collapsed-strip-icon-color': 'var(--xh-neutral-9)',
    '--xh-loading-indicator-text-color': 'var(--xh-neutral-9)'
};

const lightGridGroup: VarMap = {
    '--xh-grid-group-bg': n(0.54, 0.03),
    '--xh-grid-group-border-color': 'var(--xh-neutral-6)'
};

const darkSurfaces: VarMap = {
    '--xh-bg': 'var(--xh-neutral-1)',
    '--xh-bg-alt': 'var(--xh-neutral-3)',
    '--xh-toolbar-bg': 'var(--xh-neutral-3)',
    '--xh-grid-odd-row-bg': 'var(--xh-neutral-2)',
    '--xh-panel-collapsed-strip-bg': 'var(--xh-neutral-3)',
    '--xh-panel-collapsed-strip-hover-bg': 'var(--xh-neutral-4)',
    '--xh-resizable-bg': 'var(--xh-neutral-4)',
    '--xh-resizable-border-color': 'var(--xh-neutral-3)',
    '--xh-dash-canvas-grid-cell-color': 'var(--xh-neutral-0)',
    '--xh-loading-indicator-bg': 'var(--xh-neutral-5)'
};

const darkSecondaryText: VarMap = {
    '--xh-text-color-muted': 'var(--xh-neutral-8)',
    '--xh-input-placeholder-text-color': n(0.64, 0.018),
    '--xh-menu-heading-text-color': 'var(--xh-neutral-9)',
    '--xh-loading-indicator-text-color': 'var(--xh-neutral-9)',
    '--xh-panel-collapsed-strip-icon-color': 'var(--xh-neutral-8)',
    '--xh-panel-splitter-button-icon-color': 'var(--xh-neutral-9)'
};

/** Both edges of an input outline, in one color. */
function outline(color: string): VarMap {
    return {
        '--xh-form-field-box-shadow-color-top': color,
        '--xh-form-field-box-shadow-color-bottom': color
    };
}

/**
 * Colors for a full-width group row. The fill needs more chroma than the neutral ramp gives, and a
 * lightness apart from the hovered and selected rows, or it reads as a warm gray among blue rows.
 */
function groupRow(bg: string, text: string, border: string): VarMap {
    return {
        '--xh-grid-group-bg': bg,
        '--xh-grid-group-text-color': text,
        '--xh-grid-group-border-color': border
    };
}

function groupRowWatch(): WatchPair[] {
    return [
        {
            label: 'Group row label',
            fg: '--xh-grid-group-text-color',
            bg: '--xh-grid-group-bg',
            kind: 'body'
        },
        {label: 'Group row vs row', fg: '--xh-grid-group-bg', bg: '--xh-grid-bg', kind: 'info'}
    ];
}

function treeWatch(): WatchPair[] {
    return [
        {
            label: 'Open top level vs row',
            fg: '--xh-grid-tree-group-bg',
            bg: '--xh-grid-bg',
            kind: 'info'
        },
        {
            label: 'Selected vs open top level',
            fg: '--xh-grid-row-selected-bg',
            bg: '--xh-grid-tree-group-bg',
            kind: 'info'
        },
        {
            label: 'Text on open top level',
            fg: '--xh-grid-text-color',
            bg: '--xh-grid-tree-group-bg',
            kind: 'body'
        }
    ];
}

/** Colors for panel and dialog title bars. */
function title(bg: string, text: string): VarMap {
    return {'--xh-title-bg': bg, '--xh-title-text-color': text};
}

function widgetTitle(bg: string, text: string): VarMap {
    return {
        '--xh-dash-canvas-widget-title-bg': bg,
        '--xh-dash-canvas-widget-title-text-color': text
    };
}

// Hue per level for the `colors` tree style. The dark order steps from blue through violet and
// red, as shipped. The light order puts green, yellow and orange on levels two to four.
const DARK_TREE_HUES = [235, 275, 320, 5, 50, 105];
const LIGHT_TREE_HUES = [235, 145, 100, 65, 285, 350];

/** Per-level fills for the `colors` tree style in the dark theme, at one lightness and chroma. */
function darkTreeLevels(l: number, c: number, hues: number[] = DARK_TREE_HUES): VarMap {
    return Object.fromEntries(
        hues.map((hue, level) => [
            `--xh-grid-tree-group-level-${level}-bg`,
            `oklch(calc(${l} + var(--xh-neutral-depth)) ${c} ${hue})`
        ])
    );
}

function titleWatch(): WatchPair[] {
    return [
        {label: 'Title text', fg: '--xh-title-text-color', bg: '--xh-title-bg', kind: 'body'},
        {label: 'Title bar vs page', fg: '--xh-title-bg', bg: '--xh-bg', kind: 'info'},
        {label: 'Title bar vs toolbar', fg: '--xh-title-bg', bg: '--xh-bg-alt', kind: 'info'}
    ];
}

/** Thumb shape, with a hover color mixed from the thumb and the text color. */
function thumbShape(radius: string, inset: string): VarMap {
    return {
        '--xh-scrollbar-thumb-border-radius': radius,
        '--xh-scrollbar-thumb-inset': inset,
        '--xh-scrollbar-thumb-hover-color':
            'color-mix(in oklch, var(--xh-scrollbar-thumb-color), var(--xh-text-color) 30%)'
    };
}

const SEL_HUE = 245;

/** Vars for the ten chart series slots. Colors repeat from the start when fewer are given. */
function chartColors(colors: string[]): VarMap {
    const ret = {};
    for (let i = 0; i < 10; i++) ret[`--xh-chart-color-${i + 1}`] = colors[i % colors.length];
    return ret;
}

function chartWatch(): WatchPair[] {
    return [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
        label: `Series ${i} vs page`,
        fg: `--xh-chart-color-${i}`,
        bg: '--xh-bg',
        kind: 'info'
    }));
}

//------------------------------------------------------------------
// Intents
//------------------------------------------------------------------
type IntentName = 'primary' | 'success' | 'warning' | 'danger';

// Lightness of intent text in each theme. One value for every intent gives each the same contrast.
const INTENT_TEXT_L: Record<ThemeKey, number> = {light: 0.48, dark: 0.76};

// Label color on a solid warning surface. White unless an option says otherwise.
const ON_WARNING = 'var(--tn-on-warning, #fff)';

/**
 * Every role of one intent, derived from its fill color with relative color syntax. The role
 * names are the ones Hoist ships today, so every component follows.
 */
function intentVars(intent: IntentName, theme: ThemeKey, fill: string, text?: string): VarMap {
    const name = `--xh-intent-${intent}`,
        from = (l: string | number, c = 'c') => `oklch(from var(${name}) ${l} ${c} h)`,
        textL = INTENT_TEXT_L[theme],
        dark = theme === 'dark';
    return {
        [name]: fill,
        [`${name}-darker`]: from('calc(l - 0.05)'),
        [`${name}-darkest`]: from('calc(l - 0.1)'),
        [`${name}-lighter`]: dark ? (text ?? from(textL)) : from(0.86, 'calc(c * 0.45)'),
        [`${name}-lightest`]: dark ? from(0.84) : from(0.95, 'calc(c * 0.2)'),
        [`${name}-trans1`]: `rgb(from var(${name}) r g b / var(--xh-intent-a1))`,
        [`${name}-trans2`]: `rgb(from var(${name}) r g b / var(--xh-intent-a2))`,
        [`${name}-text-color`]: text ?? from(textL)
    };
}

function intentWatch(intent: IntentName, label = '#fff'): WatchPair[] {
    const name = `--xh-intent-${intent}`,
        text = `${name}-text-color`;
    return [
        {label: 'Label on fill', fg: label, bg: name, kind: 'body'},
        {label: 'Label on hover', fg: label, bg: `${name}-darker`, kind: 'body'},
        {label: 'Text on page', fg: text, bg: '--xh-bg', kind: 'body'},
        {label: 'Text on toolbar', fg: text, bg: '--xh-bg-alt', kind: 'body'},
        {label: 'Text on its tint', fg: text, bg: ['--xh-bg', `${name}-trans1`], kind: 'body'},
        {label: 'Fill vs page', fg: name, bg: '--xh-bg', kind: 'ui'}
    ];
}

// A bright warning fill takes a dark label. Outlined and minimal buttons take the text color,
// because the hover shade they use today is too light to read.
const AMBER_LABEL_CSS = [
    '.xh-button.xh-button--intent-warning.xh-button--standard,',
    '.xh-button.xh-button--intent-warning.xh-button--standard svg {',
    '  color: var(--tn-on-warning) !important;',
    '}'
].join('\n');

const INTENT_LOOK_AT = 'Components > Buttons, then Components > Callout.';

// Paint toasts from the Hoist intents. Today they use fixed colors that no theme var reaches.
const TOAST_INTENT_CSS = (['primary', 'success', 'warning', 'danger'] as IntentName[])
    .map(it => {
        const toast = `.xh-toast.xh-toast--intent-${it}`,
            color = `var(--xh-intent-${it}`;
        return [
            `${toast}, ${toast} .xh-button { background-color: ${color}) !important; }`,
            `${toast} .xh-button:hover { background-color: ${color}-darker) !important; }`,
            `${toast} .xh-button:active { background-color: ${color}-darkest) !important; }`
        ].join('\n');
    })
    .join('\n');

const TOAST_ROUND: TunerRound = {
    id: 'toasts',
    theme: 'both',
    topic: 'Intents and toasts',
    title: 'Toasts follow the intents',
    why:
        'Toasts use four fixed colors left over from Blueprint. No Hoist var reaches them, so ' +
        'a success toast and a success button are different greens. This option paints toasts ' +
        'from the intent colors.',
    lookAt: 'System > Toast. Show one of each intent, next to a button of that intent.',
    options: [
        {
            id: 'intents',
            label: 'Intent colors',
            note: 'A toast takes the fill color of its intent.',
            recommended: true,
            vars: {},
            css: TOAST_INTENT_CSS
        }
    ]
};

//------------------------------------------------------------------
// Form fields
//------------------------------------------------------------------
const FORM_LOOK_AT = 'Forms + Inputs > FormModel. Press Submit on the empty form to see errors.';

// One line for the outline, with no second soft line under the top edge.
const FLAT_OUTLINE: VarMap = {
    '--xh-form-field-box-shadow': 'inset 0 0 0 1px var(--xh-form-field-box-shadow-color-top)'
};

const INPUT_HOVER_CSS = [
    ':is(.xh-input-group__input, .xh-text-area):hover:not(:focus):not(:disabled),',
    '.xh-select__control:hover:not(.xh-select__control--is-focused) {',
    '  box-shadow: inset 0 0 0 1px',
    '    color-mix(in oklch, var(--xh-form-field-box-shadow-color-top), var(--xh-text-color) 30%);',
    '}'
].join('\n');

// A label keeps its own color when its field has a message. The required marker takes the color.
const QUIET_INVALID_CSS = [
    '.xh-form-field:is(.xh-form-field--invalid, .xh-form-field--warning, .xh-form-field--info)',
    '  .xh-form-field__label {',
    '  color: var(--xh-form-field-label-text-color);',
    '}',
    '.xh-form-field--invalid:not(.xh-form-field--readonly) .xh-form-field__required-indicator {',
    '  color: var(--xh-form-field-invalid-text-color);',
    '}'
].join('\n');

// A field set with a message keeps its neutral border. Its title still takes the intent color.
const QUIET_SETS_CSS = [
    QUIET_INVALID_CSS,
    '.xh-card:is(.xh-card--intent-danger, .xh-card--intent-warning):has(.xh-form-field) {',
    '  border-color: var(--xh-card-border-color);',
    '}'
].join('\n');

const TINTED_INVALID_CSS = [
    QUIET_SETS_CSS,
    '.xh-form-field--invalid:not(.xh-form-field--readonly)',
    '  :is(.xh-input-group__input, .xh-text-area, .xh-select__control) {',
    '  background-color: var(--xh-intent-danger-trans1);',
    '}'
].join('\n');

// One focus color for both themes. At this lightness it is 3:1 or better on a light and a dark page.
const FOCUS_COLOR = 'oklch(from var(--xh-intent-primary) 0.6 max(c, 0.13) h)';

function focusVars(fieldShadow: string): VarMap {
    return {
        '--xh-focus-outline-color': FOCUS_COLOR,
        '--xh-focus-outline-width': '2px',
        '--xh-focus-outline-offset': '-2px',
        '--xh-focus-outline': 'var(--xh-focus-outline-width) solid var(--xh-focus-outline-color)',
        '--xh-form-field-focused-box-shadow': fieldShadow
    };
}

const FORM_ROUNDS: TunerRound[] = [
    {
        id: 'form-labels',
        theme: 'both',
        topic: 'Inputs and forms',
        title: 'Form field labels',
        why:
            'A label is 13px regular in the text color: the same as the value under it, so a ' +
            'form reads as one block of text. Toolbox restyles its labels in three places, ' +
            'which says the default is not good enough. These options give the label its own ' +
            'voice. Sentence case keeps units and acronyms as typed. Small caps is the look ' +
            'Toolbox uses, but it turns "mm" into "MM".',
        lookAt: FORM_LOOK_AT,
        options: [
            {
                id: 'medium',
                label: 'Medium',
                note: 'A little smaller and heavier than the value, in a softer color. Sentence case.',
                recommended: true,
                vars: {
                    '--xh-form-field-label-font-size': 'calc(var(--xh-font-size) * 0.92)',
                    '--xh-form-field-label-font-weight': '500',
                    '--xh-form-field-label-text-color': 'var(--xh-neutral-9)'
                }
            },
            {
                id: 'caps',
                label: 'Small caps',
                note: 'Small, uppercase and muted, with open spacing. The Toolbox look, as the default.',
                vars: {
                    '--xh-form-field-label-font-size': 'calc(var(--xh-font-size) * 0.85)',
                    '--xh-form-field-label-font-weight': '600',
                    '--xh-form-field-label-text-color': 'var(--xh-text-color-muted)',
                    '--xh-form-field-label-text-transform': 'uppercase'
                },
                css: '.xh-form-field__label { letter-spacing: 0.05em; }'
            },
            {
                id: 'strong',
                label: 'Strong',
                note: 'Same size as the value, semibold, in the text color.',
                vars: {
                    '--xh-form-field-label-font-weight': '600'
                }
            },
            {
                id: 'caps-tight',
                label: 'Small caps, tight',
                note: 'Small caps at medium weight with less spacing, so labels run narrower.',
                vars: {
                    '--xh-form-field-label-font-size': 'calc(var(--xh-font-size) * 0.85)',
                    '--xh-form-field-label-font-weight': '500',
                    '--xh-form-field-label-text-color': 'var(--xh-text-color-muted)',
                    '--xh-form-field-label-text-transform': 'uppercase'
                },
                css: '.xh-form-field__label { letter-spacing: 0.02em; }'
            }
        ],
        watch: [
            {
                label: 'Label on page',
                fg: '--xh-form-field-label-text-color',
                bg: '--xh-bg',
                kind: 'body'
            }
        ]
    },
    {
        id: 'form-rhythm',
        theme: 'both',
        topic: 'Inputs and forms',
        title: 'Field spacing and messages',
        why:
            'Fields sit 10px apart, with the label 3px above its input. Validation and help ' +
            'messages are 10.4px, the smallest text in Hoist. These options open the rhythm a ' +
            'little and bring messages up to a readable size.',
        lookAt: FORM_LOOK_AT,
        options: [
            {
                id: 'roomy',
                label: 'Roomier',
                note: 'Fields 14px apart, label 5px above its input, messages at 11.5px.',
                recommended: true,
                vars: {
                    '--xh-form-field-margin': '0 0 14px 0',
                    '--xh-form-field-label-margin': '0 0 5px 0',
                    '--xh-form-field-message-font-size': 'calc(var(--xh-font-size) * 0.885)',
                    '--xh-form-field-message-margin': '4px 0 0 0'
                }
            },
            {
                id: 'messages',
                label: 'Messages only',
                note: 'Spacing as shipped. Messages at 11.5px.',
                vars: {
                    '--xh-form-field-message-font-size': 'calc(var(--xh-font-size) * 0.885)'
                }
            }
        ]
    },
    {
        id: 'form-invalid',
        theme: 'both',
        topic: 'Inputs and forms',
        title: 'Invalid fields',
        why:
            'An invalid field turns its label, its outline and its message red. A form with ' +
            'several errors becomes a wall of red, and the label stops reading as a stable ' +
            'name. A field set with an error also turns its whole border red. These options ' +
            'keep the label in its own color.',
        lookAt: FORM_LOOK_AT,
        options: [
            {
                id: 'quiet',
                label: 'Outline and message',
                note: 'The label keeps its color. The outline, message and required marker are red.',
                recommended: true,
                vars: {},
                css: QUIET_INVALID_CSS
            },
            {
                id: 'sets',
                label: 'Quiet field sets too',
                note: 'As above. A field set with an invalid field keeps its neutral border, and only its title turns red.',
                css: QUIET_SETS_CSS,
                vars: {}
            },
            {
                id: 'tinted',
                label: 'Tinted field',
                note: 'As above, and the input takes a faint red fill.',
                vars: {},
                css: TINTED_INVALID_CSS
            }
        ]
    },
    {
        id: 'form-input-shape',
        theme: 'both',
        topic: 'Inputs and forms',
        title: 'Input outline shape',
        why:
            'An input draws its outline as two inset shadows: a 1px line, and a second soft ' +
            'line under the top edge. That second line dates from the inset look of older ' +
            'toolkits and makes the top edge heavier. An input also gives no sign on hover.',
        lookAt: 'Forms + Inputs > FormModel. Move the pointer over the inputs.',
        options: [
            {
                id: 'hover',
                label: 'Flat, with hover',
                note: 'One even line. It darkens when the pointer is over the input.',
                recommended: true,
                vars: FLAT_OUTLINE,
                css: INPUT_HOVER_CSS
            },
            {
                id: 'flat',
                label: 'Flat',
                note: 'One even line, with no hover change.',
                vars: FLAT_OUTLINE
            }
        ]
    },
    {
        id: 'form-focus',
        theme: 'both',
        topic: 'Inputs and forms',
        title: 'Focus ring',
        why:
            'A focused input swaps its 1px outline for a blue at 60% opacity. It measures ' +
            '2.36:1 on the page in light and 2.22:1 in dark, and WCAG asks for 3:1. The same ' +
            'color draws the keyboard focus outline on buttons and grid cells, half a pixel ' +
            'wide. These options use one solid blue, derived from the primary intent, that ' +
            'passes on both themes.',
        lookAt: 'Forms + Inputs > FormModel. Click into an input, then press Tab through the form.',
        options: [
            {
                id: 'solid',
                label: 'Solid ring',
                note:
                    'A 2px ring inside the edge. It cannot be clipped by a toolbar or a grid. The ring on buttons ' +
                    'in compact toolbars is clipped, a known issue for later toolbar work.',
                recommended: true,
                vars: focusVars('inset 0 0 0 2px var(--xh-form-field-focused-border-color)')
            },
            {
                id: 'halo',
                label: 'Halo',
                note: 'A 1px line with a soft 3px glow outside the edge.',
                vars: focusVars(
                    'inset 0 0 0 1px var(--xh-form-field-focused-border-color), ' +
                        '0 0 0 3px color-mix(in oklch, var(--xh-form-field-focused-border-color) 30%, transparent)'
                )
            }
        ],
        watch: [
            {
                label: 'Focus ring vs page',
                fg: '--xh-form-field-focused-border-color',
                bg: '--xh-bg',
                kind: 'ui'
            },
            {
                label: 'Focus ring vs toolbar',
                fg: '--xh-form-field-focused-border-color',
                bg: '--xh-bg-alt',
                kind: 'ui'
            }
        ]
    }
];

//------------------------------------------------------------------
// Brand seeds
//------------------------------------------------------------------
/** A whole-theme preset: the two seeds of the neutral ramp, and a light title bar that follows them. */
function brandPreset(
    hue: number,
    tint: number,
    titleBg: string = n(0.522, 0.036)
): Pick<TunerOption, 'vars' | 'varsByTheme'> {
    return {
        vars: {'--xh-neutral-hue': String(hue), '--xh-neutral-tint': String(tint)},
        varsByTheme: {light: title(titleBg, 'white')}
    };
}

// One caps recipe for short structural text. Hoist ships caps on menu headings and vertical tab group
// headers today, each with its own spacing.
const CAPS_SPACING = '0.02em';
const CAPS_SIZE = 0.85;
const capsRule = (selector: string) =>
    `${selector} { text-transform: uppercase; letter-spacing: ${CAPS_SPACING}; }`;

const CAPS_LABEL_VARS: VarMap = {
    '--xh-form-field-label-font-size': `calc(var(--xh-font-size) * ${CAPS_SIZE})`,
    '--xh-form-field-label-font-weight': '600',
    '--xh-form-field-label-text-color': 'var(--xh-text-color-muted)',
    '--xh-form-field-label-text-transform': 'uppercase',
    '--xh-stat-card-title-text-transform': 'uppercase',
    '--xh-stat-card-title-letter-spacing': CAPS_SPACING,
    '--xh-card-header-font-size': `calc(var(--xh-font-size) * ${CAPS_SIZE})`,
    '--xh-card-header-font-weight': '600',
    '--xh-menu-heading-letter-spacing': CAPS_SPACING,
    '--xh-tab-switcher-vertical-group-header-letter-spacing': CAPS_SPACING
};
const CAPS_LABEL_CSS = [
    `.xh-form-field__label { letter-spacing: ${CAPS_SPACING}; }`,
    capsRule('.xh-card__header')
].join('\n');
const CAPS_GRID_CSS = capsRule('.xh-grid-header, .ag-header-group-text');
const CAPS_TOOLBAR_CSS = capsRule('.xh-toolbar--compact .xh-button');

const CAPS_ROUND: TunerRound = {
    id: 'caps-style',
    theme: 'both',
    topic: 'Demos',
    title: 'A shared caps style',
    why:
        'Sentence case stays the default for form labels. This round previews an opt-in: one ' +
        'caps recipe that an app turns on once, so every label-like element changes together. ' +
        'Hoist already ships caps on menu headings and vertical tab group headers. Caps suit ' +
        'short, fixed text. They erase case in units and codes, so "mm" becomes "MM".',
    lookAt:
        'Forms + Inputs > FormModel, then a grid, then Components > Buttons for the compact ' +
        'toolbar.',
    options: [
        {
            id: 'labels',
            label: 'Labels and titles',
            note: 'Form labels, card titles and stat card titles join menu and tab group headings.',
            vars: CAPS_LABEL_VARS,
            css: CAPS_LABEL_CSS
        },
        {
            id: 'grid',
            label: 'Plus grid headers',
            note: 'Also sets grid column headers in caps.',
            vars: CAPS_LABEL_VARS,
            css: [CAPS_LABEL_CSS, CAPS_GRID_CSS].join('\n')
        },
        {
            id: 'toolbar',
            label: 'Plus compact toolbar buttons',
            note: 'Also sets buttons in compact toolbars in caps.',
            vars: CAPS_LABEL_VARS,
            css: [CAPS_LABEL_CSS, CAPS_GRID_CSS, CAPS_TOOLBAR_CSS].join('\n')
        }
    ],
    watch: []
};

const BRAND_ROUND: TunerRound = {
    id: 'brand-seeds',
    theme: 'both',
    topic: 'Demos',
    title: 'One more thing: a theme from two numbers',
    why:
        'Every neutral in the tuned theme comes from one ramp, and the ramp reads two ' +
        'numbers: a hue and a tint strength. These presets change only those two numbers. ' +
        'They are not looks proposed for Hoist. They show what a client app could do with ' +
        'two vars: its own chrome in both themes, on the same lightness steps, so the ' +
        'contrast grades hold.',
    lookAt: 'Any busy page, in both themes. Try the sliders below for values in between.',
    seeds: ['--xh-neutral-hue', '--xh-neutral-tint'],
    options: [
        {
            id: 'graphite',
            label: 'Graphite',
            note: 'Almost no tint. A neutral, hard-edged gray.',
            ...brandPreset(255, 0.3)
        },
        {
            id: 'navy',
            label: 'Navy',
            note: 'A bluer hue at nearly twice the tint.',
            ...brandPreset(256, 1.9)
        },
        {
            id: 'stone',
            label: 'Stone',
            note: 'A warm gray, for a brand with warm colors.',
            ...brandPreset(65, 0.9)
        },
        {
            id: 'forest',
            label: 'Forest',
            note: 'A green-gray from the hue of #004912, with that green as the light title bar.',
            ...brandPreset(146, 1, '#004912')
        }
    ],
    watch: [
        {label: 'Text on page', fg: '--xh-text-color', bg: '--xh-bg', kind: 'body'},
        {label: 'Muted on toolbar', fg: '--xh-text-color-muted', bg: '--xh-bg-alt', kind: 'sec'},
        {label: 'Title text', fg: '--xh-title-text-color', bg: '--xh-title-bg', kind: 'body'},
        {label: 'Toolbar vs page', fg: '--xh-bg-alt', bg: '--xh-bg', kind: 'info'}
    ]
};

// Standard buttons and the neutral intent, on the hue and tint of the neutral ramp. Each gray keeps
// the lightness that Hoist ships, so only its tint moves.
const BUTTON_ROUND: TunerRound = {
    id: 'buttons-neutral',
    theme: 'both',
    topic: 'Buttons',
    title: 'Standard buttons',
    why:
        'A standard button with no intent uses fixed grays with a hue of their own. The neutral ' +
        'intent leans cyan, at hue 197, and the button grays sit at 229. Neither follows the ' +
        'neutral ramp, so they drift from the page when the ramp hue moves, as it has in dark. ' +
        'This option puts them on the ramp at the same lightness.',
    lookAt: 'Components > Buttons. Compare the standard None button and the Active row.',
    options: [
        {
            id: 'ramp',
            label: 'On the ramp',
            note: 'Same lightness as shipped, on the hue and tint of the neutral ramp.',
            recommended: true,
            vars: {},
            varsByTheme: {
                light: {
                    '--xh-intent-neutral-darkest':
                        'oklch(0.868 calc(0.009 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-intent-neutral-darker':
                        'oklch(0.898 calc(0.008 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-intent-neutral':
                        'oklch(0.927 calc(0.007 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-intent-neutral-lighter':
                        'oklch(0.957 calc(0.005 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-intent-neutral-lightest':
                        'oklch(0.986 calc(0.002 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-intent-neutral-trans1':
                        'rgb(from var(--xh-intent-neutral) r g b / var(--xh-intent-a1))',
                    '--xh-intent-neutral-trans2':
                        'rgb(from var(--xh-intent-neutral) r g b / var(--xh-intent-a2))',
                    '--xh-button-bg':
                        'oklch(0.908 calc(0.007 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-button-bg-darker':
                        'oklch(0.862 calc(0.009 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-button-bg-darkest':
                        'oklch(0.814 calc(0.011 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-button-bg-lighter':
                        'oklch(0.947 calc(0.006 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-button-bg-lightest':
                        'oklch(0.977 calc(0.003 * var(--xh-neutral-tint)) var(--xh-neutral-hue))'
                },
                dark: {
                    '--xh-intent-neutral-darkest':
                        'oklch(0.332 calc(0.017 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-intent-neutral-darker':
                        'oklch(0.383 calc(0.018 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-intent-neutral':
                        'oklch(0.453 calc(0.019 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-intent-neutral-lighter':
                        'oklch(0.566 calc(0.02 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-intent-neutral-lightest':
                        'oklch(0.621 calc(0.02 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-button-bg':
                        'oklch(0.342 calc(0.017 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-button-bg-darker':
                        'oklch(0.302 calc(0.016 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-button-bg-darkest':
                        'oklch(0.26 calc(0.015 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-button-bg-lighter':
                        'oklch(0.42 calc(0.019 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-button-bg-lightest':
                        'oklch(0.494 calc(0.02 * var(--xh-neutral-tint)) var(--xh-neutral-hue))',
                    '--xh-intent-neutral-trans1':
                        'rgb(from var(--xh-intent-neutral) r g b / var(--xh-intent-a1))',
                    '--xh-intent-neutral-trans2':
                        'rgb(from var(--xh-intent-neutral) r g b / var(--xh-intent-a2))'
                }
            }
        }
    ],
    watch: [
        {
            label: 'Label on standard button',
            fg: '--xh-button-text-color',
            bg: '--xh-button-bg',
            kind: 'body'
        }
    ]
};

// The six --xh-base-* vars hold grays that Hoist took over from Blueprint. Desktop buttons, segmented
// controls, sliders, popovers and inputs read them.
const baseFrom = (source: string, alpha: number) => `oklch(from var(${source}) l c h / ${alpha})`;
const BASE_SHARED: VarMap = {
    '--xh-base-text-color-disabled': baseFrom('--xh-base-text-color-muted', 0.6)
};
const BASE_LIGHT: VarMap = {
    '--xh-base-surface-bg': 'var(--xh-bg)',
    '--xh-base-surface-border-color': baseFrom('--xh-neutral-8', 0.12),
    '--xh-base-surface-border-color-strong': baseFrom('--xh-neutral-8', 0.25)
};
const BASE_DARK: VarMap = {
    '--xh-base-surface-bg': 'var(--xh-neutral-2)',
    '--xh-base-surface-border-color': baseFrom('--xh-neutral-11', 0.2),
    '--xh-base-surface-border-color-strong': baseFrom('--xh-neutral-11', 0.3)
};

const BASE_ROUND: TunerRound = {
    id: 'base-grays',
    theme: 'both',
    topic: 'Neutrals and text',
    title: 'Grays left over from Blueprint',
    why:
        'Six --xh-base-* vars still hold Blueprint grays, such as #5f6b7c and #1c2127. Desktop ' +
        'buttons, segmented controls, sliders, popovers and inputs read them for text, disabled ' +
        'text and outlines. They sit off the neutral ramp, at a hue near 257, so they do not ' +
        'follow the theme. Both options put them on the ramp. They differ in the text colors.',
    lookAt:
        'Components > Buttons for the standard button outline. Forms + Inputs > ' +
        'SegmentedControl and Slider. Then open any menu, and disable a control.',
    options: [
        {
            id: 'ramp',
            label: 'Same lightness, on the ramp',
            note: 'Each gray keeps the lightness Blueprint gave it and takes the ramp hue. Text stays a step darker than other Hoist text.',
            vars: BASE_SHARED,
            varsByTheme: {
                light: {
                    ...BASE_LIGHT,
                    '--xh-base-text-color': 'var(--xh-neutral-11)',
                    '--xh-base-text-color-muted': 'var(--xh-neutral-8)'
                },
                dark: {
                    ...BASE_DARK,
                    '--xh-base-text-color': 'var(--xh-neutral-11)',
                    '--xh-base-text-color-muted': n(0.765, 0.016)
                }
            }
        },
        {
            id: 'theme',
            label: 'Theme text colors',
            note: 'Outlines as in the first option. Text and muted text use the same colors as all other Hoist text.',
            recommended: true,
            vars: {
                ...BASE_SHARED,
                '--xh-base-text-color': 'var(--xh-text-color)',
                '--xh-base-text-color-muted': 'var(--xh-text-color-muted)'
            },
            varsByTheme: {light: BASE_LIGHT, dark: BASE_DARK}
        }
    ],
    watch: [
        {label: 'Base text on page', fg: '--xh-base-text-color', bg: '--xh-bg', kind: 'body'},
        {
            label: 'Base muted text on page',
            fg: '--xh-base-text-color-muted',
            bg: '--xh-bg',
            kind: 'sec'
        }
    ]
};

//------------------------------------------------------------------
// Controls on the alt surface
//------------------------------------------------------------------
// A state fill is a translucent layer of the strong text color, so it shifts any surface under it
// by the same amount. Each alpha gives the fill shipped today on the base surface. Item is the hover
// on list items, today the alt surface. Hover and pressed are those of a minimal button.
function stateFills(item: number, hover: number, pressed: number): VarMap {
    return {
        '--tn-state-item-bg': baseFrom('--xh-neutral-11', item),
        '--tn-state-hover-bg': baseFrom('--xh-neutral-11', hover),
        '--tn-state-pressed-bg': baseFrom('--xh-neutral-11', pressed),
        '--xh-tab-switcher-vertical-item-hover-bg': 'var(--tn-state-item-bg)'
    };
}

// Buttons on a title bar keep the hover rules Hoist gives them there. Segmented controls are left
// out: their option states are translucent fills already.
const STATE_BUTTON =
    '.xh-button.xh-button:is(.xh-button--minimal, .xh-button--outlined).xh-button--intent-none' +
    '.xh-button--enabled:not(:is(.xh-dialog__header, .xh-dock-view__header, ' +
    '.xh-panel-header__items, .xh-panel-header--right, .xh-panel-header--left) *)';
const STATE_CSS = [
    // Three separate :not() match the specificity of the Hoist dark theme rule.
    `${STATE_BUTTON}:hover:not(:active):not(.xh-button--active):not(.xh-popover__target--active) {`,
    '  background-color: var(--tn-state-hover-bg);',
    '}',
    `${STATE_BUTTON}:active { background-color: var(--tn-state-pressed-bg); }`,
    '.xh-picker__option:hover, .xh-icon-picker__cell--active {',
    '  background-color: var(--tn-state-item-bg);',
    '}'
].join('\n');

const STATE_ROUND: TunerRound = {
    id: 'surface-states',
    theme: 'both',
    topic: 'Surfaces',
    title: 'States as overlays',
    why:
        'Hover and pressed fills are solid grays, picked to show on the base surface. On a ' +
        'toolbar or sidebar they sit next to the alt surface. A vertical tab hovers to the alt ' +
        'color, so it is 1.10:1 on the page and 1.00:1 on an alt sidebar. A dark minimal ' +
        'button hover drops from 1.41:1 on the page to 1.27:1 on a toolbar. These options ' +
        'paint each state as a translucent layer of the strong text color, so it shifts any ' +
        'surface by the same amount. On the page, each state looks as it does today.',
    lookAt:
        'Layout > TabContainer > Left, the inner tabs. Components > Buttons, in the toolbars. ' +
        'Forms + Inputs > Picker. Check both themes.',
    options: [
        {
            id: 'overlay',
            label: 'Overlays',
            note: 'Same look as today on the page. Stronger on toolbars and sidebars.',
            recommended: true,
            vars: {},
            varsByTheme: {light: stateFills(0.05, 0.2, 0.27), dark: stateFills(0.05, 0.13, 0.26)},
            css: STATE_CSS
        },
        {
            id: 'firm-items',
            label: 'Overlays, firmer item hover',
            note: 'As above, with twice the item hover. A tab or list item hover shows clearly on the page too.',
            vars: {},
            varsByTheme: {light: stateFills(0.1, 0.2, 0.27), dark: stateFills(0.1, 0.13, 0.26)},
            css: STATE_CSS
        }
    ],
    watch: [
        {
            label: 'Item hover vs page',
            fg: ['--xh-bg', '--tn-state-item-bg'],
            bg: '--xh-bg',
            kind: 'info'
        },
        {
            label: 'Item hover vs toolbar',
            fg: ['--xh-bg-alt', '--tn-state-item-bg'],
            bg: '--xh-bg-alt',
            kind: 'info'
        },
        {
            label: 'Button hover vs toolbar',
            fg: ['--xh-bg-alt', '--tn-state-hover-bg'],
            bg: '--xh-bg-alt',
            kind: 'info'
        }
    ]
};

const STANDARD_BUTTON_ROUND: TunerRound = {
    id: 'surface-buttons',
    theme: 'light',
    topic: 'Buttons',
    title: 'Standard button on a toolbar',
    why:
        'A standard button with no intent rests on a 97.7% gray. A toolbar is 96.8%, so the ' +
        'fill is 1.03:1 against it and only the outline shows the button. This option rests the ' +
        'button on the base color, white, with its outline. It reads as a raised control on a ' +
        'toolbar. Hover and pressed keep their shades.',
    lookAt: 'Components > Buttons. Compare the standard None buttons in the toolbars and the body.',
    options: [
        {
            id: 'base',
            label: 'Rest on white',
            note: 'The fill is the base color. Hover darkens it to 94.7%, as today.',
            recommended: true,
            vars: {'--xh-button-bg-lightest': 'var(--xh-bg)'}
        }
    ],
    watch: [
        {
            label: 'Standard button vs toolbar',
            fg: '--xh-button-bg-lightest',
            bg: '--xh-bg-alt',
            kind: 'info'
        },
        {
            label: 'Hover vs rest',
            fg: '--xh-button-bg-lighter',
            bg: '--xh-button-bg-lightest',
            kind: 'info'
        }
    ]
};

// Floating surfaces in dark. Vars that read --xh-bg or --xh-bg-alt resolve on the body, so each one
// is declared again inside the container. The toolbar overflow menu keeps its toolbar color, and
// the filter chooser popover stands in for its input. Tooltips already sit on the alt surface.
const RAISED_SELECTOR =
    ':is(.xh-dialog, .xh-select__menu, .xh-popover__content-wrapper:not(.xh-tooltip, ' +
    '.xh-toolbar-overflow-popover, .xh-filter-chooser__popover))';

function raisedCss(base: number, alt: number): string {
    const step = (i: number) => `var(--xh-neutral-${i})`;
    return [
        `${RAISED_SELECTOR} {`,
        `  --xh-bg: ${step(base)};`,
        `  --xh-bg-alt: ${step(alt)};`,
        `  --xh-grid-odd-row-bg: ${step(base + 1)};`,
        '  --xh-popup-bg: var(--xh-bg);',
        '  --xh-popover-bg: var(--xh-popup-bg);',
        '  --xh-menu-bg: var(--xh-bg);',
        '  --xh-panel-bg: var(--xh-bg);',
        '  --xh-panel-title-border-color: var(--xh-bg);',
        '  --xh-panel-splitter-button-bg: var(--xh-bg);',
        '  --xh-card-bg: var(--xh-bg);',
        '  --xh-stat-card-bg: var(--xh-bg);',
        '  --xh-grid-bg: var(--xh-bg);',
        '  --xh-grid-header-bg: var(--xh-grid-bg);',
        '  --xh-scrollbar-bg: var(--xh-bg);',
        '  --xh-toolbar-bg: var(--xh-bg-alt);',
        '  --xh-segmented-control-bg: var(--xh-bg-alt);',
        '  --xh-segmented-control-text-color:',
        '    color-mix(in srgb, var(--xh-text-color) 75%, var(--xh-segmented-control-bg));',
        '  --xh-radio-card-input-bg: var(--xh-bg-alt);',
        '  --xh-stat-card-hover-bg: var(--xh-bg-alt);',
        '  --xh-mask-text-bg: var(--xh-bg-alt);',
        '  --xh-pdf-viewer-bg: var(--xh-bg-alt);',
        '  --xh-date-range-picker-footer-bg: var(--xh-toolbar-bg);',
        '  --xh-date-range-picker-rail-bg: var(--xh-toolbar-bg);',
        '}',
        // The dialog frame itself has a fixed Blueprint color, #1c2127. It shows behind a form.
        '.xh-dialog { background: var(--xh-popup-bg); }'
    ].join('\n');
}

// The outer edge of a dialog, popover or menu, at the ramp step for control outlines. Lines inside
// keep their colors.
const POPUP_EDGE = 'var(--xh-neutral-7)';

const RAISED_ROUND: TunerRound = {
    id: 'surface-raised',
    theme: 'dark',
    topic: 'Surfaces',
    title: 'Dialogs and popovers on a dark page',
    why:
        'In dark, a dialog, popover or menu has the page color. A dialog border is step 5, ' +
        '1.45:1 on the page, and a shadow barely shows on a dark page. A popover border is ' +
        'mixed toward the text color, 5.1:1, brighter than any other line.',
    lookAt:
        'Grids > Column Chooser in Modal mode, over the grid. Grids > REST Editor, press Add. ' +
        'The app menu and a select dropdown.',
    options: [
        {
            id: 'outlined',
            label: 'Outlined',
            note: 'The surface keeps the page color. Dialogs and popovers get a 1px edge at step 7, 3.6:1 on the page and 3.4:1 on a grid stripe.',
            recommended: true,
            vars: {'--xh-popover-border-color': POPUP_EDGE},
            css: `.xh-dialog { border-color: ${POPUP_EDGE}; }`
        },
        {
            id: 'one',
            label: 'One step up',
            note: 'A preview of the idea, not a finished design. Surfaces inside move up one step, but lines and borders inside do not follow, so grid lines and outlines fade.',
            vars: {},
            css: raisedCss(2, 4)
        }
    ]
};

export const ROUNDS: TunerRound[] = [
    //------------------------------------------------------------------
    // Light theme
    //------------------------------------------------------------------
    {
        id: 'light-neutrals',
        theme: 'light',
        topic: 'Neutrals and text',
        title: 'One neutral family',
        why:
            'Light chrome mixes Material blue-gray with untinted grays, so toolbars read cool while ' +
            'grid stripes and borders read flat. These options put every surface on one ramp. ' +
            'They also lift toolbars from 95% to 97% lightness, which makes the chrome quieter.',
        lookAt: 'App bar, toolbars and side tabs together.',
        seeds: ['--xh-neutral-hue', '--xh-neutral-tint'],
        options: [
            {
                id: 'slate',
                label: 'Cool slate',
                note: 'One hue, the tint Hoist has today.',
                recommended: true,
                vars: {...lightNeutrals}
            },
            {
                id: 'gray',
                label: 'True gray',
                note: 'Same ramp with no tint.',
                vars: {...lightNeutrals, '--xh-neutral-tint': '0'}
            },
            {
                id: 'tinted',
                label: 'Stronger tint',
                note: 'Twice the chroma. More character, more blue.',
                vars: {...lightNeutrals, '--xh-neutral-tint': '2'}
            }
        ],
        watch: [
            {label: 'Text on toolbar', fg: '--xh-text-color', bg: '--xh-toolbar-bg', kind: 'body'},
            {label: 'Toolbar vs page', fg: '--xh-bg-alt', bg: '--xh-bg', kind: 'info'}
        ]
    },
    {
        id: 'light-secondary-text',
        theme: 'light',
        topic: 'Neutrals and text',
        title: 'Secondary text you can read',
        why:
            'Muted text and grid headers are #9e9e9e on white, 2.7:1. Placeholders are 2.0:1. ' +
            'WCAG AA asks for 4.5:1. This is the largest legibility gap in the light theme. ' +
            'Placeholders stay quieter than labels in both options, at about 3.5:1.',
        lookAt: 'Grid column headers, inactive side tabs, input placeholders, stat card titles.',
        options: [
            {
                id: 'aa',
                label: 'AA floor',
                note: 'About 5.2:1 on white, 4.8:1 on toolbars.',
                recommended: true,
                vars: {...lightSecondaryText, '--xh-text-color-muted': 'var(--xh-neutral-8)'}
            },
            {
                id: 'strong',
                label: 'Stronger',
                note: 'About 6.5:1. Headers and labels carry more weight.',
                vars: {...lightSecondaryText, '--xh-text-color-muted': n(0.48, 0.022)}
            }
        ],
        watch: [
            {label: 'Muted on page', fg: '--xh-text-color-muted', bg: '--xh-bg', kind: 'sec'},
            {
                label: 'Muted on toolbar',
                fg: '--xh-text-color-muted',
                bg: '--xh-bg-alt',
                kind: 'sec'
            },
            {
                label: 'Grid header',
                fg: '--xh-grid-header-text-color',
                bg: '--xh-grid-header-bg',
                kind: 'sec'
            },
            {
                label: 'Placeholder',
                fg: '--xh-input-placeholder-text-color',
                bg: ['--xh-bg', '--xh-input-bg'],
                kind: 'sec'
            }
        ]
    },
    {
        id: 'light-text',
        theme: 'light',
        topic: 'Neutrals and text',
        title: 'Body text',
        why:
            'Body text is #263238, 13:1 on white. That is already strong. The choice is whether ' +
            'to keep that weight on the shared hue, or go a step darker for a crisper page.',
        lookAt: 'Grid cells, form labels, menus.',
        options: [
            {
                id: 'same',
                label: 'Same weight',
                note: 'The current lightness, on the shared neutral hue.',
                recommended: true,
                vars: {
                    '--xh-text-color': 'var(--xh-neutral-10)',
                    '--xh-text-color-highlight': 'var(--xh-neutral-11)',
                    '--xh-appbar-title-text-color': 'var(--xh-neutral-9)'
                }
            },
            {
                id: 'ink',
                label: 'Ink',
                note: 'One step darker, about 16.4:1.',
                vars: {
                    '--xh-text-color': 'var(--xh-neutral-11)',
                    '--xh-text-color-highlight': 'var(--xh-neutral-11)',
                    '--xh-appbar-title-text-color': 'var(--xh-neutral-10)'
                }
            }
        ],
        watch: [
            {label: 'Text on page', fg: '--xh-text-color', bg: '--xh-bg', kind: 'body'},
            {label: 'Text on toolbar', fg: '--xh-text-color', bg: '--xh-bg-alt', kind: 'body'}
        ]
    },
    {
        id: 'light-borders',
        theme: 'light',
        topic: 'Surfaces',
        title: 'Borders',
        why:
            'Panel borders are a flat #bdbdbd and draw more attention than they need. These ' +
            'options put panel borders and grid lines on the neutral ramp at two weights.',
        lookAt: 'A screen with several bordered panels, then a grid.',
        options: [
            {
                id: 'quiet',
                label: 'Quiet frames',
                note: 'Lighter panel borders and grid lines.',
                recommended: true,
                vars: {
                    '--xh-border-color': 'var(--xh-neutral-5)',
                    '--xh-toolbar-border-color': 'var(--xh-neutral-5)',
                    '--xh-toolbar-separator-color': 'var(--xh-neutral-6)',
                    '--xh-grid-border-color': 'var(--xh-neutral-4)',
                    '--xh-grid-pinned-column-border-color': 'var(--xh-neutral-5)'
                }
            },
            {
                id: 'defined',
                label: 'Defined frames',
                note: 'Panel borders keep their current weight, on the shared hue.',
                vars: {
                    '--xh-border-color': 'var(--xh-neutral-6)',
                    '--xh-toolbar-border-color': 'var(--xh-neutral-6)',
                    '--xh-toolbar-separator-color': 'var(--xh-neutral-6)',
                    '--xh-grid-border-color': 'var(--xh-neutral-4)',
                    '--xh-grid-pinned-column-border-color': 'var(--xh-neutral-5)'
                }
            }
        ],
        watch: [
            {label: 'Panel border', fg: '--xh-border-color', bg: '--xh-bg', kind: 'info'},
            {label: 'Grid line', fg: '--xh-grid-border-color', bg: '--xh-grid-bg', kind: 'info'}
        ]
    },
    {
        id: 'light-scrollbars',
        theme: 'light',
        topic: 'Surfaces',
        title: 'Scrollbars',
        why:
            'The shipped track is a mid gray gutter with a thumb only a little darker. These options ' +
            'put a light track under a thumb of rising weight. Only the last one reaches 3:1.',
        lookAt: 'A grid with more rows and columns than fit. Check both scrollbars.',
        // Thumbs are filled shapes next to blue-gray title bars, so they carry that family's
        // chroma. The ramp's lower chroma reads as a warm gray at this size.
        options: [
            {
                id: 'quiet',
                label: 'Quiet',
                note: 'Lighter than today at about the same contrast, 1.7:1.',
                vars: {
                    '--xh-scrollbar-bg': 'var(--xh-neutral-2)',
                    '--xh-scrollbar-thumb-color': n(0.8, 0.018)
                }
            },
            {
                id: 'balanced',
                label: 'Balanced',
                note: 'A clear thumb that stays in the background, 2.3:1.',
                recommended: true,
                vars: {
                    '--xh-scrollbar-bg': 'var(--xh-neutral-2)',
                    '--xh-scrollbar-thumb-color': n(0.72, 0.026)
                }
            },
            {
                id: 'visible',
                label: 'Visible',
                note: 'Meets 3:1 for control contrast. The heaviest of the three.',
                vars: {
                    '--xh-scrollbar-bg': 'var(--xh-neutral-2)',
                    '--xh-scrollbar-thumb-color': n(0.63, 0.033)
                }
            }
        ],
        watch: [
            {
                label: 'Thumb vs track',
                fg: '--xh-scrollbar-thumb-color',
                bg: '--xh-scrollbar-bg',
                kind: 'ui'
            },
            {label: 'Track vs page', fg: '--xh-scrollbar-bg', bg: '--xh-bg', kind: 'info'}
        ]
    },
    {
        id: 'light-stripes',
        theme: 'light',
        topic: 'Grids and trees',
        title: 'Grid stripes',
        why:
            'The shipped stripe is an untinted gray. These options put it on the neutral ramp at ' +
            'three weights. A stripe must stay visible on a poor monitor without competing with ' +
            'the hovered and selected rows.',
        lookAt: 'A striped grid, full width. Lean back, or dim the screen.',
        options: [
            {
                id: 'same',
                label: 'Same weight',
                note: 'Shipped contrast, 1.09:1, on the neutral ramp.',
                recommended: true,
                vars: {'--xh-grid-odd-row-bg': n(0.97, 0.003)}
            },
            {
                id: 'faint',
                label: 'Faint',
                note: 'Half the shipped contrast, 1.05:1. Clean, but easy to lose.',
                vars: {'--xh-grid-odd-row-bg': 'var(--xh-neutral-1)'}
            },
            {
                id: 'strong',
                label: 'Stronger',
                note: 'A third more than shipped, 1.13:1.',
                vars: {'--xh-grid-odd-row-bg': n(0.958, 0.005)}
            }
        ],
        watch: [
            {label: 'Stripe vs row', fg: '--xh-grid-odd-row-bg', bg: '--xh-grid-bg', kind: 'info'},
            {
                label: 'Hover vs stripe',
                fg: '--xh-grid-row-hover-bg',
                bg: '--xh-grid-odd-row-bg',
                kind: 'info'
            }
        ]
    },
    {
        id: 'light-grid',
        theme: 'light',
        topic: 'Grids and trees',
        title: 'Grid row states',
        why:
            'Hover and selection are both saturated sky blue and only 4% apart in lightness, so a ' +
            'hovered row can pass for a selected one. Group rows put white text on #78909c at ' +
            '3.4:1. Every option fixes the group row.',
        lookAt: 'A grid with a selected row. Move the pointer over the rows next to it.',
        options: [
            {
                id: 'calm',
                label: 'Calm blue',
                note: 'Hover is a faint tint. Selection keeps a clear blue.',
                recommended: true,
                vars: {
                    ...lightGridGroup,
                    '--xh-grid-row-hover-bg': `oklch(0.945 0.026 ${SEL_HUE})`,
                    '--xh-bg-highlight': `oklch(0.92 0.042 ${SEL_HUE})`,
                    '--xh-grid-tree-group-bg': `oklch(0.965 0.014 ${SEL_HUE})`
                }
            },
            {
                id: 'neutral-hover',
                label: 'Neutral hover',
                note: 'Hover is gray, so blue always means selected.',
                vars: {
                    ...lightGridGroup,
                    '--xh-grid-row-hover-bg': 'var(--xh-neutral-3)',
                    '--xh-bg-highlight': `oklch(0.92 0.042 ${SEL_HUE})`,
                    '--xh-grid-tree-group-bg': `oklch(0.965 0.014 ${SEL_HUE})`
                }
            },
            {
                id: 'cool-hover',
                label: 'Cool hover',
                note: 'Between the two. Hover is a cool gray with a trace of blue.',
                vars: {
                    ...lightGridGroup,
                    '--xh-grid-row-hover-bg': 'oklch(0.943 0.015 240)',
                    '--xh-bg-highlight': `oklch(0.92 0.042 ${SEL_HUE})`,
                    '--xh-grid-tree-group-bg': `oklch(0.965 0.014 ${SEL_HUE})`
                }
            }
        ],
        watch: [
            {
                label: 'Group row label',
                fg: '--xh-grid-group-text-color',
                bg: '--xh-grid-group-bg',
                kind: 'body'
            },
            {
                label: 'Text on selected',
                fg: '--xh-grid-row-selected-text-color',
                bg: '--xh-grid-row-selected-bg',
                kind: 'body'
            },
            {
                label: 'Muted on selected',
                fg: '--xh-text-color-muted',
                bg: '--xh-grid-row-selected-bg',
                kind: 'sec'
            },
            {
                label: 'Selected vs hover',
                fg: '--xh-grid-row-selected-bg',
                bg: '--xh-grid-row-hover-bg',
                kind: 'info'
            },
            {
                label: 'Hover vs stripe',
                fg: '--xh-grid-row-hover-bg',
                bg: '--xh-grid-odd-row-bg',
                kind: 'info'
            }
        ]
    },

    //------------------------------------------------------------------
    // Dark theme
    //------------------------------------------------------------------
    {
        id: 'dark-depth',
        theme: 'dark',
        topic: 'Surfaces',
        title: 'How dark is dark',
        why:
            'The page is 20% lightness and toolbars are 31%. That 10 point jump makes the chrome ' +
            'glow against the page. These options keep the slate hue and close the gap to about ' +
            '5 points. Deep keeps the current page. Dim lifts every surface.',
        lookAt: 'App bar and toolbars against the page, then a full grid.',
        seeds: ['--xh-neutral-depth', '--xh-neutral-hue', '--xh-neutral-tint'],
        options: [
            {
                id: 'deep',
                label: 'Deep',
                note: 'Page near its current depth, chrome pulled closer to it.',
                recommended: true,
                vars: {...darkSurfaces}
            },
            {
                id: 'dim',
                label: 'Dim',
                note: 'Every surface about 5 points lighter. Softer, less contrast.',
                vars: {...darkSurfaces, '--xh-neutral-depth': '0.055'}
            }
        ],
        watch: [
            {label: 'Text on page', fg: '--xh-text-color', bg: '--xh-bg', kind: 'body'},
            {label: 'Text on toolbar', fg: '--xh-text-color', bg: '--xh-toolbar-bg', kind: 'body'},
            {
                label: 'Muted on toolbar',
                fg: '--xh-text-color-muted',
                bg: '--xh-bg-alt',
                kind: 'sec'
            },
            {label: 'Toolbar vs page', fg: '--xh-bg-alt', bg: '--xh-bg', kind: 'info'}
        ]
    },
    {
        id: 'dark-text',
        theme: 'dark',
        topic: 'Neutrals and text',
        title: 'Text on dark',
        why:
            'Body text is pure white, 17.9:1 on the page. Full white on a dark surface is harsh ' +
            'over a long session and leaves no room for emphasis. Muted text is an untinted ' +
            'gray. These options soften body text and put all text on the shared hue.',
        lookAt: 'A dense grid, then a form. Check that headings still stand out.',
        options: [
            {
                id: 'soft',
                label: 'Soft white',
                note: 'About 15.5:1. Still crisp.',
                recommended: true,
                vars: {
                    ...darkSecondaryText,
                    '--xh-text-color': 'var(--xh-neutral-10)',
                    '--xh-text-color-highlight': 'var(--xh-neutral-11)',
                    '--xh-appbar-title-text-color': 'var(--xh-neutral-10)'
                }
            },
            {
                id: 'softer',
                label: 'Softer',
                note: 'About 13.7:1, close to the light theme.',
                vars: {
                    ...darkSecondaryText,
                    '--xh-text-color': n(0.9, 0.01),
                    '--xh-text-color-highlight': 'var(--xh-neutral-11)',
                    '--xh-appbar-title-text-color': n(0.9, 0.01)
                }
            }
        ],
        watch: [
            {label: 'Text on page', fg: '--xh-text-color', bg: '--xh-bg', kind: 'body'},
            {label: 'Muted on page', fg: '--xh-text-color-muted', bg: '--xh-bg', kind: 'sec'},
            {
                label: 'Muted on toolbar',
                fg: '--xh-text-color-muted',
                bg: '--xh-bg-alt',
                kind: 'sec'
            },
            {
                label: 'Placeholder',
                fg: '--xh-input-placeholder-text-color',
                bg: ['--xh-bg', '--xh-input-bg'],
                kind: 'sec'
            }
        ]
    },
    {
        id: 'dark-borders',
        theme: 'dark',
        topic: 'Surfaces',
        title: 'Borders',
        why:
            'Borders come from three families: slate panels, teal grid lines and flat gray pinned ' +
            'columns. These options put all three on one ramp at two weights.',
        lookAt: 'A screen with several bordered panels, then a grid with a pinned column.',
        options: [
            {
                id: 'quiet',
                label: 'Quiet frames',
                note: 'Hairline panels and grid lines.',
                recommended: true,
                vars: {
                    '--xh-border-color': 'var(--xh-neutral-5)',
                    '--xh-toolbar-border-color': 'var(--xh-neutral-5)',
                    '--xh-appbar-border-color': 'var(--xh-neutral-5)',
                    '--xh-toolbar-separator-color': 'var(--xh-neutral-6)',
                    '--xh-grid-border-color': 'var(--xh-neutral-3)',
                    '--xh-grid-pinned-column-border-color': 'var(--xh-neutral-5)'
                }
            },
            {
                id: 'defined',
                label: 'Defined frames',
                note: 'Panel borders at their current weight. Grid lines a little stronger.',
                vars: {
                    '--xh-border-color': 'var(--xh-neutral-6)',
                    '--xh-toolbar-border-color': 'var(--xh-neutral-6)',
                    '--xh-appbar-border-color': 'var(--xh-neutral-6)',
                    '--xh-toolbar-separator-color': 'var(--xh-neutral-7)',
                    '--xh-grid-border-color': 'var(--xh-neutral-4)',
                    '--xh-grid-pinned-column-border-color': 'var(--xh-neutral-6)'
                }
            }
        ],
        watch: [
            {label: 'Panel border', fg: '--xh-border-color', bg: '--xh-bg', kind: 'info'},
            {label: 'Grid line', fg: '--xh-grid-border-color', bg: '--xh-grid-bg', kind: 'info'}
        ]
    },
    {
        id: 'dark-scrollbars',
        theme: 'dark',
        topic: 'Surfaces',
        title: 'Scrollbars',
        why:
            'The shipped track is pure black with a thumb that is hard to find. These options match ' +
            'the track to the page and raise the thumb in steps. Only the last one reaches 3:1.',
        lookAt: 'A grid with more rows and columns than fit. Check both scrollbars.',
        // Thumbs carry the chroma of the blue-gray title bars, as in the light theme.
        options: [
            {
                id: 'quiet',
                label: 'Quiet',
                note: 'A little easier to find than today, 1.9:1.',
                vars: {
                    '--xh-scrollbar-bg': 'var(--xh-neutral-1)',
                    '--xh-scrollbar-thumb-color': d(0.39, 0.025)
                }
            },
            {
                id: 'balanced',
                label: 'Balanced',
                note: 'A clear thumb that stays in the background, 2.6:1.',
                recommended: true,
                vars: {
                    '--xh-scrollbar-bg': 'var(--xh-neutral-1)',
                    '--xh-scrollbar-thumb-color': d(0.46, 0.03)
                }
            },
            {
                id: 'visible',
                label: 'Visible',
                note: 'Meets 3:1 for control contrast. The brightest of the three.',
                vars: {
                    '--xh-scrollbar-bg': 'var(--xh-neutral-1)',
                    '--xh-scrollbar-thumb-color': d(0.55, 0.038)
                }
            }
        ],
        watch: [
            {
                label: 'Thumb vs track',
                fg: '--xh-scrollbar-thumb-color',
                bg: '--xh-scrollbar-bg',
                kind: 'ui'
            },
            {label: 'Track vs page', fg: '--xh-scrollbar-bg', bg: '--xh-bg', kind: 'info'}
        ]
    },
    {
        id: 'dark-grid',
        theme: 'dark',
        topic: 'Grids and trees',
        title: 'Grid row states',
        why:
            'A hovered row is brighter than a selected one today, so hover reads as the stronger ' +
            'state. These options make selection the strongest fill and hover a lighter touch.',
        lookAt: 'A grid with a selected row. Move the pointer over the rows next to it.',
        options: [
            {
                id: 'calm',
                label: 'Calm blue',
                note: 'Hover is a faint blue. Selection is clearly stronger.',
                recommended: true,
                vars: {
                    '--xh-grid-row-hover-bg': `oklch(calc(0.265 + var(--xh-neutral-depth)) 0.03 ${SEL_HUE})`,
                    '--xh-bg-highlight': `oklch(calc(0.34 + var(--xh-neutral-depth)) 0.065 ${SEL_HUE})`,
                    '--xh-grid-tree-group-bg': `oklch(calc(0.26 + var(--xh-neutral-depth)) 0.035 ${SEL_HUE})`,
                    '--xh-grid-group-bg': 'var(--xh-neutral-6)',
                    '--xh-grid-group-border-color': 'var(--xh-neutral-7)'
                }
            },
            {
                id: 'neutral-hover',
                label: 'Neutral hover',
                note: 'Hover is gray, so blue always means selected.',
                vars: {
                    '--xh-grid-row-hover-bg': 'var(--xh-neutral-4)',
                    '--xh-bg-highlight': `oklch(calc(0.34 + var(--xh-neutral-depth)) 0.065 ${SEL_HUE})`,
                    '--xh-grid-tree-group-bg': `oklch(calc(0.26 + var(--xh-neutral-depth)) 0.035 ${SEL_HUE})`,
                    '--xh-grid-group-bg': 'var(--xh-neutral-6)',
                    '--xh-grid-group-border-color': 'var(--xh-neutral-7)'
                }
            }
        ],
        watch: [
            {
                label: 'Text on selected',
                fg: '--xh-grid-row-selected-text-color',
                bg: '--xh-grid-row-selected-bg',
                kind: 'body'
            },
            {
                label: 'Muted on selected',
                fg: '--xh-text-color-muted',
                bg: '--xh-grid-row-selected-bg',
                kind: 'sec'
            },
            {
                label: 'Selected vs hover',
                fg: '--xh-grid-row-selected-bg',
                bg: '--xh-grid-row-hover-bg',
                kind: 'info'
            },
            {
                label: 'Group row label',
                fg: '--xh-grid-group-text-color',
                bg: '--xh-grid-group-bg',
                kind: 'body'
            }
        ]
    },

    //------------------------------------------------------------------
    // Charts
    //------------------------------------------------------------------
    {
        id: 'light-charts',
        theme: 'light',
        topic: 'Charts',
        title: 'Chart series colors',
        why:
            'Light charts have no Hoist palette. They fall back to the Highcharts defaults. Four ' +
            'of those ten are too pale to hold a line on white, two read as gray, and seven are ' +
            'under 3:1. This option is an eight color set, ordered so that neighbors stay ' +
            'distinct under color blindness. Series 9 and 10 repeat the first two.',
        lookAt: 'Components > Charts. Compare thin lines and the legend.',
        options: [
            {
                id: 'validated',
                label: 'Balanced eight',
                note: 'Even weight across series. Four are still under 3:1 on white.',
                recommended: true,
                vars: chartColors([
                    '#257de0',
                    '#f47230',
                    '#00b894',
                    '#f2a600',
                    '#ee7fac',
                    '#008a17',
                    '#6a4ce2',
                    '#ec4647'
                ])
            }
        ],
        watch: chartWatch()
    },
    {
        id: 'dark-charts',
        theme: 'dark',
        topic: 'Charts',
        title: 'Chart series colors',
        why:
            'The dark palette mixes pastels with saturated colors, so some series shout and ' +
            'others fade. Four are outside a workable lightness band, three read as gray and one ' +
            'color appears twice. This option is the same eight hues as the light theme, ' +
            'stepped for a dark surface. All eight clear 3:1.',
        lookAt: 'Components > Charts. Compare thin lines and the legend.',
        options: [
            {
                id: 'validated',
                label: 'Balanced eight',
                note: 'The light theme hues, stepped for dark.',
                recommended: true,
                vars: chartColors([
                    '#338ced',
                    '#e76624',
                    '#00a888',
                    '#d28e05',
                    '#e24d8b',
                    '#0aac23',
                    '#9887ef',
                    '#eb6263'
                ])
            }
        ],
        watch: chartWatch()
    },
    // Added after the first walkthrough. They sit last so earlier round numbers do not move.
    {
        id: 'light-inputs',
        theme: 'light',
        topic: 'Inputs and forms',
        title: 'Input outlines',
        why:
            'Input outlines are 1.4:1 against the page and nearly vanish. WCAG asks 3:1 for the ' +
            'edge of a control. Inputs also sit in toolbars and filter bars, where a full 3:1 ' +
            'frame can outweigh the borders around it. These options raise the outline in steps.',
        lookAt: 'Forms > Form, then Forms > Toolbar Forms and the filter bar above a grid.',
        options: [
            {
                id: 'soft',
                label: 'Soft',
                note: '2.0:1 on the page, 1.8:1 in a toolbar.',
                vars: outline(n(0.78, 0.016))
            },
            {
                id: 'medium',
                label: 'Medium',
                note: '2.5:1 on the page, 2.3:1 in a toolbar.',
                recommended: true,
                vars: outline(n(0.72, 0.02))
            },
            {
                id: 'full',
                label: 'Full 3:1',
                note: '3.5:1 on the page, 3.2:1 in a toolbar. The only one that passes.',
                vars: outline('var(--xh-neutral-7)')
            }
        ],
        watch: [
            {
                label: 'Outline vs page',
                fg: '--xh-form-field-box-shadow-color-top',
                bg: '--xh-bg',
                kind: 'ui'
            },
            {
                label: 'Outline vs toolbar',
                fg: '--xh-form-field-box-shadow-color-top',
                bg: '--xh-bg-alt',
                kind: 'ui'
            },
            {label: 'Panel border', fg: '--xh-border-color', bg: '--xh-bg', kind: 'info'}
        ]
    },
    {
        id: 'dark-inputs',
        theme: 'dark',
        topic: 'Inputs and forms',
        title: 'Input outlines',
        why:
            'Input outlines are 1.7:1 against the page and nearly vanish. WCAG asks 3:1 for the ' +
            'edge of a control. Inputs also sit in toolbars and filter bars, where a full 3:1 ' +
            'frame can outweigh the borders around it. These options raise the outline in steps.',
        lookAt: 'Forms > Form, then Forms > Toolbar Forms and the filter bar above a grid.',
        options: [
            {
                id: 'soft',
                label: 'Soft',
                note: '2.1:1 on the page, 1.8:1 in a toolbar.',
                vars: outline(d(0.41, 0.018))
            },
            {
                id: 'medium',
                label: 'Medium',
                note: '2.7:1 on the page, 2.4:1 in a toolbar.',
                recommended: true,
                vars: outline(d(0.47, 0.019))
            },
            {
                id: 'full',
                label: 'Full 3:1',
                note: '3.8:1 on the page, 3.3:1 in a toolbar. The only one that passes.',
                vars: outline('var(--xh-neutral-7)')
            }
        ],
        watch: [
            {
                label: 'Outline vs page',
                fg: '--xh-form-field-box-shadow-color-top',
                bg: '--xh-bg',
                kind: 'ui'
            },
            {
                label: 'Outline vs toolbar',
                fg: '--xh-form-field-box-shadow-color-top',
                bg: '--xh-bg-alt',
                kind: 'ui'
            },
            {label: 'Panel border', fg: '--xh-border-color', bg: '--xh-bg', kind: 'info'}
        ]
    },
    //------------------------------------------------------------------
    // Second session: group rows, tree grids, panel headers.
    // Later rounds win, so these replace the group colors set in the grid states rounds.
    //------------------------------------------------------------------
    {
        id: 'light-group-rows',
        theme: 'light',
        topic: 'Grids and trees',
        title: 'Group rows',
        why:
            'A group row is a solid blue-gray bar with white text. Collapse the groups and the ' +
            'bars stack into one dark block. These options trade the solid bar for a band that ' +
            'still reads as a heading when many sit together.',
        lookAt: 'Grids > Standard. Group by City with the chooser above the grid. Collapse the groups, then open one.',
        options: [
            {
                id: 'band',
                label: 'Light band',
                note: 'A pale band with a dark label. Reads as a heading, not a bar.',
                recommended: true,
                vars: groupRow(n(0.91, 0.01), 'var(--xh-neutral-11)', 'var(--xh-neutral-5)')
            },
            {
                id: 'mid',
                label: 'Mid band',
                note: 'A clear cool gray band with a dark label.',
                vars: groupRow(n(0.83, 0.016), 'var(--xh-neutral-11)', 'var(--xh-neutral-6)')
            },
            {
                id: 'solid',
                label: 'Solid slate',
                note: 'The dark bar from the grid states round, white label.',
                vars: groupRow(n(0.54, 0.035), 'white', 'var(--xh-neutral-6)')
            }
        ],
        watch: groupRowWatch()
    },
    {
        id: 'dark-group-rows',
        theme: 'dark',
        topic: 'Grids and trees',
        title: 'Group rows',
        why:
            'Group rows are a solid slate bar. Collapse the groups and the bars stack into one ' +
            'block that is brighter than the rest of the grid. These options lower the bar in steps.',
        lookAt: 'Grids > Standard. Group by City with the chooser above the grid. Collapse the groups, then open one.',
        options: [
            {
                id: 'band',
                label: 'Low band',
                note: 'One step above the rows, soft label.',
                recommended: true,
                vars: groupRow(d(0.3, 0.024), 'var(--xh-neutral-10)', 'var(--xh-neutral-6)')
            },
            {
                id: 'mid',
                label: 'Mid band',
                note: 'A clear band with a bright label.',
                vars: groupRow(d(0.37, 0.03), 'var(--xh-neutral-11)', 'var(--xh-neutral-7)')
            },
            {
                id: 'solid',
                label: 'Solid slate',
                note: 'The shipped weight on the shared hue.',
                vars: groupRow(d(0.43, 0.034), 'white', 'var(--xh-neutral-7)')
            }
        ],
        watch: groupRowWatch()
    },
    {
        id: 'light-tree',
        theme: 'light',
        topic: 'Grids and trees',
        title: 'Tree grid highlights',
        why:
            'The highlights tree style now fills open parent rows only, in every option here. ' +
            'A collapsed parent is a standard row, so a collapsed tree no longer turns blue. ' +
            'These options set the color of the fill that remains.',
        lookAt: 'Grids > Tree. Open one branch and select a row. Then turn on Striped.',
        options: [
            {
                // The id dates from when this option alone left collapsed parents plain. It is
                // kept so that a saved pick still applies.
                id: 'open',
                label: 'Calm blue',
                note: 'A calmer tint on the selection hue. Still a pale blue.',
                vars: {'--xh-grid-tree-group-bg': `oklch(0.955 0.02 ${SEL_HUE})`}
            },
            {
                id: 'neutral',
                label: 'Neutral',
                note: 'Cool gray tiers. Blue then only means selected.',
                recommended: true,
                vars: {
                    '--xh-grid-tree-group-bg': n(0.945, 0.008),
                    '--xh-grid-tree-group-border-color': 'var(--xh-neutral-5)'
                }
            }
        ],
        watch: treeWatch()
    },
    {
        id: 'dark-tree',
        theme: 'dark',
        topic: 'Grids and trees',
        title: 'Tree grid highlights',
        why:
            'The highlights tree style now fills open parent rows only, in every option here. ' +
            'A collapsed parent is a standard row, so a collapsed tree no longer fills. The ' +
            'shipped fill is teal, a hue nothing else in the dark theme uses. These options ' +
            'set the color of the fill that remains.',
        lookAt: 'Grids > Tree. Open one branch and select a row. Then turn on Striped.',
        options: [
            {
                // See the note on the light round for this id.
                id: 'open',
                label: 'Calm blue',
                note: 'On the selection hue.',
                recommended: true,
                vars: {
                    '--xh-grid-tree-group-bg': `oklch(calc(0.25 + var(--xh-neutral-depth)) 0.03 ${SEL_HUE})`
                }
            },
            {
                id: 'neutral',
                label: 'Neutral',
                note: 'Gray tiers. Blue then only means selected.',
                vars: {
                    '--xh-grid-tree-group-bg': d(0.26, 0.014),
                    '--xh-grid-tree-group-border-color': 'var(--xh-neutral-5)'
                }
            }
        ],
        watch: treeWatch()
    },
    {
        id: 'light-headers',
        theme: 'light',
        topic: 'Surfaces',
        title: 'Panel headers',
        why:
            'Panel and dialog title bars are Material blue-gray 600, a mid tone that is neither ' +
            'chrome nor accent. These options keep a dark bar on a cleaner slate. Dashboard ' +
            'widget headers have their own round.',
        lookAt: 'Components > ViewManager, for panels and widgets together. Then open a dialog.',
        options: [
            {
                id: 'slate',
                label: 'Clean slate',
                note: 'The shipped weight, a little darker and on the shared hue.',
                vars: title(n(0.47, 0.04), n(0.975, 0.004))
            },
            {
                id: 'ink',
                label: 'Deep slate',
                note: 'A darker bar. A stronger frame and more contrast for the title.',
                vars: title(n(0.36, 0.035), n(0.975, 0.004))
            }
        ],
        watch: titleWatch()
    },
    {
        id: 'dark-headers',
        theme: 'dark',
        topic: 'Surfaces',
        title: 'Panel headers',
        why:
            'Dark title bars use the same blue-gray 600 as the light theme. On a dark page that ' +
            'makes the header the brightest surface on screen. These options bring it down.',
        lookAt: 'Any screen with several panels, then open a dialog.',
        options: [
            {
                id: 'slate',
                label: 'Clean slate',
                note: 'A clear bar, well below the shipped brightness.',
                vars: title(d(0.4, 0.04), 'var(--xh-neutral-11)')
            },
            {
                id: 'ink',
                label: 'Deep slate',
                note: 'A low bar, just above the toolbar.',
                vars: title(d(0.33, 0.035), 'var(--xh-neutral-10)')
            },
            {
                id: 'raised',
                label: 'Raised surface',
                note: 'Nearly neutral. The header reads as a raised surface.',
                vars: title(d(0.29, 0.018), 'var(--xh-neutral-10)')
            }
        ],
        watch: titleWatch()
    },
    {
        id: 'light-scrollbar-shape',
        theme: 'light',
        topic: 'Surfaces',
        title: 'Scrollbar shape',
        why:
            'The thumb is a square block that fills the full width of the bar. No color makes a ' +
            'flat block sit well against a panel edge. These options round it and pull it in ' +
            'from the edge, and brighten it under the pointer. Color still comes from the ' +
            'scrollbar color round.',
        lookAt: 'A long panel beside a grid. Check the bar ends and the pointer hover.',
        options: [
            {
                id: 'pill',
                label: 'Pill',
                note: 'A 6px rounded thumb in the 10px bar.',
                recommended: true,
                vars: thumbShape('10px', '2px')
            },
            {
                id: 'slim',
                label: 'Slim pill',
                note: 'A 4px rounded thumb. The quietest.',
                vars: thumbShape('10px', '3px')
            },
            {
                id: 'block',
                label: 'Soft block',
                note: 'An 8px thumb with a small corner radius.',
                vars: thumbShape('3px', '1px')
            }
        ]
    },
    {
        id: 'dark-scrollbar-shape',
        theme: 'dark',
        topic: 'Surfaces',
        title: 'Scrollbar shape',
        why:
            'The thumb is a square block that fills the full width of the bar. No color makes a ' +
            'flat block sit well against a panel edge. These options round it and pull it in ' +
            'from the edge, and brighten it under the pointer. Color still comes from the ' +
            'scrollbar color round.',
        lookAt: 'A long panel beside a grid. Check the bar ends and the pointer hover.',
        options: [
            {
                id: 'pill',
                label: 'Pill',
                note: 'A 6px rounded thumb in the 10px bar.',
                recommended: true,
                vars: thumbShape('10px', '2px')
            },
            {
                id: 'slim',
                label: 'Slim pill',
                note: 'A 4px rounded thumb. The quietest.',
                vars: thumbShape('10px', '3px')
            },
            {
                id: 'block',
                label: 'Soft block',
                note: 'An 8px thumb with a small corner radius.',
                vars: thumbShape('3px', '1px')
            }
        ]
    },
    {
        id: 'light-widget-headers',
        theme: 'light',
        topic: 'Surfaces',
        title: 'Dashboard widget headers',
        why:
            'Widget headers in a DashCanvas now follow the panel title color by default. On a ' +
            'light page a dashboard has many of them, and the full blue-gray bar is heavy. ' +
            'These options give widgets a lighter bar of their own, in near neutral grays. ' +
            'Panels and dialogs do not change.',
        lookAt: 'Components > ViewManager and the Home page. Compare a widget with a panel.',
        options: [
            {
                id: 'gray',
                label: 'Gray tint',
                note: 'The widget header Hoist ships today, for reference. Gray on a gray tint.',
                vars: widgetTitle('var(--xh-intent-neutral-trans1)', 'var(--xh-gray)')
            },
            {
                id: 'cool',
                label: 'Cool gray',
                note: 'A neutral bar, a step below the toolbar. Dark slate title, at 7.9:1.',
                recommended: true,
                vars: widgetTitle(n(0.92, 0.007), n(0.38, 0.02))
            },
            {
                id: 'steel',
                label: 'Steel gray',
                note: 'A firmer gray bar, 1.6:1 against the page. Title at 8.6:1.',
                vars: widgetTitle(n(0.85, 0.012), n(0.3, 0.02))
            }
        ],
        watch: [
            {
                label: 'Widget title text',
                fg: '--xh-dash-canvas-widget-title-text-color',
                bg: '--xh-dash-canvas-widget-title-bg',
                kind: 'body'
            },
            {
                label: 'Widget bar vs page',
                fg: '--xh-dash-canvas-widget-title-bg',
                bg: '--xh-bg',
                kind: 'info'
            },
            {
                label: 'Panel bar vs widget bar',
                fg: '--xh-title-bg',
                bg: '--xh-dash-canvas-widget-title-bg',
                kind: 'info'
            }
        ]
    },
    {
        id: 'dark-tree-colors',
        theme: 'dark',
        topic: 'Grids and trees',
        title: 'Tree color groups',
        why:
            'The colors tree style gives each level its own hue. The dark values are deep ' +
            'jewel tones at uneven strength, so magenta and crimson shout over blue. These ' +
            'options hold every level to one lightness and one strength. The light theme ' +
            'values are the shipped ones and have no round. In both themes a level now shows ' +
            'its color only while it is open. That is built into Hoist, so it also shows ' +
            'under Shipped.',
        lookAt: 'Grids > Tree. Set Tree Style to Color Groups, then expand a few levels.',
        options: [
            {
                id: 'calm',
                label: 'Calm',
                note: 'The shipped hue order at an even, lower strength: navy, indigo, plum, maroon.',
                recommended: true,
                vars: darkTreeLevels(0.27, 0.04)
            },
            {
                id: 'muted',
                label: 'Muted',
                note: 'The same hues with a hint of color only. The quietest.',
                vars: darkTreeLevels(0.265, 0.025)
            },
            {
                id: 'light-order',
                label: 'Light theme order',
                note: 'Blue, green, yellow, orange, as in light. When dark these turn olive and brown.',
                vars: darkTreeLevels(0.27, 0.04, LIGHT_TREE_HUES)
            }
        ],
        watch: [
            {
                label: 'Text on level 1',
                fg: '--xh-grid-text-color',
                bg: '--xh-grid-tree-group-level-0-bg',
                kind: 'body'
            },
            {
                label: 'Level 1 vs row',
                fg: '--xh-grid-tree-group-level-0-bg',
                bg: '--xh-grid-bg',
                kind: 'info'
            },
            {
                label: 'Level 2 vs level 1',
                fg: '--xh-grid-tree-group-level-1-bg',
                bg: '--xh-grid-tree-group-level-0-bg',
                kind: 'info'
            }
        ]
    },
    {
        id: 'dark-header-edge',
        theme: 'dark',
        topic: 'Surfaces',
        title: 'Panel header edge',
        why:
            'Stacked panels rely on a border line to keep their headers apart. With the darker ' +
            'title bars, that line has the same lightness as the bar, so a header runs into ' +
            'the one below it. These options give every panel header its own line along the ' +
            'bottom edge. It follows the title bar, whichever one you pick.',
        lookAt: 'Layout > Panel Sizing. Check the outer header against Left Panel and Right Panel.',
        options: [
            {
                id: 'cut',
                label: 'Dark cut',
                note: 'A line in the page color. Reads as a gap between two bars.',
                recommended: true,
                vars: {'--xh-panel-title-border-color': 'var(--xh-bg)'}
            },
            {
                id: 'soft',
                label: 'Soft cut',
                note: 'A darker shade of the bar itself. Quieter than the page color.',
                vars: {
                    '--xh-panel-title-border-color':
                        'color-mix(in oklch, var(--xh-title-bg), black 30%)'
                }
            },
            {
                id: 'light',
                label: 'Light edge',
                note: 'A lighter shade of the bar. Reads as a raised edge.',
                vars: {
                    '--xh-panel-title-border-color':
                        'color-mix(in oklch, var(--xh-title-bg), white 16%)'
                }
            }
        ],
        watch: [
            {
                label: 'Edge line vs title bar',
                fg: '--xh-panel-title-border-color',
                bg: '--xh-title-bg',
                kind: 'info'
            }
        ]
    },

    //------------------------------------------------------------------
    // Intents
    //------------------------------------------------------------------
    {
        id: 'light-intent-primary',
        theme: 'light',
        topic: 'Intents and toasts',
        title: 'Primary intent',
        why:
            'Primary passes today: a white label and blue text are both 7.4:1. Each intent has ' +
            'seven hand-set shades, though, and the four intents sit at four lightness levels. ' +
            'These options set one fill color. Hover, pressed, tint and text derive from it by ' +
            'one rule that every intent shares.',
        lookAt: INTENT_LOOK_AT,
        options: [
            {
                id: 'hoist',
                label: 'Hoist blue',
                note: 'The blue Hoist ships today, on the shared rule.',
                recommended: true,
                vars: intentVars('primary', 'light', 'oklch(0.45 0.128 250)')
            },
            {
                id: 'royal',
                label: 'Royal',
                note: 'Bluer and more saturated. Less teal than today.',
                vars: intentVars('primary', 'light', 'oklch(0.46 0.16 257)')
            },
            {
                id: 'ink',
                label: 'Ink navy',
                note: 'Darker and quieter. Reads as navy.',
                vars: intentVars('primary', 'light', 'oklch(0.4 0.12 254)')
            }
        ],
        watch: intentWatch('primary')
    },
    {
        id: 'light-intent-success',
        theme: 'light',
        topic: 'Intents and toasts',
        title: 'Success intent',
        why:
            'Success text is 4.48:1 on the page, 4.10:1 on a toolbar and 3.72:1 on its own ' +
            'callout tint. A white label on a success button is 4.48:1. Positive values in ' +
            'grids use the same color.',
        lookAt: `${INTENT_LOOK_AT} Then a grid with positive values.`,
        options: [
            {
                id: 'leaf',
                label: 'Leaf',
                note: 'The green of today, one step deeper so it passes on every surface.',
                recommended: true,
                vars: intentVars('success', 'light', 'oklch(0.5 0.14 145)')
            },
            {
                id: 'emerald',
                label: 'Emerald',
                note: 'A cooler green, away from yellow.',
                vars: intentVars('success', 'light', 'oklch(0.5 0.115 158)')
            },
            {
                id: 'forest',
                label: 'Forest',
                note: 'Darker and more reserved.',
                vars: intentVars('success', 'light', 'oklch(0.47 0.12 150)')
            }
        ],
        watch: [
            ...intentWatch('success'),
            {
                label: 'Positive value in grid',
                fg: '--xh-pos-val-color',
                bg: '--xh-grid-bg',
                kind: 'body'
            }
        ]
    },
    {
        id: 'light-intent-warning',
        theme: 'light',
        topic: 'Intents and toasts',
        title: 'Warning intent',
        why:
            'Warning is the weakest intent. Its text is 3.36:1 on the page and 2.84:1 on its ' +
            'callout tint, and a white label on a warning button is 3.36:1. An orange that is ' +
            'dark enough for a white label reads as burnt orange. The other route is a bright ' +
            'fill with a dark label.',
        lookAt: INTENT_LOOK_AT,
        options: [
            {
                id: 'burnt',
                label: 'Burnt orange',
                note: 'Deep enough for a white label and for text.',
                recommended: true,
                vars: intentVars('warning', 'light', 'oklch(0.55 0.14 52)')
            },
            {
                id: 'rust',
                label: 'Rust',
                note: 'Redder and a touch darker.',
                vars: intentVars('warning', 'light', 'oklch(0.53 0.15 45)')
            },
            {
                id: 'amber',
                label: 'Amber, dark label',
                note: 'A bright amber fill with a dark label. Text is a deep amber. Hoist needs a new label color var for this.',
                vars: {
                    ...intentVars(
                        'warning',
                        'light',
                        'oklch(0.78 0.16 72)',
                        'oklch(from var(--xh-intent-warning) 0.5 calc(c * 0.8) h)'
                    ),
                    '--tn-on-warning': 'var(--xh-neutral-11)'
                },
                css: AMBER_LABEL_CSS
            },
            {
                id: 'vivid',
                label: 'Vivid orange',
                note: 'Halfway between shipped and burnt, at full strength. A white label is 4.2:1.',
                vars: intentVars('warning', 'light', 'oklch(0.6 0.16 48)')
            },
            {
                id: 'ember',
                label: 'Ember',
                note: 'The brightest orange that holds a white label at 4.5:1. A little redder to stay vivid.',
                vars: intentVars('warning', 'light', 'oklch(0.58 0.165 45)')
            }
        ],
        watch: intentWatch('warning', ON_WARNING)
    },
    {
        id: 'light-intent-danger',
        theme: 'light',
        topic: 'Intents and toasts',
        title: 'Danger intent',
        why:
            'Danger passes today at 6.9:1 for a white label and for text. The options move it ' +
            'onto the shared rule. Negative values in grids use the same color.',
        lookAt: `${INTENT_LOOK_AT} Then a grid with negative values.`,
        options: [
            {
                id: 'hoist',
                label: 'Hoist red',
                note: 'The red Hoist ships today, on the shared rule.',
                recommended: true,
                vars: intentVars('danger', 'light', 'oklch(0.488 0.182 27)')
            },
            {
                id: 'crimson',
                label: 'Crimson',
                note: 'A cooler red.',
                vars: intentVars('danger', 'light', 'oklch(0.5 0.19 22)')
            }
        ],
        watch: [
            ...intentWatch('danger'),
            {
                label: 'Negative value in grid',
                fg: '--xh-neg-val-color',
                bg: '--xh-grid-bg',
                kind: 'body'
            }
        ]
    },
    {
        id: 'dark-intent-primary',
        theme: 'dark',
        topic: 'Intents and toasts',
        title: 'Primary intent',
        why:
            'A white label on a primary button is 3.94:1 in dark. The fill is a little too ' +
            'bright for it. These options deepen the fill until the label passes, and derive ' +
            'the other shades from it.',
        lookAt: INTENT_LOOK_AT,
        options: [
            {
                id: 'clear',
                label: 'Clear blue',
                note: 'The hue of today, one step deeper.',
                recommended: true,
                vars: intentVars('primary', 'dark', 'oklch(0.55 0.17 254)')
            },
            {
                id: 'royal',
                label: 'Royal',
                note: 'Bluer and more saturated.',
                vars: intentVars('primary', 'dark', 'oklch(0.55 0.19 259)')
            }
        ],
        watch: intentWatch('primary')
    },
    {
        id: 'dark-intent-success',
        theme: 'dark',
        topic: 'Intents and toasts',
        title: 'Success intent',
        why:
            'A white label on a success button is 3.65:1 in dark. Success text passes, but it ' +
            'is a hand-set color that does not follow the fill.',
        lookAt: `${INTENT_LOOK_AT} Then a grid with positive values.`,
        options: [
            {
                id: 'leaf',
                label: 'Leaf',
                note: 'The green of today, one step deeper.',
                recommended: true,
                vars: intentVars('success', 'dark', 'oklch(0.54 0.15 146)')
            },
            {
                id: 'emerald',
                label: 'Emerald',
                note: 'A cooler green, away from yellow.',
                vars: intentVars('success', 'dark', 'oklch(0.54 0.125 158)')
            }
        ],
        watch: [
            ...intentWatch('success'),
            {
                label: 'Positive value in grid',
                fg: '--xh-pos-val-color',
                bg: '--xh-grid-bg',
                kind: 'body'
            }
        ]
    },
    {
        id: 'dark-intent-warning',
        theme: 'dark',
        topic: 'Intents and toasts',
        title: 'Warning intent',
        why:
            'A white label on a warning button is 3.84:1 in dark. Warning text passes. As in ' +
            'light, the choice is a deeper orange with a white label, or a bright amber with a ' +
            'dark one.',
        lookAt: INTENT_LOOK_AT,
        options: [
            {
                id: 'burnt',
                label: 'Burnt orange',
                note: 'Deep enough for a white label.',
                recommended: true,
                vars: intentVars('warning', 'dark', 'oklch(0.56 0.14 52)')
            },
            {
                id: 'amber',
                label: 'Amber, dark label',
                note: 'A bright amber fill with a dark label. Hoist needs a new label color var for this.',
                vars: {
                    ...intentVars(
                        'warning',
                        'dark',
                        'oklch(0.78 0.16 72)',
                        'var(--xh-intent-warning)'
                    ),
                    '--tn-on-warning': 'var(--xh-neutral-0)'
                },
                css: AMBER_LABEL_CSS
            },
            {
                id: 'ember',
                label: 'Ember',
                note: 'Between shipped and burnt, at full strength. A white label is 4.5:1.',
                vars: intentVars('warning', 'dark', 'oklch(0.585 0.165 46)')
            }
        ],
        watch: intentWatch('warning', ON_WARNING)
    },
    {
        id: 'dark-intent-danger',
        theme: 'dark',
        topic: 'Intents and toasts',
        title: 'Danger intent',
        why:
            'A danger button is only 2.54:1 against the dark page, so it recedes where it ' +
            'should stand out. Danger text on a minimal button is 4.36:1. These options ' +
            'brighten the fill and derive the text from it.',
        lookAt: `${INTENT_LOOK_AT} Then a grid with negative values.`,
        options: [
            {
                id: 'red',
                label: 'Clear red',
                note: 'Brighter than today. A white label still passes.',
                recommended: true,
                vars: intentVars('danger', 'dark', 'oklch(0.52 0.19 27)')
            },
            {
                id: 'bright',
                label: 'Bright red',
                note: 'One step brighter again.',
                vars: intentVars('danger', 'dark', 'oklch(0.55 0.2 25)')
            }
        ],
        watch: [
            ...intentWatch('danger'),
            {
                label: 'Negative value in grid',
                fg: '--xh-neg-val-color',
                bg: '--xh-grid-bg',
                kind: 'body'
            }
        ]
    },
    TOAST_ROUND,
    ...FORM_ROUNDS,
    BRAND_ROUND,
    CAPS_ROUND,
    BUTTON_ROUND,
    BASE_ROUND,
    STATE_ROUND,
    STANDARD_BUTTON_ROUND,
    RAISED_ROUND
];
