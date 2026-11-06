import {div} from '@xh/hoist/cmp/layout';
import type {StatCardProps} from '@xh/hoist/cmp/statcard';
import {statCard, statCardStrip} from '@xh/hoist/cmp/statcard';
import type {Intent} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {select, textInput} from '@xh/hoist/desktop/cmp/input';
import type {NumberFormatOptions} from '@xh/hoist/format';
import {fmtMillions, fmtNumber, fmtPercent} from '@xh/hoist/format';
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

/**
 * The StatCard props the rail drives, as the plain values its inputs produce. Named so the
 * instance and the snippet share one type.
 */
interface PlaygroundCardProps {
    title: string;
    value: string;
    subValue?: string;
    detail?: string;
    infoTooltip?: string;
    intent?: Intent;
    accent?: string;
}

/**
 * A sales summary as an app would build it - each value and change formatted and colored by the
 * caller. Returns is a metric where down is good, so its change inverts the `colorSpec`.
 */
const SALES_CARDS: StatCardProps[] = [
    {
        title: 'Net Revenue',
        value: fmtMillions(2483960, {precision: 2, label: true}),
        subValue: fmtChange(0.042),
        detail: 'vs. last month, 42 locations'
    },
    {
        title: 'Orders',
        value: fmtNumber(18375, {precision: 0}),
        subValue: fmtChange(0.018),
        detail: 'From 9,204 customers'
    },
    {
        title: 'Avg Order Value',
        value: fmtLedger(135),
        subValue: fmtChange(0.055),
        detail: 'Up from 128 last month'
    },
    {
        title: 'Returns',
        value: fmtLedger(87412),
        subValue: fmtChange(0.093, true),
        detail: 'Highest in Outerwear'
    },
    {
        title: 'On-Time Shipping',
        value: fmtPercent(0.964, {precision: 1}),
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
                'optional sub-value, info tooltip and sub-line. A `StatCardStrip` lays several',
                'out in a row of equal-width cards, wrapping them onto new rows when space is short.',
                '',
                'The card is presentation-only. The caller formats the value and any change, and',
                'colors them with `fmtNumber` - the card never colors a value based on its sign.',
                'The value is never truncated. Other lines truncate when space is short and show',
                'their full text in a tooltip.'
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
                        textOption('Sub-value', 'subValue'),
                        textOption('Detail', 'detail'),
                        textOption('Info tooltip', 'infoTooltip'),
                        wrapperOption({
                            label: 'Intent',
                            propName: 'StatCardProps.intent',
                            control: select({
                                bind: 'intent',
                                enableFilter: false,
                                enableClear: true,
                                width: 120,
                                options: ['primary', 'success', 'warning', 'danger']
                            })
                        }),
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
                        note: 'Each card takes an equal share of the row.',
                        item: salesStrip()
                    }),
                    demoSection({
                        title: 'Wrapping',
                        note: 'At 560px, cards wrap into an even grid - no value is cut short.',
                        item: div({style: {width: 560}, item: salesStrip()})
                    }),
                    demoSection({
                        title: 'Sub-value and Units',
                        note: "subValue for a change, fmtNumber's label for a unit.",
                        item: statCardStrip(
                            statCard({
                                title: 'Operating Costs · This Quarter',
                                value: fmtNumber(1.12, {precision: 2, label: 'm EUR'}),
                                subValue: fmtChange(0.031, true),
                                detail: 'vs. last quarter'
                            }),
                            statCard({
                                title: 'Gross Margin · Year to Date',
                                value: fmtNumber(6.87, {precision: 2, label: 'm EUR'}),
                                subValue: fmtChange(0.012),
                                detail: 'vs. same period last year'
                            })
                        )
                    }),
                    demoSection({
                        title: 'Intent',
                        note: 'intent flags a status on the border, as with Card.',
                        item: statCardStrip(
                            statCard({title: 'Overdue Invoices', value: 37, intent: 'warning'}),
                            statCard({
                                title: 'VaR Limit Used',
                                value: fmtPercent(1.08, {precision: 0}),
                                intent: 'danger',
                                detail: 'Limit breached at 14:20'
                            }),
                            statCard({
                                title: 'Settled Today',
                                value: fmtNumber(1204, {precision: 0}),
                                intent: 'success',
                                detail: 'All trades matched'
                            })
                        )
                    }),
                    demoSection({
                        title: 'Accent',
                        note: 'accent marks a category. CSS variables move it to the left.',
                        items: [
                            regionStrip(),
                            div({
                                className: 'tb-stat-card-panel__left-accent',
                                style: {marginTop: 10},
                                item: regionStrip()
                            })
                        ]
                    }),
                    demoSection({
                        title: 'Clickable',
                        note: 'onClick drills into a figure, by mouse or keyboard.',
                        item: statCardStrip(
                            statCard({
                                title: 'Open Orders',
                                value: 412,
                                detail: 'Click for details',
                                onClick: () => XH.toast({message: 'Drill into open orders'})
                            }),
                            statCard({
                                title: 'Pending Approvals',
                                value: 9,
                                intent: 'warning',
                                detail: 'Click for details',
                                onClick: () => XH.toast({message: 'Drill into approvals'})
                            })
                        )
                    }),
                    demoSection({
                        title: 'Mixed Widths',
                        note: 'flex and width on a card weight or fix its share.',
                        item: statCardStrip(
                            statCard({
                                title: 'Portfolio Value',
                                value: fmtMillions(48250000, {precision: 2, label: true}),
                                flex: 2
                            }),
                            statCard({title: 'Positions', value: 312}),
                            statCard({title: 'Status', value: 'Live', flex: 'none', width: 110})
                        )
                    }),
                    demoSection({
                        title: 'Restyled with CSS Variables',
                        note: 'Tinted, borderless cards, set by CSS variables on a container.',
                        item: demoFrame({
                            className: 'tb-stat-card-panel__headline',
                            item: statCardStrip(
                                statCard({
                                    title: 'Warehouse Capacity',
                                    value: '82%',
                                    detail: '4,100 of 5,000 pallets'
                                }),
                                statCard({
                                    title: 'Open Tickets',
                                    value: 37,
                                    subValue: fmtNumber(5, {
                                        precision: 0,
                                        withSignGlyph: true,
                                        colorSpec: {pos: 'xh-neg-val', neg: 'xh-pos-val'}
                                    }),
                                    detail: 'Since Monday'
                                }),
                                statCard({
                                    title: 'Next Restock',
                                    value: '6 days',
                                    detail: 'Arrives 2026-11-12'
                                })
                            )
                        })
                    })
                ]
            })
        });
    }
});

