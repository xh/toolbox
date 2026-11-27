/**
 * A color to measure: a `--xh-*` var name, a literal CSS color, or an array of those layered
 * bottom to top (for a translucent fill over a surface).
 */
export type ColorSpec = string | string[];

/**
 * What a pair is held to.
 *  - body: text, WCAG 4.5:1.
 *  - sec: secondary text, WCAG 4.5:1.
 *  - ui: the edge or state of a control, WCAG 3:1.
 *  - info: surface separation. Reported, not graded.
 */
export type PairKind = 'body' | 'sec' | 'ui' | 'info';

export interface ContrastPair {
    section: string;
    use: string;
    fg: ColorSpec;
    bg: ColorSpec;
    kind: PairKind;
}

export const THRESHOLDS: Record<PairKind, number> = {body: 4.5, sec: 4.5, ui: 3, info: null};

const INTENTS = ['primary', 'success', 'warning', 'danger'];
const inputFill = ['--xh-bg', '--xh-input-bg'];
const inputFillAlt = ['--xh-bg-alt', '--xh-input-bg'];

function section(title: string, pairs: Array<[ColorSpec, ColorSpec, PairKind, string]>) {
    return pairs.map(([fg, bg, kind, use]) => ({section: title, use, fg, bg, kind}));
}

