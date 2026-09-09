import {div, hbox, pre, span, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps, Intent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {isLocalDate} from '@xh/hoist/utils/datetime';
import classNames from 'classnames';
import {isArray, isBoolean, isDate, isNil, isNumber, isString} from 'lodash';
import {ReactNode} from 'react';
import './Demo.scss';

/**
 * Shared building blocks for the body of a Toolbox component demo - the counterpart to the
 * `Wrapper` rail harness. Example pages compose these rather than styling their own headers, rows
 * or cards, so demos read the same across inputs, grids, panels and charts.
 *
 * Page template convention: sections stack (`demoSection`) - they never tab. The standard order for
 * a component page is Playground -> Variants -> In a Toolbar -> In a Form. Not every section is
 * mandatory - omit a section rather than pad it.
 */

//------------------------------------------------------------------
// Page body
//------------------------------------------------------------------
export interface DemoPanelProps extends HoistProps {
    /** Toolbar above the body, for page-level controls such as a filter. */
    tbar?: ReactNode;
}

/**
 * The body of a demo page: a scrollable panel filling the demo region, holding stacked sections.
 * Pass `demoSection` elements as `item`/`items`.
 *
 * Every demo page needs the same panel here, so this keeps the sizing and scroll behavior in one
 * place - notably the horizontal scroll the sections rely on when the window is too narrow.
 */
export const [DemoPanel, demoPanel] = hoistCmp.withFactory<DemoPanelProps>({
    displayName: 'DemoPanel',
    render({className, tbar, children}) {
        return panel({
            className,
            width: '100%',
            height: '100%',
            scrollable: true,
            tbar,
            item: vbox({className: 'tbox-demo-body', items: children})
        });
    }
});

//------------------------------------------------------------------
// Section
//------------------------------------------------------------------
export interface DemoSectionProps extends HoistProps {
    /** Section label - rendered uppercase, small and muted, followed by a hairline rule. */
    title: ReactNode;
    /** Optional note, right-aligned on the header row - say what the section shows or drives. */
    note?: ReactNode;
    /** Intent for the label, e.g. `'primary'` for the one section tied to rail controls. */
    intent?: Intent;
}

/** A titled section within a demo panel: header row (label, rule, note) above stacked content. */
export const [DemoSection, demoSection] = hoistCmp.withFactory<DemoSectionProps>({
    displayName: 'DemoSection',
    className: 'tbox-demo-section',
    render({className, title, note, intent, children}) {
        return div({
            className: classNames(className, intent && `tbox-demo-section--${intent}`),
            items: [
                div({
                    className: 'tbox-demo-section__header',
                    items: [
                        span({className: 'tbox-demo-section__title', item: title}),
                        div({className: 'tbox-demo-section__rule'}),
                        span({className: 'tbox-demo-section__note', item: note, omit: !note})
                    ]
                }),
                div({className: 'tbox-demo-section__body', items: children})
            ]
        });
    }
});

//------------------------------------------------------------------
// Row
//------------------------------------------------------------------
export interface DemoRowProps extends HoistProps {
    /** Short label for the instance. */
    label: ReactNode;
    /** Optional one-line muted description - typically the props the instance sets. */
    info?: ReactNode;
}

/** A labeled instance: label / info / the control itself, stacked. Pass the control as `item`. */
export const [DemoRow, demoRow] = hoistCmp.withFactory<DemoRowProps>({
    displayName: 'DemoRow',
    className: 'tbox-demo-row',
    render({className, label, info, children}) {
        return vbox({
            className,
            items: [
                span({className: 'tbox-demo-row__label', item: label}),
                span({className: 'tbox-demo-row__info', item: info, omit: !info}),
                div({className: 'tbox-demo-row__control', items: children})
            ]
        });
    }
});

//------------------------------------------------------------------
// Playground
//------------------------------------------------------------------
export interface DemoPlaygroundProps extends HoistProps {
    /** The generated factory call for the current rail settings - see `fmtDemoConfig`. */
    config: string;
    /** The playground instance's current bound value, shown beside the config. */
    value?: unknown;
    /** False to omit the current-value readout. Default true. */
    showValue?: boolean;
    /** Caption under the instance. */
    caption?: ReactNode;
    /** Fixed width of the instance column. Default 340. */
    instanceWidth?: number;
}

/**
 * The Playground band: a primary-accented frame holding the live instance driven by the rail's
 * Playground options (left), the literal config a developer would write to get it (center), and
 * the instance's current bound value (right).
 */
export const [DemoPlayground, demoPlayground] = hoistCmp.withFactory<DemoPlaygroundProps>({
    displayName: 'DemoPlayground',
    className: 'tbox-demo-playground',
    render({
        className,
        config,
        value,
        showValue = true,
        caption = 'Combine the curated props in any permutation.',
        instanceWidth = 340,
        children
    }) {
        return hbox({
            className,
            items: [
                vbox({
                    className: 'tbox-demo-playground__instance',
                    width: instanceWidth,
                    items: [
                        div({className: 'tbox-demo-playground__instance-body', items: children}),
                        span({className: 'tbox-demo-playground__caption', item: caption})
                    ]
                }),
                vbox({
                    className: 'tbox-demo-playground__config',
                    items: [
                        span({
                            className: 'tbox-demo-playground__config-label',
                            item: 'Current config'
                        }),
                        pre({className: 'tbox-demo-playground__code', item: config})
                    ]
                }),
                vbox({
                    className: 'tbox-demo-playground__value',
                    omit: !showValue,
                    items: [
                        span({
                            className: 'tbox-demo-playground__config-label',
                            item: 'Current value'
                        }),
                        pre({
                            className: 'tbox-demo-playground__code',
                            item: fmtDemoValue(value)
                        })
                    ]
                })
            ]
        });
    }
});

//------------------------------------------------------------------
// Frame, Toolbar, Grid
//------------------------------------------------------------------
export interface DemoFrameProps extends HoistProps {
    /** Caption label. */
    label?: ReactNode;
    /** Muted description beside the label. */
    info?: ReactNode;
    /** Right-aligned monospace chip, e.g. a measured size. */
    chip?: ReactNode;
}

/** A bordered card with an optional caption row, for hosting an instance in context. */
export const [DemoFrame, demoFrame] = hoistCmp.withFactory<DemoFrameProps>({
    displayName: 'DemoFrame',
    className: 'tbox-demo-frame',
    render({className, label, info, chip, children}) {
        const hasCaption = !isNil(label) || !isNil(info) || !isNil(chip);
        return div({
            className,
            items: [
                div({
                    className: 'tbox-demo-frame__caption',
                    omit: !hasCaption,
                    items: [
                        span({
                            className: 'tbox-demo-frame__label',
                            item: label,
                            omit: isNil(label)
                        }),
                        span({className: 'tbox-demo-frame__info', item: info, omit: isNil(info)}),
                        span({className: 'tbox-demo-frame__chip', item: chip, omit: isNil(chip)})
                    ]
                }),
                div({className: 'tbox-demo-frame__body', items: children})
            ]
        });
    }
});

export interface DemoToolbarProps extends HoistProps {
    /** True to render the compact toolbar variant. */
    compact?: boolean;
}

/**
 * A real `toolbar` inside a captioned frame, labeled Standard or Compact with the toolbar's
 * min-height token value as a chip. Render one of each to show a component in both densities.
 */
export const [DemoToolbar, demoToolbar] = hoistCmp.withFactory<DemoToolbarProps>({
    displayName: 'DemoToolbar',
    className: 'tbox-demo-toolbar',
    render({className, compact = false, children}) {
        return demoFrame({
            className,
            label: compact ? 'Compact' : 'Standard',
            info: compact
                ? 'compact: true - smaller type and controls throughout'
                : 'Default toolbar height, 30px controls',
            chip: `${readCssVar(compact ? '--xh-tbar-compact-min-size' : '--xh-tbar-min-size')}px`,
            item: toolbar({compact, items: children})
        });
    }
});

export interface DemoGridProps extends HoistProps {
    /** Equal-width columns. Default 3. */
    columns?: number;
}

/** An equal-column grid for variant cards. */
export const [DemoGrid, demoGrid] = hoistCmp.withFactory<DemoGridProps>({
    displayName: 'DemoGrid',
    className: 'tbox-demo-grid',
    render({className, columns = 3, children}) {
        return div({
            className,
            style: {gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`},
            items: children
        });
    }
});

//------------------------------------------------------------------
// Gallery
//------------------------------------------------------------------
export interface DemoGalleryProps extends HoistProps {
    /** Minimum tile width in px - tiles auto-fill the row. Default 240. */
    minTileWidth?: number;
}

/** A responsive tile grid for index pages. */
export const [DemoGallery, demoGallery] = hoistCmp.withFactory<DemoGalleryProps>({
    displayName: 'DemoGallery',
    className: 'tbox-demo-gallery',
    render({className, minTileWidth = 240, children}) {
        return div({
            className,
            style: {gridTemplateColumns: `repeat(auto-fill, minmax(${minTileWidth}px, 1fr))`},
            items: children
        });
    }
});

export interface DemoGalleryTileProps extends HoistProps {
    /** Component name. */
    title: ReactNode;
    /** One-line description. */
    description?: ReactNode;
    /** Navigation handler for the tile. Clicks within the instance do not trigger it. */
    onClick?: () => void;
    /** False to collapse the tile to its name row, for fast scanning. Default true. */
    showInstance?: boolean;
}

/**
 * A gallery tile: name row with a navigation affordance, description, and a live instance. The
 * tile navigates on click, except within the instance, which stays interactive.
 */
export const [DemoGalleryTile, demoGalleryTile] = hoistCmp.withFactory<DemoGalleryTileProps>({
    displayName: 'DemoGalleryTile',
    className: 'tbox-demo-gallery-tile',
    render({className, title, description, onClick, showInstance = true, children}) {
        return div({
            className: classNames(
                className,
                onClick && 'tbox-demo-gallery-tile--clickable',
                !showInstance && 'tbox-demo-gallery-tile--compact'
            ),
            onClick,
            items: [
                div({
                    className: 'tbox-demo-gallery-tile__name',
                    items: [span(title), Icon.arrowRight({omit: !onClick})]
                }),
                div({
                    className: 'tbox-demo-gallery-tile__description',
                    item: description,
                    omit: !showInstance || !description
                }),
                div({
                    className: 'tbox-demo-gallery-tile__instance',
                    omit: !showInstance,
                    // Keep the live instance usable: swallow clicks (including those bubbling from
                    // popover portals via the React tree) so they do not navigate.
                    onClick: e => e.stopPropagation(),
                    items: children
                })
            ]
        });
    }
});

//------------------------------------------------------------------
// Config snippet
//------------------------------------------------------------------
/** A value for `fmtDemoConfig` - primitives are quoted as literals; `raw()` passes code through. */
export type DemoConfigValue = string | number | boolean | null | undefined | {raw: string};

/** Mark a snippet value as code to emit verbatim, e.g. `raw('Icon.mail()')`. */
export function raw(code: string): {raw: string} {
    return {raw: code};
}

/**
 * A curated subset of a component's props, valued for display. Keys are checked against `P`, so
 * pass the component's own props interface and a misspelled prop fails to compile, with a
 * suggested correction.
 *
 * It catches typos, which is the point. It is not an allowlist: these `*Props` interfaces reach
 * `HTMLAttributes` through `BoxProps`, so `keyof P` includes every DOM attribute and handler.
 */
export type DemoConfigProps<P> = {[K in keyof P]?: DemoConfigValue} & {
    /**
     * Children. Every Hoist element factory accepts these alongside the component's own props
     * (see `core/elem.ts`), so they are valid in a snippet without appearing on any `*Props`.
     */
    item?: DemoConfigValue;
    items?: DemoConfigValue;
};

/**
 * Format a factory call for display in a Playground, e.g. `textInput({bind: 'value', ...})`.
 * Props with `undefined` values are omitted, so callers can pass `enableClear: flag || undefined`
 * to show only the props that differ from the default.
 *
 * Always pass the component's props interface as the type argument -
 * `fmtDemoConfig<TextInputProps>('textInput', {...})`. That is what makes the snippet's keys
 * compile-checked against the real component, keeping it from drifting from the live instance
 * beside it. Omitting it infers the keys from the literal and checks nothing.
 */
export function fmtDemoConfig<P>(factory: string, props: DemoConfigProps<P>): string {
    // Object.entries widens a generic mapped type's values to unknown; DemoConfigProps declares
    // every value as a DemoConfigValue, so narrowing back is safe.
    const entries = Object.entries(props) as Array<[string, DemoConfigValue]>,
        lines = entries
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `    ${k}: ${fmtValue(v)}`);
    return lines.length ? `${factory}({\n${lines.join(',\n')}\n})` : `${factory}()`;
}

/**
 * Format a live bound value for the Playground readout - primitives inline, Dates and LocalDates
 * tagged with their type, and other objects as pretty-printed JSON. Strings keep their newlines,
 * which the readout renders as-is.
 */
export function fmtDemoValue(v: unknown): string {
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (isString(v)) return quoteLiteral(v, true);
    if (isNumber(v) || isBoolean(v)) return String(v);
    if (isDate(v)) return `Date ${v.toISOString()}`;
    if (isLocalDate(v)) return `LocalDate ${v.isoString}`;
    if (isArray(v)) return `[${v.map(fmtDemoValue).join(', ')}]`;
    return JSON.stringify(v, null, 2);
}

function fmtValue(v: DemoConfigValue): string {
    if (v === null) return 'null';
    if (isString(v)) return quoteLiteral(v);
    if (isNumber(v) || isBoolean(v)) return String(v);
    return v.raw;
}

/**
 * Render a string as a single-quoted JS literal, escaping backslashes before quotes so a value a
 * user typed into a demo input round-trips instead of producing a broken escape.
 *
 * Newlines are escaped by default, keeping a config snippet valid, copyable code. The value
 * readout passes `multiline` to keep them, so a TextArea's line breaks show as they are.
 */
function quoteLiteral(v: string, multiline = false): string {
    const escaped = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${multiline ? escaped : escaped.replace(/\n/g, '\\n')}'`;
}

function readCssVar(name: string): string {
    return window.getComputedStyle(document.body).getPropertyValue(name).trim();
}
