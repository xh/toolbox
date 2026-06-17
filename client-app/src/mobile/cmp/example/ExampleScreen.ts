import {div, filler, hbox, span, vbox, vframe} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {hoistCmp, HoistProps, useLocalModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {button, ButtonProps} from '@xh/hoist/mobile/cmp/button';
import {buttonGroupInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {isArray, isEmpty} from 'lodash';
import {Children, ReactElement, ReactNode} from 'react';
import {toolboxUrl, ToolboxLinkProps} from '../../../core/cmp/ToolboxLink';
import {pullUpSheet} from '../pullUpSheet/PullUpSheet';
import {ExampleScreenModel} from './ExampleScreenModel';
import './ExampleScreen.scss';

export interface ExampleScreenProps extends HoistProps {
    /** Example / pattern name, shown in the peek bar and the expanded sheet header. */
    title: ReactNode;

    /** Optional icon shown beside the title. */
    icon?: ReactElement;

    /**
     * Intro text for the demo, as Markdown - shown in the sheet's Info segment. Provided as a single
     * string or an array of lines joined with newlines (an empty-string entry marks a paragraph
     * break), matching the desktop `wrapper` convention.
     */
    description?: string | string[];

    /**
     * Controls that customize how *this example is displayed* - rendered in the sheet's Options
     * segment. Provide already-constructed controls, most commonly wrapped with {@link exampleOption}
     * for a consistent label / control row, and {@link exampleAction} for full-width action buttons.
     * Pass as an array so the live options count can be derived for the peek-bar chip.
     */
    options?: ReactNode;

    /** Resource links (source files, docs, external libraries) - shown in the sheet's Resources segment. */
    links?: ToolboxLinkProps[];
}

/**
 * Shared wrapper giving every mobile example demo the same structure as the desktop sidebar -
 * Info, Options, and Resources - without stealing width from the live demo. The demo renders
 * full-bleed; the three segments live in a pull-up sheet that peeks at the bottom with a live
 * options count and expands on tap or drag.
 */
export const exampleScreen = hoistCmp.factory<ExampleScreenProps>({
    displayName: 'ExampleScreen',

    render({title, icon, description, options, links, children}) {
        const model = useLocalModel(ExampleScreenModel),
            optionsCount = Children.toArray(options).length;

        return panel({
            className: 'tb-example-screen',
            item: vframe({
                className: 'tb-example-screen__frame',
                items: [
                    div({className: 'tb-example-screen__demo', item: children}),
                    pullUpSheet({
                        isExpanded: model.isExpanded,
                        onExpandedChange: v => model.setBindable('isExpanded', v),
                        peekItem: peekBar({title, icon, optionsCount}),
                        item: sheetBody({model, title, description, options, links})
                    })
                ]
            })
        });
    }
});

/** Peek-bar content: example name + a short hint + the live options-count chip. */
const peekBar = hoistCmp.factory({
    render({title, icon, optionsCount}) {
        return hbox({
            className: 'tb-example-screen__peek',
            items: [
                icon ? div({className: 'tb-example-screen__peek-icon', item: icon}) : null,
                vbox({
                    className: 'tb-example-screen__peek-text',
                    items: [
                        div({className: 'tb-example-screen__peek-title', item: title}),
                        div({
                            className: 'tb-example-screen__peek-hint',
                            item: 'Info, options & resources'
                        })
                    ]
                }),
                filler(),
                hbox({
                    className: 'tb-example-screen__count',
                    omit: !optionsCount,
                    items: [
                        Icon.options({className: 'tb-example-screen__count-icon'}),
                        `${optionsCount}`
                    ]
                })
            ]
        });
    }
});

interface SheetBodyArgs {
    model: ExampleScreenModel;
    title: ReactNode;
    description?: string | string[];
    options?: ReactNode;
    links?: ToolboxLinkProps[];
}

// Plain helper (not a factory) so the local ExampleScreenModel passed in resolves directly; its
// observable reads happen during the parent `exampleScreen` render, which keeps them reactive.
function sheetBody({model, title, description, options, links}: SheetBodyArgs): ReactElement {
    return vbox({
        className: 'tb-example-screen__sheet-body',
        items: [
            div({className: 'tb-example-screen__sheet-title', item: title}),
            buttonGroupInput({
                className: 'tb-example-screen__segments',
                model,
                bind: 'segment',
                items: [
                    button({value: 'info', text: 'Info'}),
                    button({value: 'options', text: 'Options'}),
                    button({value: 'resources', text: 'Resources'})
                ]
            }),
            segmentContent({model, description, options, links})
        ]
    });
}

interface SegmentContentArgs {
    model: ExampleScreenModel;
    description?: string | string[];
    options?: ReactNode;
    links?: ToolboxLinkProps[];
}

function segmentContent({model, description, options, links}: SegmentContentArgs): ReactNode {
    switch (model.segment) {
        case 'info':
            return infoSegment({description});
        case 'options':
            return div({className: 'tb-example-screen__options', item: options});
        case 'resources':
            return resourcesSegment({links});
        default:
            return null;
    }
}

const infoSegment = hoistCmp.factory({
    render({description}) {
        if (isEmpty(description)) {
            return div({
                className: 'tb-example-screen__empty',
                item: 'No description for this example.'
            });
        }
        const intro = isArray(description) ? description.join('\n') : description;
        return div({
            className: 'tb-example-screen__info',
            item: markdown({content: intro, lineBreaks: false})
        });
    }
});

interface ExampleOptionProps extends HoistProps {
    /** Short, human-friendly label shown at the left of the row. */
    label: ReactNode;
    /** The control element (e.g. `switchInput`, `select`) shown at the right. */
    control: ReactElement;
    /** Optional muted helper text rendered below the row. */
    info?: ReactNode;
}

/**
 * A single labeled row within an {@link exampleScreen} `options` list - a consistent
 * label-left / control-right layout so display options read uniformly across examples.
 */
export const exampleOption = hoistCmp.factory<ExampleOptionProps>({
    displayName: 'ExampleOption',
    render({label, control, info}) {
        return div({
            className: 'tb-example-screen__option',
            items: [
                hbox({
                    className: 'tb-example-screen__option-row',
                    items: [
                        span({className: 'tb-example-screen__option-label', item: label}),
                        filler(),
                        div({className: 'tb-example-screen__option-control', item: control})
                    ]
                }),
                div({className: 'tb-example-screen__option-info', item: info, omit: !info})
            ]
        });
    }
});

/**
 * A full-width action button for an {@link exampleScreen} `options` list - a demo trigger
 * (e.g. "Load Now") or a utility action (e.g. "Reset"). Standardizes the stretched look.
 */
export function exampleAction(props: ButtonProps): ReactElement {
    return button({minimal: false, width: '100%', ...props});
}

const resourcesSegment = hoistCmp.factory({
    render({links}) {
        if (isEmpty(links)) {
            return div({
                className: 'tb-example-screen__empty',
                item: 'No resources for this example.'
            });
        }
        const sorted = [...links].sort(
            (a, b) => LINK_KIND_ORDER[linkKind(a.url)] - LINK_KIND_ORDER[linkKind(b.url)]
        );
        return div({
            className: 'tb-example-screen__resources',
            items: sorted.map(link =>
                hbox({
                    className: 'tb-example-screen__resource',
                    // No in-app docs reader on mobile yet - all links open in the system browser.
                    onClick: () => window.open(toolboxUrl(link.url), '_blank'),
                    items: [
                        div({
                            className: 'tb-example-screen__resource-icon',
                            item: linkIcon(link.url)
                        }),
                        vbox({
                            className: 'tb-example-screen__resource-text',
                            items: [
                                div({
                                    className: 'tb-example-screen__resource-link',
                                    item: link.text || defaultLinkText(link.url)
                                }),
                                div({
                                    className: 'tb-example-screen__resource-note',
                                    item: link.notes,
                                    omit: !link.notes
                                })
                            ]
                        }),
                        filler(),
                        Icon.chevronRight({className: 'tb-example-screen__resource-chevron'})
                    ]
                })
            )
        });
    }
});

//------------------------
// Resource link helpers (mirrors desktop Wrapper classification)
//------------------------
type LinkKind = 'code' | 'doc' | 'external';

function linkKind(url: string): LinkKind {
    const path = url.split('#')[0];
    if (path.endsWith('.md')) return 'doc';
    if (path.startsWith('http')) return 'external';
    return 'code';
}

const LINK_KIND_ORDER: Record<LinkKind, number> = {doc: 0, code: 1, external: 2};

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

function defaultLinkText(url: string): string {
    const start = url.lastIndexOf('/'),
        end = url.includes('#') ? url.lastIndexOf('#') : url.length;
    return url.substring(start + 1, end);
}
