import {div} from '@xh/hoist/cmp/layout';
import type {StatCardProps} from '@xh/hoist/cmp/statcard';
import {statCard, statCardStrip} from '@xh/hoist/cmp/statcard';
import type {Intent} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {select, textInput} from '@xh/hoist/desktop/cmp/input';
import {fmtNumber, fmtPercent} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoPanel,
    demoPlayground,
    demoSection,
    fmtDemoConfig
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import './StatCardPanel.scss';

/** The StatCard props the rail drives. Named so the instance and the snippet share one type. */
type PlaygroundCardProps = Pick<
    StatCardProps,
    'title' | 'value' | 'valueIntent' | 'secondary' | 'detail' | 'infoTooltip' | 'accent'
>;

/**
 * A sales summary as an app would build it - each value formatted and colored by the caller. Plain
 * `ledger` output, without `forceLedgerAlign`, is a string, so the card can give it a tooltip.
 */
const SALES_CARDS: StatCardProps[] = [
    {
        title: 'Net Revenue',
        value: fmtLedger(2483960),
        valueIntent: 'success',
        detail: 'Online and in-store, across 42 locations'
    },
    {title: 'Orders', value: 18375, detail: 'From 9,204 customers'},
    {
        title: 'Avg Order Value',
        value: fmtLedger(135),
        detail: 'Up from 128 last month'
    },
    {
        title: 'Returns',
        value: fmtLedger(-87412),
        valueIntent: 'danger',
        detail: 'Highest in Outerwear'
    },
    {
        title: 'On-Time Shipping',
        value: fmtPercent(96.4, {precision: 1}),
        infoTooltip: 'Share of orders shipped within two business days of purchase.',
        detail: '661 late, 12 still pending'
    }
];

export const statCardPanel = hoistCmp.factory({
    displayName: 'StatCardPanel',
    model: creates(() => StatCardPanelModel),

    render({model}) {
        const {cardProps} = model;
        return wrapper({
            title: 'StatCard',
            icon: Icon.chartLine(),
            description: [
                'A `StatCard` calls out a key figure: a caption over a prominent value, with an',
                'optional secondary label, info tooltip and sub-line. A `StatCardStrip` lays',
                'several out in a row of equal-width cards.',
                '',
                'The card is presentation-only. The caller formats the value and chooses its',
                '`valueIntent` - the card never colors a value based on its sign. Every line',
                'truncates when space is short and shows its full text in a tooltip.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/StatCardPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/statcard/StatCard.ts', notes: 'Hoist components.'},
                {url: '$HR/cmp/statcard/StatCard.scss', notes: 'Styles and CSS variables.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground card.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    items: [
                        textOption('Title', 'title'),
                        textOption('Value', 'value'),
                        wrapperOption({
                            label: 'Value intent',
                            propName: 'StatCardProps.valueIntent',
                            control: select({
                                bind: 'valueIntent',
                                enableFilter: false,
                                enableClear: true,
                                width: 120,
                                options: ['primary', 'success', 'warning', 'danger']
                            })
                        }),
                        textOption('Secondary', 'secondary'),
                        textOption('Detail', 'detail'),
                        textOption('Info tooltip', 'infoTooltip'),
                        wrapperOption({
                            label: 'Accent',
                            propName: 'StatCardProps.accent',
                            control: select({
                                bind: 'accent',
                                enableFilter: false,
                                enableClear: true,
                                width: 120,
                                options: [
                                    {label: 'Blue', value: 'var(--xh-blue)'},
                                    {label: 'Orange', value: 'var(--xh-orange)'},
                                    {label: 'Purple', value: 'var(--xh-purple)'},
                                    {label: 'Green', value: 'var(--xh-green)'}
                                ]
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
                            instanceWidth: 280,
                            showValue: false,
                            caption: 'Clear a field to omit that line.',
                            config: fmtDemoConfig<StatCardProps>('statCard', cardProps),
                            item: statCard(cardProps)
                        })
                    }),
                    demoSection({
                        title: 'In a Strip',
                        note: 'statCardStrip({cards}) - each card takes an equal share of the width.',
                        item: statCardStrip({cards: SALES_CARDS})
                    }),
                    demoSection({
                        title: 'Truncation',
                        note: 'The same strip at 640px. Hover a truncated line for its full text.',
                        item: div({
                            style: {width: 640},
                            item: statCardStrip({cards: SALES_CARDS})
                        })
                    }),
                    demoSection({
                        title: 'Secondary Label',
                        note: 'secondary - gives up its space before the value does.',
                        item: statCardStrip({
                            cards: [
                                {
                                    title: 'Operating Costs · This Quarter',
                                    value: '(1.12m)',
                                    valueIntent: 'danger',
                                    secondary: 'EUR'
                                },
                                {
                                    title: 'Gross Margin · Year to Date',
                                    value: '6.87m',
                                    valueIntent: 'success',
                                    secondary: 'EUR'
                                }
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Accent',
                        note: 'accent - a raw CSS color marking a category or series, not a judgement.',
                        item: statCardStrip({
                            cards: [
                                {
                                    title: 'North America',
                                    value: '$1.24m',
                                    detail: '18 stores',
                                    accent: 'var(--xh-blue)'
                                },
                                {
                                    title: 'Europe',
                                    value: '$836.5k',
                                    detail: '15 stores',
                                    accent: 'var(--xh-orange)'
                                },
                                {
                                    title: 'Asia Pacific',
                                    value: '$407.4k',
                                    detail: '9 stores',
                                    accent: 'var(--xh-purple)'
                                }
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Restyled with CSS Variables',
                        note: 'Uppercase titles and no strip padding, set on a container class.',
                        item: demoFrame({
                            className: 'tb-stat-card-panel__headline',
                            item: statCardStrip({
                                cards: [
                                    {
                                        title: 'Warehouse Capacity',
                                        value: '82%',
                                        detail: '4,100 of 5,000 pallets'
                                    },
                                    {title: 'Open Tickets', value: 37, valueIntent: 'warning'},
                                    {
                                        title: 'Next Restock',
                                        value: '6 days',
                                        detail: 'Arrives 2026-11-04'
                                    }
                                ]
                            })
                        })
                    })
                ]
            })
        });
    }
});

function textOption(label: string, bind: keyof PlaygroundCardProps) {
    return wrapperOption({
        label,
        propName: `StatCardProps.${bind}`,
        control: textInput({bind, width: 160, commitOnChange: true})
    });
}

function fmtLedger(v: number): string {
    return fmtNumber(v, {precision: 0, ledger: true, forceLedgerAlign: false}) as string;
}

class StatCardPanelModel extends HoistModel {
    @bindable accessor title = 'Net Revenue';
    @bindable accessor value = '2,483,960';
    @bindable accessor valueIntent: Intent = 'success';
    @bindable accessor secondary = 'EUR';
    @bindable accessor detail = 'Online and in-store, across 42 locations';
    @bindable accessor infoTooltip: string = null;
    @bindable accessor accent: string = null;

    /**
     * Props for the Playground card. Emptied fields resolve to undefined, so the snippet omits
     * them and the card omits their lines. The snippet reads this same getter, so the code shown
     * cannot drift from the instance beside it.
     */
    get cardProps(): PlaygroundCardProps {
        const {title, value, valueIntent, secondary, detail, infoTooltip, accent} = this;
        return {
            title,
            value,
            valueIntent: valueIntent || undefined,
            secondary: secondary || undefined,
            detail: detail || undefined,
            infoTooltip: infoTooltip || undefined,
            accent: accent || undefined
        };
    }
}
