import type {ColorSpec, PairKind} from './ContrastPairs';

export type ThemeKey = 'light' | 'dark';

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

/** One decision, shown as a set of options to flip between. */
export interface TunerRound {
    id: string;
    theme: ThemeKey;
    title: string;
    why: string;
    lookAt: string;
    options: TunerOption[];
    seeds?: string[];
    watch?: WatchPair[];
}

export const SEEDS: TunerSeed[] = [
    {
        name: '--tn-h',
        label: 'Neutral hue',
        help: 'OKLCH hue shared by every neutral. 232 is the slate blue Hoist uses today.',
        min: 0,
        max: 360,
        step: 1,
        themes: ['light', 'dark']
    },
    {
        name: '--tn-c',
        label: 'Neutral tint',
        help: 'Chroma multiplier for every neutral. 0 is pure gray.',
        min: 0,
        max: 3,
        step: 0.05,
        themes: ['light', 'dark']
    },
    {
        name: '--tn-d',
        label: 'Surface depth',
        help: 'Lightness added to every dark surface and border. Text is not moved.',
        min: -0.04,
        max: 0.1,
        step: 0.005,
        themes: ['dark']
    }
];

//------------------------------------------------------------------
// Neutral ramps. Always defined while the tuner is on. They change
// nothing until a round option points an --xh-* var at them.
//------------------------------------------------------------------
const n = (l: number, c: number) => `oklch(${l} calc(${c} * var(--tn-c)) var(--tn-h))`;
const d = (l: number, c: number) =>
    `oklch(calc(${l} + var(--tn-d)) calc(${c} * var(--tn-c)) var(--tn-h))`;

export const BASE: Record<ThemeKey, VarMap> = {
    light: {
        '--tn-h': '232',
        '--tn-c': '1',
        '--tn-1': n(0.985, 0.002), // stripe, subtle fill
        '--tn-2': n(0.968, 0.004), // chrome: toolbars, app bar, sidebars
        '--tn-3': n(0.94, 0.006), // hover fill, tracks
        '--tn-4': n(0.915, 0.007), // hairlines
        '--tn-5': n(0.87, 0.009), // quiet border
        '--tn-6': n(0.8, 0.012), // defined border
        '--tn-7': n(0.63, 0.016), // control outline, 3:1 on white
        '--tn-8': n(0.53, 0.02), // muted text, 4.5:1 on chrome
        '--tn-9': n(0.45, 0.025), // secondary text
        '--tn-10': n(0.31, 0.02), // body text
        '--tn-11': n(0.24, 0.018) // strong text
    },
    dark: {
        '--tn-h': '232',
        '--tn-c': '1',
        '--tn-d': '0',
        '--tn-0': d(0.155, 0.008), // sunken: tracks, wells
        '--tn-1': d(0.19, 0.01), // app background
        '--tn-2': d(0.215, 0.011), // stripe
        '--tn-3': d(0.245, 0.013), // chrome: toolbars, app bar, sidebars
        '--tn-4': d(0.285, 0.015), // raised, hover fill
        '--tn-5': d(0.33, 0.016), // hairlines
        '--tn-6': d(0.39, 0.018), // border
        '--tn-7': d(0.55, 0.02), // control outline, 3:1 on chrome
        '--tn-8': n(0.72, 0.018), // muted text
        '--tn-9': n(0.8, 0.015), // secondary text
        '--tn-10': n(0.94, 0.008), // body text
        '--tn-11': n(0.98, 0.004) // strong text
    }
};

const lightNeutrals: VarMap = {
    '--xh-bg-alt': 'var(--tn-2)',
    '--xh-panel-collapsed-strip-bg': 'var(--tn-2)',
    '--xh-panel-collapsed-strip-hover-bg': 'var(--tn-4)',
    '--xh-resizable-bg': 'var(--tn-2)',
    '--xh-resizable-border-color': 'var(--tn-5)',
    '--xh-loading-indicator-bg': 'var(--tn-4)'
};

const lightSecondaryText: VarMap = {
    // Deliberately quieter than other secondary text: a hint, not a label.
    '--xh-input-placeholder-text-color': 'var(--tn-7)',
    '--xh-neutral-val-color': 'var(--tn-8)',
    '--xh-menu-heading-text-color': 'var(--tn-9)',
    '--xh-separator-label-text-color': 'var(--tn-9)',
    '--xh-property-table-label-text-color': 'var(--tn-9)',
    '--xh-property-table-empty-text-color': 'var(--tn-9)',
    '--xh-panel-collapsed-strip-icon-color': 'var(--tn-9)',
    '--xh-loading-indicator-text-color': 'var(--tn-9)'
};

