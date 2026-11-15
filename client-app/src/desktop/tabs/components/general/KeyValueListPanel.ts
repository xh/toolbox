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
                'a record in a detail panel. It renders an HTML description list.',
                '',
                'The list is presentation-only. The caller formats each value. The list fills the',
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
                    items: [
                        wrapperOption({
                            label: 'Label position',
                            propName: 'KeyValueListProps.labelPosition',
                            control: select({
                                bind: 'labelPosition',
                                enableFilter: false,
                                enableClear: true,
                                width: 110,
                                options: ['left', 'top']
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
                            info: 'Used when columns is empty.',
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
                                width: 110,
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
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 640,
                            showValue: false,
                            caption:
                                'The largest position of the sample portfolio, in a 640px box.',
                            config: fmtDemoConfig<KeyValueListProps>('keyValueList', {
                                entries: raw('positionEntries'),
                                ...listProps
                            }),
                            item: keyValueList({
                                entries: positionEntries,
                                ...listProps,
                                width: '100%'
                            })
                        })
                    }),
                    demoSection({
                        title: 'Fits the Width',
                        note: 'One list at 280, 460 and 760px. Columns are at least 300px wide.',
                        item: div({
                            className: 'tb-key-value-list-panel__widths',
                            items: [280, 460, 760].map(width =>
                                div({
                                    key: width,
                                    style: {width},
                                    item: demoFrame({
                                        chip: `${width}px`,
                                        item: keyValueList({entries: positionEntries})
                                    })
                                })
                            )
                        })
                    }),
                    demoSection({
                        title: 'Label on Top',
                        note: "labelPosition: 'top' stacks each label above its value.",
                        item: demoFrame({
                            item: keyValueList({entries: positionEntries, labelPosition: 'top'})
                        })
                    }),
                    demoSection({
                        title: 'Columns',
                        note: 'columns sets the count. Entries fill row by row.',
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoFrame({
                                    label: 'columns: 2',
                                    item: keyValueList({entries: positionEntries, columns: 2})
                                }),
                                demoFrame({
                                    label: 'columns: 3',
                                    info: "with labelPosition: 'top'",
                                    item: keyValueList({
                                        entries: positionEntries,
                                        columns: 3,
                                        labelPosition: 'top'
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Compact and Dividers',
                        note: "size: 'compact' and dividers, alone and together.",
                        item: demoGrid({
                            items: [
                                demoFrame({
                                    label: 'compact',
                                    item: keyValueList({
                                        entries: positionEntries,
                                        columns: 1,
                                        size: 'compact'
                                    })
                                }),
                                demoFrame({
                                    label: 'dividers',
                                    item: keyValueList({
                                        entries: positionEntries,
                                        columns: 1,
                                        dividers: true
                                    })
                                }),
                                demoFrame({
                                    label: 'compact, dividers, two columns',
                                    item: keyValueList({
                                        entries: positionEntries,
                                        columns: 2,
                                        size: 'compact',
                                        dividers: true
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Intent and Elements',
                        note: 'intent colors a value. A value can be any element.',
                        item: demoFrame({
                            className: 'tb-key-value-list-panel__narrow',
                            item: keyValueList({
                                columns: 1,
                                entries: [
                                    {label: 'Status', value: 'Settled', intent: 'success'},
                                    {label: 'Limit used', value: '94%', intent: 'warning'},
                                    {label: 'Breaches', value: '3 open', intent: 'danger'},
                                    {label: 'Desk', value: 'Rates', intent: 'primary'},
                                    {
                                        label: 'Rating',
                                        value: badge({item: 'AA-', intent: 'success'})
                                    },
                                    {
                                        label: 'Docs',
                                        value: a({
                                            href: 'https://xh.io',
                                            target: '_blank',
                                            item: 'xh.io'
                                        })
                                    }
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Long Text and Empty Values',
                        note: 'Labels and values wrap. A blank value shows emptyText.',
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoFrame({
                                    label: 'Wrapping',
                                    info: 'at 340px',
                                    className: 'tb-key-value-list-panel__slim',
                                    item: keyValueList({
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
                                    item: keyValueList({
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
                        title: 'Restyled with CSS Variables',
                        note: 'Bold values, small uppercase labels and a wider label gap.',
                        item: demoFrame({
                            className:
                                'tb-key-value-list-panel__restyled tb-key-value-list-panel__narrow',
                            item: keyValueList({entries: positionEntries, columns: 1})
                        })
                    })
                ]
            })
        });
    }
});

class KeyValueListPanelModel extends HoistModel {
    @bindable accessor labelPosition: KeyValueListProps['labelPosition'] = null;
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
        const {labelPosition, columns, minColumnWidth, size, dividers, emptyText} = this;
        return {
            labelPosition: labelPosition ?? undefined,
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
    labelPosition?: KeyValueListProps['labelPosition'];
    columns?: number;
    minColumnWidth?: number;
    size?: KeyValueListProps['size'];
    dividers?: boolean;
    emptyText?: string;
}
