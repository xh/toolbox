import {div, hbox, span} from '@xh/hoist/cmp/layout';
import type {ProgressBarProps} from '@xh/hoist/cmp/progressbar';
import {progressBar} from '@xh/hoist/cmp/progressbar';
import type {Intent, LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
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
    fmtDemoConfig
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
        const {barProps} = model;
        return wrapper({
            title: 'ProgressBar',
            icon: Icon.bars(),
            description: [
                'A `ProgressBar` shows a value against a maximum: the progress of a task, or usage',
                'against a limit. With no value it is indeterminate, for work of unknown length.',
                '',
                'The bar is presentation-only. It fills the width of a block or a column, shows a',
                'label and a figure above the track, and can mark a `target` on it. In a row, give',
                'it a `flex` or a `width`. The caller formats the figure. By default it is the',
                'value as a whole percent of the range.'
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
                    items: [
                        wrapperOption({
                            label: 'Indeterminate',
                            info: 'Omits the value.',
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
                            label: 'Value label',
                            propName: 'ProgressBarProps.valueLabel',
                            info: 'Empty for the default percent.',
                            control: textInput({
                                bind: 'valueLabel',
                                width: 160,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'Show value label',
                            propName: 'ProgressBarProps.showValueLabel',
                            control: switchInput({bind: 'showValueLabel'})
                        }),
                        wrapperOption({
                            label: 'Intent',
                            propName: 'ProgressBarProps.intent',
                            control: select({
                                bind: 'intent',
                                enableFilter: false,
                                enableClear: true,
                                width: 120,
                                options: ['primary', 'success', 'warning', 'danger']
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
                            instanceWidth: 320,
                            showValue: false,
                            caption: 'A value outside the range draws an empty or a full bar.',
                            config: fmtDemoConfig<ProgressBarProps>('progressBar', barProps),
                            item: progressBar({...barProps, width: '100%'})
                        })
                    }),
                    demoSection({
                        title: 'Share of a Total',
                        note: 'Gross market value by sector of the sample portfolio.',
                        item: sectorShares(model.sectorShares)
                    }),
                    demoSection({
                        title: 'Intent',
                        note: 'The caller picks the intent, for example from a threshold.',
                        item: demoGrid({
                            items: [
                                usageBar('Archive volume', 212, 500),
                                usageBar('Data volume', 388, 500),
                                usageBar('Log volume', 471, 500)
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Target',
                        note: 'target marks a goal or a limit on the track.',
                        item: demoGrid({
                            items: [
                                progressBar({
                                    label: 'Sales against quota',
                                    value: 68,
                                    target: 80,
                                    valueLabel: '68 of 100 units, quota 80'
                                }),
                                progressBar({
                                    label: 'Quota passed',
                                    value: 91,
                                    target: 80,
                                    intent: 'success',
                                    valueLabel: '91 of 100 units, quota 80'
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
                        note: 'No value. The fill slides along the track.',
                        item: demoGrid({
                            items: [
                                progressBar({label: 'Loading positions'}),
                                progressBar({label: 'Reconciling', intent: 'warning'}),
                                progressBar({domAttrs: {'aria-label': 'Loading'}})
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Bar Only',
                        note: 'showValueLabel: false, and a bar with no label.',
                        item: demoGrid({
                            items: [
                                progressBar({
                                    label: 'Upload',
                                    value: 35,
                                    showValueLabel: false
                                }),
                                progressBar({value: 60, domAttrs: {'aria-label': 'Upload'}}),
                                progressBar({
                                    value: 60,
                                    showValueLabel: false,
                                    domAttrs: {'aria-label': 'Upload'}
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'In a Row',
                        note: 'Three bars share a row of 420px with flex: 1. A long label wraps.',
                        item: hbox({
                            width: 420,
                            style: {gap: 'var(--xh-pad-double-px)'},
                            items: [
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
                        item: demoGrid({
                            columns: 4,
                            items: [
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
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoFrame({
                                    className: 'tb-progress-bar-panel__tall',
                                    item: progressBar({
                                        label: 'Batch 7 of 12',
                                        value: 7,
                                        max: 12,
                                        target: 9,
                                        valueLabel: '7 of 12'
                                    })
                                }),
                                demoFrame({
                                    className: 'tb-progress-bar-panel__thin',
                                    item: progressBar({
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
        items: shares.map(({sector, mktVal}) =>
            progressBar({
                key: sector,
                label: sector,
                value: mktVal,
                max: total,
                valueLabel: span(
                    fmtMillions(mktVal, {precision: 1, label: true}),
                    ', ',
                    fmtPercent(mktVal / total, {precision: 0})
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
        valueLabel: `${fmtNumber(used, {precision: 0})} of ${fmtNumber(limit, {precision: 0})} GB`
    });
}

class ProgressBarPanelModel extends HoistModel {
    @bindable accessor indeterminate = false;
    @bindable accessor value = 45;
    @bindable accessor max = 100;
    @bindable accessor target: number = null;
    @bindable accessor label = 'Import';
    @bindable accessor valueLabel: string = null;
    @bindable accessor showValueLabel = true;
    @bindable accessor intent: Intent = null;

    @observableRef accessor sectorShares: SectorShare[] = [];

    /**
     * Props for the Playground bar. Options left at their default resolve to undefined, so the
     * snippet omits them. The snippet reads this same getter, so the code shown cannot drift from
     * the bar beside it.
     */
    get barProps(): PlaygroundBarProps {
        const {indeterminate, value, max, target, label, valueLabel, showValueLabel, intent} = this;
        return {
            value: indeterminate ? undefined : (value ?? 0),
            max: max === 100 || max == null ? undefined : max,
            target: target ?? undefined,
            label: label || undefined,
            valueLabel: valueLabel || undefined,
            showValueLabel: showValueLabel ? undefined : false,
            intent: intent || undefined
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

/** The ProgressBar props the rail drives, as the plain values its inputs produce. */
interface PlaygroundBarProps {
    value?: number;
    max?: number;
    target?: number;
    label?: string;
    valueLabel?: string;
    showValueLabel?: boolean;
    intent?: Intent;
}
