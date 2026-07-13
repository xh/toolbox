import {code, div, hframe, span, vbox, vframe} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {hoistCmp, HoistModel, HoistProps, useLocalModel} from '@xh/hoist/core';
import {button, ButtonProps} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {isArray, isEmpty} from 'lodash';
import {ReactElement, ReactNode} from 'react';
import {toolboxLink, ToolboxLinkProps} from '../../core/cmp/ToolboxLink';
import './Wrapper.scss';

export interface WrapperProps extends HoistProps {
    /** Component/pattern name shown in the info rail header. */
    title: ReactNode;

    /** Optional icon shown beside the title in the info rail header. */
    icon?: ReactElement;

    /**
     * Optional status tag, rendered as a compact tinted banner at the very top of the info rail -
     * an easily-visible (but deliberately non-alarming) flag for examples with a notable
     * lifecycle status. Primary use is marking components that are *incubating in Toolbox* -
     * i.e. built and demo'd here as candidate patterns rather than shipped as part of Hoist.
     */
    statusTag?: WrapperStatusTagSpec;

    /**
     * Intro text for the Component/pattern demo'd by this tab, as Markdown. Rendered in the info
     * rail via Hoist's `markdown` component, so backticks for code symbols, `[text](url)` links,
     * and blank-line-separated paragraphs all work. May be provided as a single string or as an
     * array of lines, which are joined with newlines - within a paragraph these render as spaces
     * (not breaks), so a long description can be wrapped across array entries for readable source,
     * with an empty-string entry marking a paragraph break.
     */
    description?: string | string[];

    /**
     * Controls that customize how *this example is displayed* - e.g. switches, selects, and
     * number inputs that toggle chrome, themes, sizing, or modes. Rendered in a consistent
     * "Options" section in the info rail, below the description and above the resource links,
     * so the demo content itself stays focused on what it is demonstrating.
     *
     * Provide already-constructed control elements (each owning its own `model` / `bind`), most
     * commonly wrapped with the `wrapperOption` helper for a consistent labeled row. A demo
     * *trigger* that re-runs the example to reflect changed options (e.g. a "Load Now" button) also
     * belongs here - render it as a full-width `button` after the option rows. Controls intrinsic to
     * the thing being demonstrated should stay in the demo content.
     */
    options?: ReactNode;

    /**
     * Links to display for this tab, pointing either to relevant source code within XH
     * repos or to external sites. Provided as objects with `url` and optional `text` / `notes`.
     */
    links?: ToolboxLinkProps[];
}

export interface WrapperStatusTagSpec {
    /** Short label, e.g. "Incubating in Toolbox". */
    label: ReactNode;

    /** Icon shown beside the label. Defaults to `Icon.experiment()`. */
    icon?: ReactElement;

    /** Optional muted explanatory line rendered below the label. */
    info?: ReactNode;
}

/** A styled container used to wrap component examples within Toolbox. */
export const [Wrapper, wrapper] = hoistCmp.withFactory<WrapperProps>({
    displayName: 'Wrapper',
    className: 'tbox-wrapper',
    render({className, title, icon, statusTag, description, options, links, children}) {
        const railModel = useLocalModel(WrapperRailModel),
            intro = isArray(description) ? description.join('\n') : description,
            // Omit the info rail entirely when there is nothing to show in it, so the demo simply
            // fills the frame (rather than rendering an empty rail beside it).
            hasRailContent = !!title || !!intro || !isEmpty(options) || !isEmpty(links);
        return hframe({
            className,
            items: [
                hasRailContent
                    ? railModel.collapsed
                        ? collapsedRail({railModel})
                        : infoRail({title, icon, statusTag, intro, options, links, railModel})
                    : null,
                vframe({className: 'tbox-wrapper__demo', items: children})
            ]
        });
    }
});

/** Per-tab, in-memory collapse state for the info rail (intentionally not persisted or shared). */
class WrapperRailModel extends HoistModel {
    @bindable collapsed = false;

    constructor() {
        super();
        makeObservable(this);
    }
}

interface InfoRailProps extends Omit<WrapperProps, 'description'> {
    /** Normalized intro Markdown (joined upstream from `WrapperProps.description`). */
    intro?: string;
    railModel: WrapperRailModel;
}