function salesStrip() {
    return statCardStrip({items: SALES_CARDS.map(it => statCard(it))});
}

function regionStrip() {
    return statCardStrip(
        statCard({
            title: 'North America',
            value: '$1.24m',
            detail: '18 stores',
            accent: 'var(--xh-blue)'
        }),
        statCard({
            title: 'Europe',
            value: '$836.5k',
            detail: '15 stores',
            accent: 'var(--xh-orange)'
        }),
        statCard({
            title: 'Asia Pacific',
            value: '$407.4k',
            detail: '9 stores',
            accent: 'var(--xh-purple)'
        })
    );
}

function textOption(label: string, bind: keyof PlaygroundCardProps) {
    return wrapperOption({
        label,
        propName: `StatCardProps.${bind}`,
        control: textInput({bind, width: 160, commitOnChange: true})
    });
}

function fmtLedger(v: number) {
    return fmtNumber(v, {precision: 0, ledger: true});
}

/** A change with an up/down glyph, colored by sign - or the reverse where a rise is bad. */
function fmtChange(v: number, riseIsBad: boolean = false) {
    const colorSpec: NumberFormatOptions['colorSpec'] = riseIsBad
        ? {pos: 'xh-neg-val', neg: 'xh-pos-val'}
        : true;
    return fmtPercent(v, {precision: 1, withSignGlyph: true, colorSpec});
}

class StatCardPanelModel extends HoistModel {
    @bindable accessor title = 'Net Revenue';
    @bindable accessor value = '€2.48m';
    @bindable accessor subValue = '+4.2%';
    @bindable accessor detail = 'vs. last month, 42 locations';
    @bindable accessor infoTooltip: string = null;
    @bindable accessor intent: Intent = null;
    @bindable accessor accent: string = null;

    /**
     * Props for the Playground card. Emptied fields resolve to undefined, so the snippet omits
     * them and the card omits their lines. The snippet reads this same getter, so the code shown
     * cannot drift from the instance beside it.
     */
    get cardProps(): PlaygroundCardProps {
        const {title, value, subValue, detail, infoTooltip, intent, accent} = this;
        return {
            title,
            value,
            subValue: subValue || undefined,
            detail: detail || undefined,
            infoTooltip: infoTooltip || undefined,
            intent: intent || undefined,
            accent: accent || undefined
        };
    }
}
