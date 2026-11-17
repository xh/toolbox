import type {SeparatorProps} from '@xh/hoist/cmp/layout';
import {div, hbox, separator, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoGrid,
    demoPanel,
    demoPlayground,
    demoSection,
    fmtDemoConfig
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import './SeparatorPanel.scss';

export const separatorPanel = hoistCmp.factory({
    displayName: 'SeparatorPanel',
    model: creates(() => SeparatorPanelModel),

    render({model}) {
        const {sepProps} = model,
            {vertical} = sepProps;
        return wrapper({
            title: 'Separator',
            icon: Icon.ellipsisHorizontal(),
            description: [
                'A `Separator` is a rule that divides content, with an optional label.',
                '',
                'A horizontal separator spans the width of its container and divides content',
                'above from content below. A vertical one divides the items of a row and takes the',
                'height of that row. Either can show a label. The separator has no outer margin:',
                'space it with a `gap` on its container, a `margin` layout prop, or the',
                '`--xh-separator-margin` variable.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/SeparatorPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/layout/Separator.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/layout/Separator.scss', notes: 'Styles and CSS variables.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground separator.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    items: [
                        wrapperOption({
                            label: 'Vertical',
                            propName: 'SeparatorProps.vertical',
                            control: switchInput({bind: 'vertical'})
                        }),
                        wrapperOption({
                            label: 'Label',
                            propName: 'SeparatorProps.label',
                            control: textInput({bind: 'label', width: 130, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Label position',
                            propName: 'SeparatorProps.labelPosition',
                            control: select({
                                bind: 'labelPosition',
                                enableFilter: false,
                                enableClear: true,
                                width: 130,
                                options: ['start', 'center', 'end']
                            })
                        })
                    ]
                })
            ],
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 360,
                            showValue: false,
                            caption: vertical
                                ? 'Between the items of a row.'
                                : 'Between two blocks of a column.',
                            config: fmtDemoConfig<SeparatorProps>('separator', sepProps),
                            item: (vertical ? hbox : vbox)({
                                className: 'tb-separator-panel__stack',
                                width: '100%',
                                items: [block('Positions'), separator(sepProps), block('Orders')]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Horizontal',
                        note: 'Plain, and with a label at the start, the center and the end.',
                        item: demoFrame({
                            item: vbox({
                                className: 'tb-separator-panel__stack',
                                items: [
                                    span('A plain rule'),
                                    separator(),
                                    span("labelPosition: 'start'"),
                                    separator({label: 'Settlement', labelPosition: 'start'}),
                                    span("labelPosition: 'center', the default"),
                                    separator({label: 'Settlement'}),
                                    span("labelPosition: 'end'"),
                                    separator({label: 'Settlement', labelPosition: 'end'}),
                                    span('An element as the label'),
                                    separator({
                                        label: span(Icon.clock(), ' Earlier today'),
                                        labelPosition: 'start'
                                    })
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Vertical',
                        note: 'In a row, the rule takes the height of the row.',
                        item: demoGrid({
                            columns: 3,
                            items: [
                                demoFrame({
                                    label: 'Between figures',
                                    item: hbox({
                                        className: 'tb-separator-panel__stack',
                                        items: [
                                            figure('P&L', '+1.24m'),
                                            separator({vertical: true}),
                                            figure('Market value', '48.25m'),
                                            separator({vertical: true}),
                                            figure('Positions', '312')
                                        ]
                                    })
                                }),
                                demoFrame({
                                    label: 'Between actions',
                                    item: hbox({
                                        className: 'tb-separator-panel__stack',
                                        alignItems: 'center',
                                        items: [
                                            button({text: 'Approve', intent: 'success'}),
                                            button({text: 'Reject', intent: 'danger'}),
                                            separator({vertical: true}),
                                            button({text: 'Export'}),
                                            button({text: 'Close'})
                                        ]
                                    })
                                }),
                                demoFrame({
                                    label: 'With a label',
                                    info: "label: 'or'",
                                    item: hbox({
                                        className: 'tb-separator-panel__stack',
                                        items: [
                                            block('Upload a file'),
                                            separator({vertical: true, label: 'or'}),
                                            block('Paste rows')
                                        ]
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Spacing',
                        note: 'No margin by default. A gap, a margin prop or a CSS variable adds it.',
                        item: demoGrid({
                            items: [
                                demoFrame({
                                    label: 'No spacing',
                                    item: vbox(block('Above'), separator(), block('Below'))
                                }),
                                demoFrame({
                                    label: 'margin layout prop',
                                    info: "margin: '16px 0'",
                                    item: vbox(
                                        block('Above'),
                                        separator({margin: '16px 0'}),
                                        block('Below')
                                    )
                                }),
                                demoFrame({
                                    label: 'CSS variable',
                                    info: '--xh-separator-margin',
                                    className: 'tb-separator-panel__spaced',
                                    item: vbox(
                                        block('Above'),
                                        separator({label: 'Then'}),
                                        block('Below')
                                    )
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Narrow',
                        note: 'At 220px, with a short label and a long one that wraps.',
                        item: div({
                            className: 'tb-separator-panel__narrow',
                            item: demoFrame({
                                item: vbox({
                                    className: 'tb-separator-panel__stack',
                                    items: [
                                        separator({label: 'Short'}),
                                        separator({
                                            label: 'Settlement instructions for the custodian',
                                            labelPosition: 'start'
                                        }),
                                        separator({
                                            label: 'Settlement instructions for the custodian'
                                        })
                                    ]
                                })
                            })
                        })
                    }),
                    demoSection({
                        title: 'Restyled with CSS Variables',
                        note: 'A thick rule in the primary color, with a larger label.',
                        item: demoFrame({
                            className: 'tb-separator-panel__restyled',
                            item: vbox({
                                className: 'tb-separator-panel__stack',
                                items: [
                                    separator({label: 'Section One', labelPosition: 'start'}),
                                    block('Content'),
                                    separator()
                                ]
                            })
                        })
                    })
                ]
            })
        });
    }
});

function block(text: string) {
    return div({className: 'tb-separator-panel__block', item: text});
}

function figure(label: string, value: string) {
    return vbox({
        className: 'tb-separator-panel__figure',
        items: [span(label), span(value)]
    });
}

class SeparatorPanelModel extends HoistModel {
    @bindable accessor vertical = false;
    @bindable accessor label = 'Orders';
    @bindable accessor labelPosition: SeparatorProps['labelPosition'] = null;

    /**
     * Props for the Playground separator. Options left at their default resolve to undefined, so
     * the snippet omits them. The snippet reads this same getter, so the code shown cannot drift
     * from the separator beside it.
     */
    get sepProps(): PlaygroundSeparatorProps {
        const {vertical, label, labelPosition} = this;
        return {
            vertical: vertical || undefined,
            label: label || undefined,
            labelPosition: labelPosition ?? undefined
        };
    }
}

/** The Separator props the rail drives, as the plain values its inputs produce. */
interface PlaygroundSeparatorProps {
    vertical?: boolean;
    label?: string;
    labelPosition?: SeparatorProps['labelPosition'];
}