const infoRail = hoistCmp.factory<InfoRailProps>({
    render({title, icon, statusTag, intro, options, links, railModel}) {
        const hasIntro = !!intro,
            hasOptions = !isEmpty(options),
            hasLinks = !isEmpty(links);
        return panel({
            className: 'tbox-wrapper__rail',
            title,
            icon,
            compactHeader: true,
            width: 320,
            headerItems: [
                button({
                    icon: Icon.chevronLeft(),
                    title: 'Collapse info panel',
                    onClick: () => (railModel.collapsed = true)
                })
            ],
            item: div({
                className: 'tbox-wrapper__rail-body',
                items: [
                    statusTagBanner({statusTag, omit: !statusTag}),
                    div({
                        className: 'tbox-wrapper__intro',
                        item: markdown({content: intro, lineBreaks: false}),
                        omit: !hasIntro
                    }),
                    div({
                        className: 'tbox-wrapper__divider',
                        omit: !(hasIntro && hasOptions)
                    }),
                    optionsSection({options}),
                    div({
                        className: 'tbox-wrapper__divider',
                        omit: !((hasIntro || hasOptions) && hasLinks)
                    }),
                    resources({links})
                ]
            })
        });
    }
});

interface StatusTagBannerProps extends HoistProps {
    statusTag: WrapperStatusTagSpec;
}

const statusTagBanner = hoistCmp.factory<StatusTagBannerProps>({
    render({statusTag}) {
        const {label, icon = Icon.experiment(), info} = statusTag;
        return div({
            className: 'tbox-wrapper__status-tag',
            items: [
                icon,
                div({
                    className: 'tbox-wrapper__status-tag-text',
                    items: [
                        div({className: 'tbox-wrapper__status-tag-label', item: label}),
                        div({
                            className: 'tbox-wrapper__status-tag-info',
                            item: info,
                            omit: !info
                        })
                    ]
                })
            ]
        });
    }
});

interface OptionsSectionProps extends HoistProps {
    options?: ReactNode;
}

const optionsSection = hoistCmp.factory<OptionsSectionProps>({
    render({options}) {
        // `isEmpty` treats undefined and `[]` as empty but a React element (a non-empty object) or
        // a non-empty array as present - which is exactly the "has renderable content" test we want
        // for the element/array values examples pass here.
        if (isEmpty(options)) return null;
        return div({
            className: 'tbox-wrapper__options',
            items: [
                div({className: 'tbox-wrapper__options-label', item: 'Options'}),
                div({className: 'tbox-wrapper__options-body', item: options})
            ]
        });
    }
});

interface WrapperOptionProps extends HoistProps {
    /** Short, human-friendly label shown at the left of the row. */
    label: ReactNode;
    /** The control element (e.g. `switchInput`, `select`, `numberInput`) shown at the right. */
    control: ReactElement;
    /**
     * The qualified name of the Hoist API this option controls, when it maps 1:1 onto a single
     * named property - as `Interface.property`, e.g. `GridConfig.stripeRows`, `MaskProps.inline`,
     * or `FormModel.readonly`. The owning interface is the one a developer would reach for: a
     * component's `*Props` for a component prop, a model's `*Config` for a config key, or the
     * `*Model` for a runtime-settable property. When set, this is revealed in monospace - swapped
     * in place for the human `label` - while the row is hovered, so a developer who reaches for an
     * option immediately sees the literal property to wire up and where it lives, without the
     * everyday labels having to read as code. Omit where an option does not map cleanly onto one
     * named property (those stay label-only).
     */
    propName?: string;
    /**
     * Optional explanatory text rendered, muted, on its own line below the label/control row.
     * Use to describe what the option does or why a developer might reach for it.
     */
    info?: ReactNode;
}

/**
 * A single labeled row within a Wrapper `options` section - a consistent label-left / control-right
 * layout so display options read uniformly across examples regardless of the underlying control.
 * An optional `info` line renders muted helper text below the row for added context. When a
 * `propName` is supplied, hovering the row swaps the label in place for the literal property name.
 */
