import {badge} from '@xh/hoist/cmp/badge';
import type {KeyValueEntry, KeyValueListProps} from '@xh/hoist/cmp/keyvaluelist';
import {keyValueList} from '@xh/hoist/cmp/keyvaluelist';
import {a, div} from '@xh/hoist/cmp/layout';
import type {LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import {maxBy} from 'lodash';
import type {PricedRawPosition} from '../../../../core/svc/PortfolioService';
import {
    demoFrame,
    demoGrid,
    demoPanel,
    demoPlayground,
    demoSection,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import './KeyValueListPanel.scss';

/** A P&L statement for one fund, with figures of different widths. */
const SUMMARY: KeyValueEntry[] = [
    {label: 'Market value', value: fmtNumber(41_118_870, {precision: 0})},
    {label: 'Cost basis', value: fmtNumber(38_906_455, {precision: 0})},
    {
        label: 'Unrealized P&L',
        value: fmtNumber(2_212_415, {precision: 0, withSignGlyph: true}),
        intent: 'success'
    },
    {
        label: 'Realized P&L',
        value: fmtNumber(-111_870, {precision: 0, withSignGlyph: true}),
        intent: 'danger'
    },
    {label: 'Dividends', value: fmtNumber(18_400, {precision: 0})},
    {label: 'Fees', value: fmtNumber(-1_215, {precision: 0})},
    {label: 'Trades', value: fmtNumber(1_118, {precision: 0})},
    {
        label: 'Net P&L',
        value: fmtNumber(2_117_730, {precision: 0, withSignGlyph: true}),
        intent: 'success'
    }
];

/** Labels and values with long unbroken words, among normal ones. */
const LONG_WORDS: KeyValueEntry[] = [
    {label: 'Symbol', value: 'XZ'},
    {label: 'SETTLEMENT_INSTRUCTION_OVERRIDE_CODE', value: 'DELIVER_VERSUS_PAYMENT'},
    {label: 'Account', value: 'ACCT00000044719028553100499128730021'},
    {
        label: 'Docs',
        value: 'https://github.com/xh/hoist-react/blob/develop/cmp/keyvaluelist/README.md'
    },
    {label: 'Side', value: 'Buy'}
];

export const keyValueListPanel = hoistCmp.factory({
    displayName: 'KeyValueListPanel',
    model: creates(() => KeyValueListPanelModel),

    render({model}) {
        const {listProps, positionEntries} = model;
        return wrapper({
            title: 'KeyValueList',
            icon: Icon.list(),
            description: [
                'A `KeyValueList` is a display-only list of labeled values, such as the fields of',
                'a record in a detail panel.',
                '',
                'The caller formats each value. The list fills the',
                'width of its container and fits as many columns as that width allows, or a set',
                'number of `columns`. Long labels and values wrap, so the list never forces',
                'horizontal overflow.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/KeyValueListPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/keyvaluelist/KeyValueList.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/keyvaluelist/KeyValueList.scss',
                    notes: 'Styles and CSS variables.'
                }
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground list.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    children: [
                        wrapperOption({
                            label: 'Label side',
                            propName: 'KeyValueListProps.labelSide',
                            control: select({
                                bind: 'labelSide',
                                enableFilter: false,
                                enableClear: true,
                                width: 110,
                                options: ['left', 'top']
                            })
                        }),
                        wrapperOption({
                            label: 'Label align',
                            propName: 'KeyValueListProps.labelAlign',
                            info: 'With labels on the left only.',
                            control: select({
                                bind: 'labelAlign',
                                enableFilter: false,
                                enableClear: true,
                                width: 110,
                                options: ['left', 'right']
                            })
                        }),
                        wrapperOption({
                            label: 'Value align',
                            propName: 'KeyValueListProps.valueAlign',
                            info: 'With labels on the left only.',
                            control: select({
                                bind: 'valueAlign',
                                enableFilter: false,
                                enableClear: true,
                                width: 110,
                                options: ['left', 'right']
                            })
                        }),
                        wrapperOption({
                            label: 'Columns',
                            propName: 'KeyValueListProps.columns',
                            info: 'Empty to fit the width.',
                            control: numberInput({bind: 'columns', min: 1, max: 6, width: 70})
                        }),
                        wrapperOption({
                            label: 'Min column width',
                            propName: 'KeyValueListProps.minColumnWidth',
                            info: 'Default 240, or 160 with labels on top.',
                            control: numberInput({
                                bind: 'minColumnWidth',
                                min: 80,
                                max: 600,
                                stepSize: 20,
                                width: 70
                            })
                        }),
                        wrapperOption({
                            label: 'Size',
                            propName: 'KeyValueListProps.size',
                            control: select({
                                bind: 'size',
                                enableFilter: false,
                                enableClear: true,
                                width: 120,
                                options: ['standard', 'compact']
                            })
                        }),
                        wrapperOption({
                            label: 'Dividers',
                            propName: 'KeyValueListProps.dividers',
                            control: switchInput({bind: 'dividers'})
                        }),
                        wrapperOption({
                            label: 'Empty text',
                            propName: 'KeyValueListProps.emptyText',
                            control: textInput({
                                bind: 'emptyText',
                                width: 110,
                                commitOnChange: true
                            })
                        })
                    ]
                })
            ],
            children: demoPanel({
                children: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        children: demoPlayground({
                            instanceWidth: 640,
                            showValue: false,
                            caption:
                                'The largest position of the sample portfolio, in a 640px box.',
                            config: fmtDemoConfig<KeyValueListProps>('keyValueList', {
                                entries: raw('positionEntries'),
                                ...listProps
                            }),
                            children: keyValueList({
                                entries: positionEntries,
                                ...listProps,
                                width: '100%'
                            })
                        })
                    }),
                    demoSection({
                        title: 'Fits the Width',
                        note: 'One list at 280, 560 and 840px. Columns are at least 240px wide, so one, two and three fit.',
                        children: div({
                            className: 'tb-key-value-list-panel__widths',
                            children: [280, 560, 840].map(width =>
                                div({
                                    key: width,
                                    style: {width},
                                    children: demoFrame({
                                        chip: `${width}px`,
                                        children: keyValueList({entries: positionEntries})
                                    })
                                })
                            )
                        })
                    }),
                    demoSection({
                        title: 'Label on Top',
                        note: "labelSide: 'top' stacks each label above its value.",
                        children: demoFrame({
                            children: keyValueList({entries: positionEntries, labelSide: 'top'})
                        })
                    }),
                    demoSection({
                        title: 'Columns',
                        note: 'columns sets the most columns. Entries fill row by row.',
                        children: demoGrid({
                            columns: 1,
                            children: [
                                demoFrame({
                                    label: 'columns: 2',
                                    children: keyValueList({entries: positionEntries, columns: 2})
                                }),
                                demoFrame({
                                    label: 'columns: 3',
                                    info: "with labelSide: 'top'",
                                    children: keyValueList({
                                        entries: positionEntries,
                                        columns: 3,
                                        labelSide: 'top'
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Compact and Dividers',
                        note: "size: 'compact' and dividers, alone and together.",
                        children: demoGrid({
                            children: [
                                demoFrame({
                                    label: 'compact',
                                    children: keyValueList({
                                        entries: positionEntries,
                                        columns: 1,
                                        size: 'compact'
                                    })
                                }),
                                demoFrame({
                                    label: 'dividers',
                                    children: keyValueList({
                                        entries: positionEntries,
                                        columns: 1,
                                        dividers: true
                                    })
                                }),
                                demoFrame({
                                    label: 'compact, dividers',
                                    children: keyValueList({
                                        entries: positionEntries,
                                        columns: 1,
                                        size: 'compact',
                                        dividers: true
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Text Alignment',
                        note: "labelAlign: 'right' sets each label against its value.",
                        children: demoGrid({
                            columns: 2,
                            children: [
                                demoFrame({
                                    label: "labelAlign: 'right'",
                                    children: keyValueList({
                                        entries: positionEntries,
                                        columns: 1,
                                        labelAlign: 'right'
                                    })
                                }),
                                demoFrame({
                                    label: "valueAlign: 'right'",
                                    info: 'and labelAlign',
                                    children: keyValueList({
                                        entries: positionEntries,
                                        columns: 1,
                                        labelAlign: 'right',
                                        valueAlign: 'right'
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Summary',
                        note: "valueAlign: 'right' sets each figure across from its label. Digits take equal widths, so the figures line up.",
                        children: demoGrid({
                            columns: 1,
                            children: [
                                demoFrame({
                                    label: 'One column',
                                    info: 'with dividers',
                                    className: 'tb-key-value-list-panel__narrow',
                                    children: keyValueList({
                                        entries: SUMMARY,
                                        columns: 1,
                                        valueAlign: 'right',
                                        dividers: true
                                    })
                                }),
                                demoFrame({
                                    label: 'columns: 2',
                                    info: 'with dividers',
                                    children: keyValueList({
                                        entries: SUMMARY,
                                        columns: 2,
                                        valueAlign: 'right',
                                        dividers: true
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Intent and Elements',
                        note: 'intent colors a value. A value can be any element.',
                        children: demoFrame({
                            className: 'tb-key-value-list-panel__narrow',
                            children: keyValueList({
                                columns: 1,
                                entries: [
                                    {label: 'Status', value: 'Settled', intent: 'success'},
                                    {label: 'Limit used', value: '94%', intent: 'warning'},
                                    {label: 'Breaches', value: '3 open', intent: 'danger'},
                                    {label: 'Desk', value: 'Rates', intent: 'primary'},
                                    {
                                        label: 'Rating',
                                        value: badge({children: 'AA-', intent: 'success'})
                                    },
                                    {
                                        label: 'Docs',
                                        value: a({
                                            href: 'https://xh.io',
                                            target: '_blank',
                                            children: 'xh.io'
                                        })
                                    }
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Long Text and Empty Values',
                        note: 'Labels and values wrap. A blank value shows emptyText.',
                        children: demoGrid({
                            columns: 2,
                            children: [
                                demoFrame({
                                    label: 'Wrapping',
                                    info: 'at 340px',
                                    className: 'tb-key-value-list-panel__slim',
                                    children: keyValueList({
                                        columns: 1,
                                        entries: [
                                            {
                                                label: 'Settlement instructions for the custodian',
                                                value: 'Deliver against payment to the account of record, on the second business day after the trade date.'
                                            },
                                            {
                                                label: 'Reference',
                                                value: 'ORD-2026-11-14-000000000000000000000000000000487213'
                                            },
                                            {label: 'Side', value: 'Buy'}
                                        ]
                                    })
                                }),
                                demoFrame({
                                    label: 'Empty values',
                                    info: "emptyText: 'Not set'",
                                    className: 'tb-key-value-list-panel__slim',
                                    children: keyValueList({
                                        columns: 1,
                                        emptyText: 'Not set',
                                        entries: [
                                            {label: 'Trader', value: 'Freda Klecko'},
                                            {label: 'Approver', value: null},
                                            {label: 'Note', value: '   '},
                                            {label: 'Zero', value: 0},
                                            {label: 'Left out', value: 'Hidden', omit: true},
                                            null
                                        ]
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Long Words',
                        note: 'An unbroken label or value breaks inside the word. Drag the corner of a frame to resize it.',
                        children: demoGrid({
                            columns: 2,
                            children: [
                                demoFrame({
                                    label: "labelSide: 'left'",
                                    className: 'tb-key-value-list-panel__resizable',
                                    children: keyValueList({columns: 1, entries: LONG_WORDS})
                                }),
                                demoFrame({
                                    label: "labelSide: 'top'",
                                    className: 'tb-key-value-list-panel__resizable',
                                    children: keyValueList({
                                        columns: 1,
                                        labelSide: 'top',
                                        entries: LONG_WORDS
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Restyled with CSS Variables',
                        note: 'Bold values, small uppercase labels and a wider label gap.',
                        children: demoFrame({
                            className:
                                'tb-key-value-list-panel__restyled tb-key-value-list-panel__narrow',
                            children: keyValueList({entries: positionEntries, columns: 1})
                        })
                    })
                ]
            })
        });
    }
});

class KeyValueListPanelModel extends HoistModel {
    @bindable accessor labelSide: KeyValueListProps['labelSide'] = null;
    @bindable accessor labelAlign: KeyValueListProps['labelAlign'] = null;
    @bindable accessor valueAlign: KeyValueListProps['valueAlign'] = null;
    @bindable accessor columns: number = null;
    @bindable accessor minColumnWidth: number = null;
    @bindable accessor size: KeyValueListProps['size'] = null;
    @bindable accessor dividers = false;
    @bindable accessor emptyText: string = null;

    @observableRef accessor position: PricedRawPosition = null;

    /**
     * Props for the Playground list, less its entries. Options left at their default resolve to
     * undefined, so the snippet omits them. The snippet reads this same getter, so the code shown
     * cannot drift from the list beside it.
     */
    get listProps(): PlaygroundListProps {
        const {
            labelSide,
            labelAlign,
            valueAlign,
            columns,
            minColumnWidth,
            size,
            dividers,
            emptyText
        } = this;
        return {
            labelSide: labelSide ?? undefined,
            labelAlign: labelAlign ?? undefined,
            valueAlign: valueAlign ?? undefined,
            columns: columns ?? undefined,
            minColumnWidth: minColumnWidth ?? undefined,
            size: size ?? undefined,
            dividers: dividers || undefined,
            emptyText: emptyText || undefined
        };
    }

    /** The fields of one position, formatted as an app would for a detail panel. */
    get positionEntries(): KeyValueEntry[] {
        const {position} = this;
        if (!position) return [];

        const {symbol, model, fund, sector, region, trader, mktVal, pnl} = position;
        return [
            {label: 'Symbol', value: symbol},
            {label: 'Sector', value: sector},
            {label: 'Region', value: region},
            {label: 'Fund', value: fund},
            {label: 'Model', value: model},
            {label: 'Trader', value: trader},
            {label: 'Market value', value: fmtMillions(mktVal, {precision: 2, label: true})},
            {
                label: 'P&L',
                value: fmtNumber(pnl, {precision: 0, withSignGlyph: true}),
                intent: pnl < 0 ? 'danger' : 'success'
            },
            {label: 'Approver', value: null}
        ];
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const positions = await XH.portfolioService.getPricedRawPositionsAsync({loadSpec});
        runInAction(() => {
            this.position = maxBy(positions, it => Math.abs(it.mktVal));
        });
    }
}

/** The KeyValueList props the rail drives, as the plain values its inputs produce. */
interface PlaygroundListProps {
    labelSide?: KeyValueListProps['labelSide'];
    labelAlign?: KeyValueListProps['labelAlign'];
    valueAlign?: KeyValueListProps['valueAlign'];
    columns?: number;
    minColumnWidth?: number;
    size?: KeyValueListProps['size'];
    dividers?: boolean;
    emptyText?: string;
}