const lightGridGroup: VarMap = {
    '--xh-grid-group-bg': n(0.54, 0.03),
    '--xh-grid-group-border-color': 'var(--tn-6)'
};

const darkSurfaces: VarMap = {
    '--xh-bg': 'var(--tn-1)',
    '--xh-bg-alt': 'var(--tn-3)',
    '--xh-toolbar-bg': 'var(--tn-3)',
    '--xh-grid-odd-row-bg': 'var(--tn-2)',
    '--xh-panel-collapsed-strip-bg': 'var(--tn-3)',
    '--xh-panel-collapsed-strip-hover-bg': 'var(--tn-4)',
    '--xh-resizable-bg': 'var(--tn-4)',
    '--xh-resizable-border-color': 'var(--tn-3)',
    '--xh-dash-canvas-grid-cell-color': 'var(--tn-0)',
    '--xh-loading-indicator-bg': 'var(--tn-5)'
};

const darkSecondaryText: VarMap = {
    '--xh-text-color-muted': 'var(--tn-8)',
    '--xh-input-placeholder-text-color': n(0.64, 0.018),
    '--xh-menu-heading-text-color': 'var(--tn-9)',
    '--xh-loading-indicator-text-color': 'var(--tn-9)',
    '--xh-panel-collapsed-strip-icon-color': 'var(--tn-8)',
    '--xh-panel-splitter-button-icon-color': 'var(--tn-9)'
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
            `oklch(calc(${l} + var(--tn-d)) ${c} ${hue})`
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

// Rows that are not an expanded parent go back to the standard row and stripe colors.
const TREE_COLORS_OPEN_ONLY_ROW =
    '.xh-grid.xh-grid--tree-style-colors .ag-row:not(.ag-row-group-expanded)' +
    ':not(.ag-row-selected):not(.ag-row-pinned):not(.ag-full-width-row)';
const TREE_COLORS_OPEN_ONLY_CSS =
    `${TREE_COLORS_OPEN_ONLY_ROW} { background-color: var(--ag-background-color) !important; }\n` +
    `${TREE_COLORS_OPEN_ONLY_ROW}.ag-row-odd { background-color: var(--ag-odd-row-background-color) !important; }`;

function treeColorsOpenRound(theme: ThemeKey): TunerRound {
    return {
        id: `${theme}-tree-colors-open`,
        theme,
        title: 'Tree color groups: open rows only',
        why:
            'The colors tree style fills every row above the deepest level, open or not. A ' +
            'collapsed tree is then one solid block of the top color. This option fills ' +
            'expanded parents only, the same rule the highlights style now uses. Other rows ' +
            'style as standard rows.',
        lookAt: 'Grids > Tree. Set Tree Style to Color Groups. Collapse all, then open one branch.',
        options: [
            {
                id: 'open',
                label: 'Open groups only',
                note: 'A level shows its color only while it is open.',
                recommended: true,
                vars: {},
                css: TREE_COLORS_OPEN_ONLY_CSS
            }
        ]
    };
}

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

export const ROUNDS: TunerRound[] = [
    //------------------------------------------------------------------
    // Light theme
    //------------------------------------------------------------------
    {
        id: 'light-neutrals',
        theme: 'light',
        title: 'One neutral family',
        why:
            'Light chrome mixes Material blue-gray with untinted grays, so toolbars read cool while ' +
            'grid stripes and borders read flat. These options put every surface on one ramp. ' +
            'They also lift toolbars from 95% to 97% lightness, which makes the chrome quieter.',
        lookAt: 'App bar, toolbars and side tabs together.',
        seeds: ['--tn-h', '--tn-c'],
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
                vars: {...lightNeutrals, '--tn-c': '0'}
            },
            {
                id: 'tinted',
                label: 'Stronger tint',
                note: 'Twice the chroma. More character, more blue.',
                vars: {...lightNeutrals, '--tn-c': '2'}
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
                vars: {...lightSecondaryText, '--xh-text-color-muted': 'var(--tn-8)'}
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
                    '--xh-text-color': 'var(--tn-10)',
                    '--xh-text-color-highlight': 'var(--tn-11)',
                    '--xh-appbar-title-text-color': 'var(--tn-9)'
                }
            },
            {
                id: 'ink',
                label: 'Ink',
                note: 'One step darker, about 16.4:1.',
                vars: {
                    '--xh-text-color': 'var(--tn-11)',
                    '--xh-text-color-highlight': 'var(--tn-11)',
                    '--xh-appbar-title-text-color': 'var(--tn-10)'
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
                    '--xh-border-color': 'var(--tn-5)',
                    '--xh-toolbar-border-color': 'var(--tn-5)',
                    '--xh-toolbar-separator-color': 'var(--tn-6)',
                    '--xh-grid-border-color': 'var(--tn-4)',
                    '--xh-grid-pinned-column-border-color': 'var(--tn-5)'
                }
            },
            {
                id: 'defined',
                label: 'Defined frames',
                note: 'Panel borders keep their current weight, on the shared hue.',
                vars: {
                    '--xh-border-color': 'var(--tn-6)',
                    '--xh-toolbar-border-color': 'var(--tn-6)',
                    '--xh-toolbar-separator-color': 'var(--tn-6)',
                    '--xh-grid-border-color': 'var(--tn-4)',
                    '--xh-grid-pinned-column-border-color': 'var(--tn-5)'
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
                    '--xh-scrollbar-bg': 'var(--tn-2)',
                    '--xh-scrollbar-thumb-color': n(0.8, 0.018)
                }
            },
            {
                id: 'balanced',
                label: 'Balanced',
                note: 'A clear thumb that stays in the background, 2.3:1.',
                recommended: true,
                vars: {
                    '--xh-scrollbar-bg': 'var(--tn-2)',
                    '--xh-scrollbar-thumb-color': n(0.72, 0.026)
                }
            },
            {
                id: 'visible',
                label: 'Visible',
                note: 'Meets 3:1 for control contrast. The heaviest of the three.',
                vars: {
                    '--xh-scrollbar-bg': 'var(--tn-2)',
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
                vars: {'--xh-grid-odd-row-bg': 'var(--tn-1)'}
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
                    '--xh-grid-row-hover-bg': 'var(--tn-3)',
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
        title: 'How dark is dark',
        why:
            'The page is 20% lightness and toolbars are 31%. That 10 point jump makes the chrome ' +
            'glow against the page. These options keep the slate hue and close the gap to about ' +
            '5 points. Deep keeps the current page. Dim lifts every surface.',
        lookAt: 'App bar and toolbars against the page, then a full grid.',
        seeds: ['--tn-d', '--tn-h', '--tn-c'],
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
                vars: {...darkSurfaces, '--tn-d': '0.055'}
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
                    '--xh-text-color': 'var(--tn-10)',
                    '--xh-text-color-highlight': 'var(--tn-11)',
                    '--xh-appbar-title-text-color': 'var(--tn-10)'
                }
            },
            {
                id: 'softer',
                label: 'Softer',
                note: 'About 13.7:1, close to the light theme.',
                vars: {
                    ...darkSecondaryText,
                    '--xh-text-color': n(0.9, 0.01),
                    '--xh-text-color-highlight': 'var(--tn-11)',
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
                    '--xh-border-color': 'var(--tn-5)',
                    '--xh-toolbar-border-color': 'var(--tn-5)',
                    '--xh-appbar-border-color': 'var(--tn-5)',
                    '--xh-toolbar-separator-color': 'var(--tn-6)',
                    '--xh-grid-border-color': 'var(--tn-3)',
                    '--xh-grid-pinned-column-border-color': 'var(--tn-5)'
                }
            },
            {
                id: 'defined',
                label: 'Defined frames',
                note: 'Panel borders at their current weight. Grid lines a little stronger.',
                vars: {
                    '--xh-border-color': 'var(--tn-6)',
                    '--xh-toolbar-border-color': 'var(--tn-6)',
                    '--xh-appbar-border-color': 'var(--tn-6)',
                    '--xh-toolbar-separator-color': 'var(--tn-7)',
                    '--xh-grid-border-color': 'var(--tn-4)',
                    '--xh-grid-pinned-column-border-color': 'var(--tn-6)'
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
                    '--xh-scrollbar-bg': 'var(--tn-1)',
                    '--xh-scrollbar-thumb-color': d(0.39, 0.025)
                }
            },
            {
                id: 'balanced',
                label: 'Balanced',
                note: 'A clear thumb that stays in the background, 2.6:1.',
                recommended: true,
                vars: {
                    '--xh-scrollbar-bg': 'var(--tn-1)',
                    '--xh-scrollbar-thumb-color': d(0.46, 0.03)
                }
            },
            {
                id: 'visible',
                label: 'Visible',
                note: 'Meets 3:1 for control contrast. The brightest of the three.',
                vars: {
                    '--xh-scrollbar-bg': 'var(--tn-1)',
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
                    '--xh-grid-row-hover-bg': `oklch(calc(0.265 + var(--tn-d)) 0.03 ${SEL_HUE})`,
                    '--xh-bg-highlight': `oklch(calc(0.34 + var(--tn-d)) 0.065 ${SEL_HUE})`,
                    '--xh-grid-tree-group-bg': `oklch(calc(0.26 + var(--tn-d)) 0.035 ${SEL_HUE})`,
                    '--xh-grid-group-bg': 'var(--tn-6)',
                    '--xh-grid-group-border-color': 'var(--tn-7)'
                }
            },
            {
                id: 'neutral-hover',
                label: 'Neutral hover',
                note: 'Hover is gray, so blue always means selected.',
                vars: {
                    '--xh-grid-row-hover-bg': 'var(--tn-4)',
                    '--xh-bg-highlight': `oklch(calc(0.34 + var(--tn-d)) 0.065 ${SEL_HUE})`,
                    '--xh-grid-tree-group-bg': `oklch(calc(0.26 + var(--tn-d)) 0.035 ${SEL_HUE})`,
                    '--xh-grid-group-bg': 'var(--tn-6)',
                    '--xh-grid-group-border-color': 'var(--tn-7)'
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
                vars: outline('var(--tn-7)')
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
                vars: outline('var(--tn-7)')
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
                vars: groupRow(n(0.91, 0.01), 'var(--tn-11)', 'var(--tn-5)')
            },
            {
                id: 'mid',
                label: 'Mid band',
                note: 'A clear cool gray band with a dark label.',
                vars: groupRow(n(0.83, 0.016), 'var(--tn-11)', 'var(--tn-6)')
            },
            {
                id: 'solid',
                label: 'Solid slate',
                note: 'The dark bar from the grid states round, white label.',
                vars: groupRow(n(0.54, 0.035), 'white', 'var(--tn-6)')
            }
        ],
        watch: groupRowWatch()
    },
    {
        id: 'dark-group-rows',
        theme: 'dark',
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
                vars: groupRow(d(0.3, 0.024), 'var(--tn-10)', 'var(--tn-6)')
            },
            {
                id: 'mid',
                label: 'Mid band',
                note: 'A clear band with a bright label.',
                vars: groupRow(d(0.37, 0.03), 'var(--tn-11)', 'var(--tn-7)')
            },
            {
                id: 'solid',
                label: 'Solid slate',
                note: 'The shipped weight on the shared hue.',
                vars: groupRow(d(0.43, 0.034), 'white', 'var(--tn-7)')
            }
        ],
        watch: groupRowWatch()
    },
    {
        id: 'light-tree',
        theme: 'light',
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
                    '--xh-grid-tree-group-border-color': 'var(--tn-5)'
                }
            }
        ],
        watch: treeWatch()
    },
    {
        id: 'dark-tree',
        theme: 'dark',
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
                    '--xh-grid-tree-group-bg': `oklch(calc(0.25 + var(--tn-d)) 0.03 ${SEL_HUE})`
                }
            },
            {
                id: 'neutral',
                label: 'Neutral',
                note: 'Gray tiers. Blue then only means selected.',
                vars: {
                    '--xh-grid-tree-group-bg': d(0.26, 0.014),
                    '--xh-grid-tree-group-border-color': 'var(--tn-5)'
                }
            }
        ],
        watch: treeWatch()
    },
    {
        id: 'light-headers',
        theme: 'light',
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
                vars: title(d(0.4, 0.04), 'var(--tn-11)')
            },
            {
                id: 'ink',
                label: 'Deep slate',
                note: 'A low bar, just above the toolbar.',
                vars: title(d(0.33, 0.035), 'var(--tn-10)')
            },
            {
                id: 'raised',
                label: 'Raised surface',
                note: 'Nearly neutral. The header reads as a raised surface.',
                vars: title(d(0.29, 0.018), 'var(--tn-10)')
            }
        ],
        watch: titleWatch()
    },
    {
        id: 'light-scrollbar-shape',
        theme: 'light',
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
        title: 'Tree color groups',
        why:
            'The colors tree style gives each level its own hue. The dark values are deep ' +
            'jewel tones at uneven strength, so magenta and crimson shout over blue. These ' +
            'options hold every level to one lightness and one strength. The light theme ' +
            'values are the shipped ones and have no round.',
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
    treeColorsOpenRound('light'),
    treeColorsOpenRound('dark')
];