export const [WrapperOption, wrapperOption] = hoistCmp.withFactory<WrapperOptionProps>({
    displayName: 'WrapperOption',
    render({label, control, propName, info}) {
        return div({
            className: 'tbox-wrapper__option',
            // Native tooltip with the full property name - useful when the revealed pill ellipsizes.
            title: propName,
            items: [
                div({
                    className: 'tbox-wrapper__option-row',
                    items: [
                        div({
                            className: 'tbox-wrapper__option-label',
                            items: propName
                                ? [
                                      span({
                                          className: 'tbox-wrapper__option-label-text',
                                          item: label
                                      }),
                                      code({
                                          className: 'tbox-wrapper__option-prop',
                                          item: propName
                                      })
                                  ]
                                : label
                        }),
                        div({className: 'tbox-wrapper__option-control', item: control})
                    ]
                }),
                div({className: 'tbox-wrapper__option-info', item: info, omit: !info})
            ]
        });
    }
});

/**
 * A full-width, non-minimal action button for a Wrapper `options` section - i.e. a demo *trigger*
 * (e.g. "Load Now") or a utility action that acts on the example. Standardizes the action-button
 * look across examples (filled, stretched to the rail width).
 *
 * Intent convention: use `intent: 'primary'` for the single action that drives the example's core
 * behavior (the "run it" trigger); leave neutral (no intent) for secondary utilities; use
 * `intent: 'danger'` for destructive actions (clear / reset).
 */
export function wrapperAction(props: ButtonProps): ReactElement {
    return button({minimal: false, width: '100%', ...props});
}

interface ResourcesProps extends HoistProps {
    links?: ToolboxLinkProps[];
}

const resources = hoistCmp.factory<ResourcesProps>({
    render({links}) {
        if (isEmpty(links)) return null;
        // Group by kind for a consistent display (docs, then code, then external). Sort is stable,
        // so each tab's spec order carries through as an intentional within-kind secondary sort.
        const sortedLinks = [...links].sort(
            (a, b) => LINK_KIND_ORDER[linkKind(a.url)] - LINK_KIND_ORDER[linkKind(b.url)]
        );
        return div({
            className: 'tbox-wrapper__resources',
            items: [
                div({className: 'tbox-wrapper__resources-label', item: 'Resources'}),
                ...sortedLinks.map(link =>
                    div({
                        className: 'tbox-wrapper__resource',
                        items: [
                            linkIcon(link.url),
                            div({
                                className: 'tbox-wrapper__resource-text',
                                items: [
                                    toolboxLink(link),
                                    div({
                                        className: 'tbox-wrapper__resource-note',
                                        item: link.notes,
                                        omit: !link.notes
                                    })
                                ]
                            })
                        ]
                    })
                )
            ]
        });
    }
});

const collapsedRail = hoistCmp.factory<{railModel: WrapperRailModel} & HoistProps>({
    render({railModel}) {
        const expand = () => (railModel.collapsed = false);
        return vbox({
            className: 'tbox-wrapper__rail-collapsed',
            title: 'Show info panel',
            onClick: expand,
            items: [
                button({icon: Icon.chevronRight(), title: 'Show info panel', onClick: expand}),
                Icon.info({className: 'tbox-wrapper__rail-collapsed-hint'})
            ]
        });
    }
});

/**
 * Classify a resource link by its target: an in-repo source file ('code'), a markdown doc such
 * as a README or concept guide ('doc'), or a fully-qualified external URL ('external').
 */
type LinkKind = 'code' | 'doc' | 'external';

function linkKind(url: string): LinkKind {
    // Classify on the path alone - doc links may carry a `#section` anchor (e.g.
    // `$HR/desktop/cmp/panel/README.md#mask`) that would otherwise mask the `.md` suffix.
    const path = url.split('#')[0];
    if (path.endsWith('.md')) return 'doc';
    if (path.startsWith('http')) return 'external';
    return 'code';
}

/** Display order applied to the Resources list: docs first, then code samples, then external. */
const LINK_KIND_ORDER: Record<LinkKind, number> = {doc: 0, code: 1, external: 2};

/** Icon shown beside a resource link, distinguishing its kind. */
function linkIcon(url: string): ReactElement {
    switch (linkKind(url)) {
        case 'doc':
            return Icon.book();
        case 'external':
            return Icon.openExternal();
        default:
            return Icon.code();
    }
}