/** The fixed list of foreground and background pairs the tuner grades. */
export const CONTRAST_PAIRS: ContrastPair[] = [
    ...section('Text', [
        ['--xh-text-color', '--xh-bg', 'body', 'Text on page'],
        ['--xh-text-color', '--xh-bg-alt', 'body', 'Text on alt surface'],
        ['--xh-toolbar-text-color', '--xh-toolbar-bg', 'body', 'Toolbar'],
        ['--xh-appbar-text-color', '--xh-appbar-bg', 'body', 'App bar'],
        ['--xh-appbar-title-text-color', '--xh-appbar-bg', 'ui', 'App bar title (large)'],
        ['--xh-menu-item-text-color', '--xh-menu-bg', 'body', 'Menu item'],
        ['--xh-menu-item-text-color', '--xh-menu-item-highlight-bg', 'body', 'Menu item, hover'],
        ['--xh-tooltip-text-color', '--xh-tooltip-bg', 'body', 'Tooltip'],
        ['--xh-title-text-color', '--xh-title-bg', 'body', 'Panel and dialog title bar'],
        ['--xh-text-color-accent', '--xh-bg', 'body', 'Accent text'],
        ['--xh-tab-active-text-color', '--xh-bg', 'body', 'Active tab'],
        [
            '--xh-tab-switcher-vertical-item-active-text-color',
            '--xh-tab-switcher-vertical-item-active-bg',
            'body',
            'Active side tab'
        ]
    ]),
    ...section('Secondary text', [
        ['--xh-text-color-muted', '--xh-bg', 'sec', 'Muted on page'],
        ['--xh-text-color-muted', '--xh-bg-alt', 'sec', 'Muted on alt surface'],
        ['--xh-text-color-muted', '--xh-bg-highlight', 'sec', 'Muted on highlight'],
        ['--xh-text-color-muted', '--xh-grid-odd-row-bg', 'sec', 'Muted on grid stripe'],
        ['--xh-tab-switcher-vertical-item-text-color', '--xh-bg', 'sec', 'Inactive side tab'],
        ['--xh-menu-heading-text-color', '--xh-menu-bg', 'sec', 'Menu heading'],
        ['--xh-separator-label-text-color', '--xh-bg', 'sec', 'Separator label'],
        ['--xh-property-table-label-text-color', '--xh-bg', 'sec', 'Property table label'],
        ['--xh-stat-card-title-text-color', '--xh-stat-card-bg', 'sec', 'Stat card title']
    ]),
    ...section('Grid', [
        ['--xh-grid-text-color', '--xh-grid-bg', 'body', 'Cell'],
        ['--xh-grid-text-color', '--xh-grid-odd-row-bg', 'body', 'Cell, striped row'],
        ['--xh-grid-text-color', '--xh-grid-row-hover-bg', 'body', 'Cell, hovered row'],
        [
            '--xh-grid-row-selected-text-color',
            '--xh-grid-row-selected-bg',
            'body',
            'Cell, selected row'
        ],
        ['--xh-grid-text-color', '--xh-grid-tree-group-bg', 'body', 'Cell, tree group row'],
        ['--xh-grid-header-text-color', '--xh-grid-header-bg', 'sec', 'Column header'],
        ['--xh-grid-header-icon-color', '--xh-grid-header-bg', 'ui', 'Header icon'],
        ['--xh-grid-group-text-color', '--xh-grid-group-bg', 'body', 'Group row label'],
        ['--xh-grid-empty-text-color', '--xh-grid-bg', 'sec', 'Empty grid text'],
        ['--xh-pos-val-color', '--xh-grid-bg', 'body', 'Positive value'],
        ['--xh-neg-val-color', '--xh-grid-bg', 'body', 'Negative value'],
        ['--xh-neutral-val-color', '--xh-grid-bg', 'body', 'Neutral value'],
        ['--xh-pos-val-color', '--xh-grid-row-selected-bg', 'body', 'Positive value, selected'],
        ['--xh-neg-val-color', '--xh-grid-row-selected-bg', 'body', 'Negative value, selected'],
        ['--xh-grid-row-selected-bg', '--xh-grid-bg', 'info', 'Selected row vs row'],
        ['--xh-grid-row-selected-bg', '--xh-grid-row-hover-bg', 'info', 'Selected vs hovered row'],
        ['--xh-grid-row-hover-bg', '--xh-grid-bg', 'info', 'Hovered row vs row'],
        ['--xh-grid-odd-row-bg', '--xh-grid-bg', 'info', 'Stripe vs row'],
        ['--xh-grid-border-color', '--xh-grid-bg', 'info', 'Grid line vs row']
    ]),
    ...section('Inputs', [
        ['--xh-input-text-color', inputFill, 'body', 'Input text'],
        ['--xh-input-placeholder-text-color', inputFill, 'sec', 'Placeholder'],
        ['--xh-input-placeholder-text-color', inputFillAlt, 'sec', 'Placeholder, in toolbar'],
        ['--xh-form-field-label-text-color', '--xh-bg', 'body', 'Field label'],
        ['--xh-form-field-box-shadow-color-top', '--xh-bg', 'ui', 'Input outline vs page'],
        ['--xh-form-field-box-shadow-color-top', '--xh-bg-alt', 'ui', 'Input outline vs toolbar'],
        ['--xh-form-field-focused-border-color', '--xh-bg', 'ui', 'Focus ring vs page'],
        ['--xh-form-field-invalid-text-color', '--xh-bg', 'sec', 'Validation message']
    ]),
    ...section('Borders and surfaces', [
        ['--xh-border-color', '--xh-bg', 'info', 'Border vs page'],
        ['--xh-border-color', '--xh-bg-alt', 'info', 'Border vs alt surface'],
        ['--xh-toolbar-separator-color', '--xh-toolbar-bg', 'info', 'Toolbar separator'],
        ['--xh-bg-alt', '--xh-bg', 'info', 'Alt surface vs page'],
        ['--xh-scrollbar-thumb-color', '--xh-scrollbar-bg', 'ui', 'Scrollbar thumb vs track'],
        [
            '--xh-panel-collapsed-strip-icon-color',
            '--xh-panel-collapsed-strip-bg',
            'ui',
            'Collapsed panel icon'
        ]
    ]),
    ...section(
        'Intent text',
        INTENTS.flatMap(i => [
            [`--xh-intent-${i}-text-color`, '--xh-bg', 'body', `${i} text on page`],
            [`--xh-intent-${i}-text-color`, '--xh-bg-alt', 'body', `${i} text on alt surface`]
        ])
    )
];
