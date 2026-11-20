import {div, hbox, span} from '@xh/hoist/cmp/layout';
import type {ProgressBarProps} from '@xh/hoist/cmp/progressbar';
import {progressBar} from '@xh/hoist/cmp/progressbar';
import type {Intent, LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {
    intentInput,
    numberInput,
    select,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {fmtMillions, fmtNumber, fmtPercent} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import {groupBy, map, orderBy, sumBy, take} from 'lodash';
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
import './ProgressBarPanel.scss';

/** Gross market value of one sector of the sample portfolio. */
interface SectorShare {
    sector: string;
    mktVal: number;
}

export const progressBarPanel = hoistCmp.factory({
    displayName: 'ProgressBarPanel',
    model: creates(() => ProgressBarPanelModel),

    render({model}) {
        const {barProps, barConfig} = model;
        return wrapper({
            title: 'ProgressBar',
            icon: Icon.bars(),
            description: [
                'A `ProgressBar` shows a value against a maximum: the progress of a task, or usage',
                'against a limit. Set `indeterminate` for work of unknown length.',
                '',
                'The bar is presentation-only. It fills the width of a block or a column, shows a',
                'label and a figure above the track, and can mark a `target` on it. In a row, give',
                'it a `flex` or a `width`. By default the figure is the value as a whole percent',
                'of the range. A `valueRenderer` function formats it from the raw value instead,',
                'and `valueRenderer: false` hides it.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/ProgressBarPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/progressbar/ProgressBar.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/progressbar/ProgressBar.scss', notes: 'Styles and CSS variables.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground bar.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    children: [
                        wrapperOption({
                            label: 'Indeterminate',
                            propName: 'ProgressBarProps.indeterminate',
                            info: 'Ignores the value.',
                            control: switchInput({bind: 'indeterminate'})
                        }),
                        wrapperOption({
                            label: 'Value',
                            propName: 'ProgressBarProps.value',
                            control: numberInput({
                                bind: 'value',
                                stepSize: 5,
                                width: 80,
                                disabled: model.indeterminate
                            })
                        }),
                        wrapperOption({
                            label: 'Max',
                            propName: 'ProgressBarProps.max',
                            control: numberInput({bind: 'max', stepSize: 10, width: 80})
                        }),
                        wrapperOption({
                            label: 'Target',
                            propName: 'ProgressBarProps.target',
                            info: 'Empty for no marker.',
                            control: numberInput({bind: 'target', stepSize: 5, width: 80})
                        }),
                        wrapperOption({
                            label: 'Label',
                            propName: 'ProgressBarProps.label',
                            control: textInput({bind: 'label', width: 160, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Value renderer',
                            propName: 'ProgressBarProps.valueRenderer',
                            info: 'Empty for the default percent.',
                            control: select({
                                bind: 'valueRenderer',
                                enableFilter: false,
                                enableClear: true,
                                width: 160,
                                options: [
                                    {value: 'units', label: 'Units function'},
                                    {value: 'hidden', label: 'Hidden (false)'}
                                ]
                            })
                        }),
                        wrapperOption({
                            label: 'Intent',
                            propName: 'ProgressBarProps.intent',
                            control: intentInput({bind: 'intent', enableClear: true})
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
                            instanceWidth: 320,
                            showValue: false,
                            caption: 'A value outside the range draws an empty or a full bar.',
                            config: fmtDemoConfig<ProgressBarProps>('progressBar', barConfig),
                            children: progressBar({...barProps, width: '100%'})
                        })
                    }),
                    demoSection({
                        title: 'Share of a Total',
                        note: 'Gross market value by sector of the sample portfolio.',
                        children: sectorShares(model.sectorShares)
                    }),
                    demoSection({
                        title: 'Intent',
                        note: 'Intent from a threshold. The figure takes the raw value, past max.',
                        children: demoGrid({
                            columns: 2,
                            children: [
                                usageBar('Archive volume', 212, 500),
                                usageBar('Data volume', 388, 500),
                                usageBar('Log volume', 471, 500),
                                usageBar('Scratch volume', 540, 500)
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Target',
                        note: 'target marks a goal or a limit on the track.',
                        children: demoGrid({
                            children: [
                                progressBar({
                                    label: 'Sales against quota',
                                    value: 68,
                                    target: 80,
                                    valueRenderer: v => `${v} of 100 units, quota 80`
                                }),
                                progressBar({
                                    label: 'Quota passed',
                                    value: 91,
                                    target: 80,
                                    intent: 'success',
                                    valueRenderer: v => `${v} of 100 units, quota 80`
                                }),
                                progressBar({
                                    label: 'Target at the end',
                                    value: 40,
                                    target: 100
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Indeterminate',
                        note: 'indeterminate: true. The fill slides along the track.',
                        children: demoGrid({
                            children: [
                                progressBar({label: 'Loading positions', indeterminate: true}),
                                progressBar({
                                    label: 'Reconciling',
                                    intent: 'warning',
                                    indeterminate: true
                                }),
                                progressBar({
                                    indeterminate: true,
                                    domAttrs: {'aria-label': 'Loading'}
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Bar Only',
                        note: 'valueRenderer: false, and a bar with no label.',
                        children: demoGrid({
                            children: [
                                progressBar({
                                    label: 'Upload',
                                    value: 35,
                                    valueRenderer: false
                                }),
                                progressBar({value: 60, domAttrs: {'aria-label': 'Upload'}}),
                                progressBar({
                                    value: 60,
                                    valueRenderer: false,
                                    domAttrs: {'aria-label': 'Upload'}
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'In a Row',
                        note: 'Three bars share a row of 420px with flex: 1. A long label wraps.',
                        children: hbox({
                            width: 420,
                            style: {gap: 'var(--xh-spacing-double)'},
                            children: [
                                progressBar({label: 'CPU', value: 34, flex: 1}),
                                progressBar({
                                    label: 'Memory',
                                    value: 71,
                                    intent: 'warning',
                                    flex: 1
                                }),
                                progressBar({
                                    label: 'Disk on the shared reporting volume',
                                    value: 93,
                                    intent: 'danger',
                                    flex: 1
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Odd Data',
                        note: 'The bar never fails. It draws an empty or a full bar.',
                        children: demoGrid({
                            columns: 4,
                            children: [
                                progressBar({label: 'value: 140', value: 140}),
                                progressBar({label: 'value: -5', value: -5}),
                                progressBar({label: 'value: NaN', value: NaN}),
                                progressBar({label: 'min: 10, max: 10', value: 5, min: 10, max: 10})
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Restyled with CSS Variables',
                        note: 'A tall, square bar and a thin one, set on a container.',
                        children: demoGrid({
                            columns: 2,
                            children: [
                                demoFrame({
                                    className: 'tb-progress-bar-panel__tall',
                                    children: progressBar({
                                        label: 'Batch 7 of 12',
                                        value: 7,
                                        max: 12,
                                        target: 9,
                                        valueRenderer: v => `${v} of 12`
                                    })
                                }),
                                demoFrame({
                                    className: 'tb-progress-bar-panel__thin',
                                    children: progressBar({
                                        label: 'Sync',
                                        value: 82,
                                        intent: 'success'
                                    })
                                })
                            ]
                        })
                    })
                ]
            })
        });
    }
});

/** Each sector's share of the gross market value, as bars on one scale. */
function sectorShares(shares: SectorShare[]) {
    const total = sumBy(shares, 'mktVal');
    return div({
        className: 'tb-progress-bar-panel__shares',
        children: shares.map(({sector, mktVal}) =>
            progressBar({
                key: sector,
                label: sector,
                value: mktVal,
                max: total,
                valueRenderer: v =>
                    span(
                        fmtMillions(v, {precision: 1, label: true}),
                        ', ',
                        fmtPercent(v / total, {precision: 0})
                    )
            })
        )
    });
}

/** Usage against a limit, with an intent from the share used. */
function usageBar(label: string, used: number, limit: number) {
    const share = used / limit,
        intent: Intent = share > 0.9 ? 'danger' : share > 0.75 ? 'warning' : 'success';
    return progressBar({
        label,
        value: used,
        max: limit,
        intent,
        valueRenderer: v =>
            `${fmtNumber(v, {precision: 0})} of ${fmtNumber(limit, {precision: 0})} GB`
    });
}

class ProgressBarPanelModel extends HoistModel {
    @bindable accessor indeterminate = false;
    @bindable accessor value = 45;
    @bindable accessor max = 100;
    @bindable accessor target: number = null;
    @bindable accessor label = 'Import';
    @bindable accessor valueRenderer: 'units' | 'hidden' = null;
    @bindable accessor intent: Intent = null;

    @observableRef accessor sectorShares: SectorShare[] = [];

    /**
     * Props for the Playground snippet. Options left at their default resolve to undefined, so the
     * snippet omits them. The bar reads this same getter through `barProps`, so the code shown
     * cannot drift from the bar beside it.
     */
    get barConfig(): PlaygroundBarConfig {
        const {indeterminate, value, max, target, label, valueRenderer, intent} = this;
        return {
            indeterminate: indeterminate || undefined,
            value: indeterminate ? undefined : (value ?? 0),
            max: max === 100 || max == null ? undefined : max,
            target: target ?? undefined,
            label: label || undefined,
            valueRenderer: valueRenderer ? raw(VALUE_RENDERERS[valueRenderer].code) : undefined,
            intent: intent || undefined
        };
    }

    /** Props for the Playground bar - the snippet's props, with the renderer it names. */
    get barProps(): ProgressBarProps {
        const {valueRenderer} = this;
        return {
            ...this.barConfig,
            valueRenderer: valueRenderer ? VALUE_RENDERERS[valueRenderer].fn : undefined
        };
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const positions = await XH.portfolioService.getPricedRawPositionsAsync({loadSpec}),
            shares = map(groupBy(positions, 'sector'), (rows, sector) => ({
                sector,
                mktVal: sumBy(rows, it => Math.abs(it.mktVal))
            }));
        runInAction(() => {
            this.sectorShares = take(orderBy(shares, 'mktVal', 'desc'), 6);
        });
    }
}

/**
 * The renderers the Playground offers, each with the code its snippet shows. The function shows
 * the raw value, so a value past `max` reads as given on a full bar.
 */
const VALUE_RENDERERS: Record<
    'units' | 'hidden',
    {fn: ProgressBarProps['valueRenderer']; code: string}
> = {
    units: {fn: v => `${v} units`, code: 'v => `${v} units`'},
    hidden: {fn: false, code: 'false'}
};

/** The ProgressBar props the rail drives, as the plain values its inputs produce. */
interface PlaygroundBarConfig {
    indeterminate?: boolean;
    value?: number;
    max?: number;
    target?: number;
    label?: string;
    valueRenderer?: {raw: string};
    intent?: Intent;
}
