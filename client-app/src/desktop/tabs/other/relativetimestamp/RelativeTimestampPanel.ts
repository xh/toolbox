import {box} from '@xh/hoist/cmp/layout';
import {relativeTimestamp, RelativeTimestampOptions} from '@xh/hoist/cmp/relativetimestamp';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, buttonGroup} from '@xh/hoist/desktop/cmp/button';
import {dateInput, numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {DAYS, HOURS, MINUTES, SECONDS} from '@xh/hoist/utils/datetime';
import {
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    fmtDemoConfig,
    raw,
    wrapper,
    wrapperOption,
    wrapperOptionGroup
} from '../../../common';
import {RelativeTimestampPanelModel} from './RelativeTimestampPanelModel';
import './RelativeTimestampPanel.scss';

/**
 * The props a snippet shows. `RelativeTimestampProps` is not exported by hoist-react, so compose
 * the public options with the two timestamp props the component declares alongside them.
 */
type RelTimestampProps = RelativeTimestampOptions & {bind?: string; timestamp?: Date | number};

/**
 * Offsets for the Across Targets section, re-anchored to the current moment on each render.
 * Labels name the bucket rather than an exact elapsed time, so they stay accurate as the
 * component's own timer advances the text between renders.
 */
const TARGETS: Array<{label: string; info: string; offset: number}> = [
    {label: 'Seconds ago', info: 'now - 30 seconds', offset: -30 * SECONDS},
    {label: 'Minutes ago', info: 'now - 5 minutes', offset: -5 * MINUTES},
    {label: 'Hours ago', info: 'now - 3 hours', offset: -3 * HOURS},
    {label: 'Days ago', info: 'now - 2 days', offset: -2 * DAYS},
    {label: 'In the future', info: 'now + 1 hour - needs allowFuture', offset: HOURS}
];

/** Render a `relativeTo` Date as the constructor call a developer would write. */
function relativeToSnippet(relativeTo: Date | number) {
    if (!relativeTo) return undefined;
    const iso = new Date(relativeTo).toISOString();
    return raw(`new Date('${iso}')`);
}

export const relativeTimestampPanel = hoistCmp.factory({
    displayName: 'RelativeTimestampPanel',
    model: creates(() => RelativeTimestampPanelModel),

    render({model}) {
        const {options} = model;
        return wrapper({
            title: 'Relative Timestamp',
            icon: Icon.clock(),
            description: [
                '`RelativeTimestamp` displays a timestamp in terms of how long ago, or how far in',
                'the future, it falls relative to the present moment (for example, "5 minutes',
                'ago"). It updates itself on a regular interval to stay current.',
                '',
                'Pick a target moment in the rail, then tune the display options to see how the',
                'output changes. The options apply to every instance on the page.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/relativetimestamp/RelativeTimestampPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/relativetimestamp/RelativeTimestamp.ts', notes: 'Hoist component.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground only',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Sets the Playground target.',
                    items: [
                        wrapperOption({
                            label: 'Target',
                            propName: 'RelativeTimestampProps.timestamp',
                            control: dateInput({
                                bind: 'timestamp',
                                width: 170,
                                timePrecision: 'second',
                                showActionsBar: true
                            }),
                            info: 'The moment rendered relative to now.'
                        }),
                        buttonGroup({
                            className: 'tb-rel-ts__presets',
                            items: [
                                button({
                                    text: '-90 days',
                                    onClick: () => model.setOffset(-90 * DAYS)
                                }),
                                button({text: '-1 hr', onClick: () => model.setOffset(-HOURS)}),
                                button({text: 'Now', onClick: () => model.setToNow()}),
                                button({text: '+1 hr', onClick: () => model.setOffset(HOURS)}),
                                button({text: '+7 days', onClick: () => model.setOffset(7 * DAYS)})
                            ]
                        })
                    ]
                }),
                wrapperOptionGroup({
                    label: 'All timestamps on the page',
                    items: [
                        wrapperOption({
                            label: 'Allow Future',
                            propName: 'RelativeTimestampOptions.allowFuture',
                            control: switchInput({bind: 'allowFuture'}),
                            info: 'Render future timestamps.'
                        }),
                        wrapperOption({
                            label: 'Short',
                            propName: 'RelativeTimestampOptions.short',
                            control: switchInput({bind: 'short'}),
                            info: `Abbreviate units, e.g. '1m'.`
                        }),
                        wrapperOption({
                            label: 'Prefix',
                            propName: 'RelativeTimestampOptions.prefix',
                            control: textInput({bind: 'prefix', width: 140, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Future Suffix',
                            propName: 'RelativeTimestampOptions.futureSuffix',
                            control: textInput({
                                bind: 'futureSuffix',
                                width: 140,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'Past Suffix',
                            propName: 'RelativeTimestampOptions.pastSuffix',
                            control: textInput({
                                bind: 'pastSuffix',
                                width: 140,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'Equal String',
                            propName: 'RelativeTimestampOptions.equalString',
                            control: textInput({
                                bind: 'equalString',
                                width: 140,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'Epsilon (secs)',
                            propName: 'RelativeTimestampOptions.epsilon',
                            // Commits on blur, unlike the text fields: a half-typed threshold
                            // would flip every instance in and out of its equal state.
                            control: numberInput({
                                bind: 'epsilon',
                                displayWithCommas: true,
                                min: 0,
                                width: 90
                            }),
                            info: 'Treat diffs within this as equal.'
                        }),
                        wrapperOption({
                            label: 'Empty Result',
                            propName: 'RelativeTimestampOptions.emptyResult',
                            control: textInput({
                                bind: 'emptyResult',
                                width: 140,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'LocalDate Mode',
                            propName: 'RelativeTimestampOptions.localDateMode',
                            control: select({
                                bind: 'localDateMode',
                                width: 150,
                                options: ['always', 'useTimeForSameDay', 'useTimeFor24Hr'],
                                placeholder: '',
                                enableClear: true
                            }),
                            info: 'Compare by calendar day.'
                        }),
                        wrapperOption({
                            label: 'Relative To',
                            propName: 'RelativeTimestampOptions.relativeTo',
                            control: dateInput({
                                bind: 'relativeTo',
                                width: 170,
                                timePrecision: 'second',
                                showActionsBar: true
                            }),
                            info: 'Compare against this, not now.'
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
                            instanceWidth: 300,
                            value: model.timestamp,
                            caption: 'Your chosen target, relative to now.',
                            config: fmtDemoConfig<RelTimestampProps>('relativeTimestamp', {
                                bind: 'timestamp',
                                ...options,
                                // A Date is not a literal, so show the expression a developer
                                // would actually write. Derived from `options` so it cannot
                                // disagree with the instance.
                                relativeTo: relativeToSnippet(options.relativeTo)
                            }),
                            item: box({
                                className: 'tb-rel-ts__value',
                                item: relativeTimestamp({bind: 'timestamp', ...options})
                            })
                        })
                    }),
                    demoSection({
                        title: 'Across Targets',
                        note: 'Fixed offsets from now, from seconds to days.',
                        item: demoGrid({
                            columns: 3,
                            items: [
                                ...TARGETS.map(({label, info, offset}) =>
                                    demoRow({
                                        key: label,
                                        label,
                                        info,
                                        item: relativeTimestamp({
                                            timestamp: new Date(Date.now() + offset),
                                            ...options
                                        })
                                    })
                                ),
                                demoRow({
                                    key: 'Empty',
                                    label: 'Empty',
                                    info: 'A null timestamp falls back to emptyResult',
                                    item: relativeTimestamp({timestamp: null, ...options})
                                })
                            ]
                        })
                    })
                ]
            })
        });
    }
});
