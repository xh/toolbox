import type {CalloutProps} from '@xh/hoist/cmp/callout';
import {callout} from '@xh/hoist/cmp/callout';
import {FormModel, form} from '@xh/hoist/cmp/form';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {div, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import type {Intent} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    numberInput,
    segmentedControl,
    select,
    slider,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, runInAction} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
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
import './CalloutPanel.scss';

type IconMode = 'default' | 'custom' | 'none';

const INTENTS: Intent[] = [null, 'primary', 'success', 'warning', 'danger'],
    LONG_URL =
        'https://reports.example.com/exports/positions/2026-11-18/rates-desk/eod-snapshot-final-v3-reconciled.csv',
    // Markdown renders single newlines as line breaks by default, so each paragraph is one line.
    RICH_BODY = [
        'Two of five regions failed to load: **APAC** and **LATAM**. Figures for those regions show the last good snapshot, from 07:45.',
        'Totals below are partial. [Retry the load](#retry) or see the [status page](https://status.example.com) for details.'
    ].join('\n\n'),
    STREAM_TEXT = [
        'Gross exposure rose 4.2% overnight, driven by the Rates desk.',
        'Two positions are over their single-name limit: ACME 5Y and GLOBEX 10Y.',
        'The desk has been notified and a reduction plan is due by noon.'
    ].join(' ');

export const calloutPanel = hoistCmp.factory({
    displayName: 'CalloutPanel',
    model: creates(() => CalloutPanelModel),

    render({model}) {
        const {calloutProps, calloutConfig, containerWidth} = model;
        return wrapper({
            title: 'Callout',
            icon: Icon.info(),
            description: [
                'A `Callout` is a short note set off within a body of content - a caveat in a',
                'form, a warning about stale data above a grid, or a summary in a detail panel.',
                'It shows an icon, an optional title and a body on a background tinted by its',
                '`intent`. It takes no model and works on desktop and mobile.',
                '',
                'Choose by where the message sits:',
                '',
                '* **Callout** - a block inside content, read along with it. No buttons, no close.',
                '* **Banner** - a status strip in app or panel chrome, edge to edge, with optional',
                'close and action buttons.',
                '* **Card** - a bordered container that groups other components under a header.',
                'Use it for a section, not a message.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/CalloutPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/callout/README.md', text: 'Callout docs'},
                {url: '$HR/cmp/callout/Callout.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/callout/Callout.scss', notes: 'Styles.'},
                {url: '$HR/styles/vars.scss', notes: 'CSS variables, in the Callouts block.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground callout.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    children: [
                        wrapperOption({
                            label: 'Intent',
                            propName: 'CalloutProps.intent',
                            info: 'Empty for a neutral callout.',
                            control: select({
                                bind: 'intent',
                                enableFilter: false,
                                enableClear: true,
                                width: 120,
                                options: ['primary', 'success', 'warning', 'danger']
                            })
                        }),
                        wrapperOption({
                            label: 'Icon',
                            propName: 'CalloutProps.icon',
                            info: 'Default is the intent icon. Neutral has none.',
                            control: segmentedControl({
                                bind: 'iconMode',
                                fill: false,
                                compact: true,
                                options: [
                                    {value: 'default', label: 'Default'},
                                    {value: 'custom', label: 'Clock'},
                                    {value: 'none', label: 'False'}
                                ]
                            })
                        }),
                        wrapperOption({
                            label: 'Title',
                            propName: 'CalloutProps.title',
                            control: textInput({bind: 'title', width: 160, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Body',
                            propName: 'CalloutProps.children',
                            alignTop: true,
                            control: textArea({
                                bind: 'body',
                                width: 160,
                                height: 90,
                                commitOnChange: true
                            })
                        }),
                        wrapperOption({
                            label: 'Markdown body',
                            info: 'Wraps the body in markdown().',
                            control: switchInput({bind: 'useMarkdown'})
                        })
                    ]
                }),
                wrapperOptionGroup({
                    label: 'Container',
                    info: 'Width of the Playground column.',
                    children: [
                        wrapperOption({
                            label: 'Width',
                            alignTop: true,
                            control: vbox({
                                width: 160,
                                children: [
                                    slider({
                                        bind: 'containerWidth',
                                        min: 240,
                                        max: 720,
                                        stepSize: 20,
                                        labelRenderer: false
                                    }),
                                    numberInput({
                                        bind: 'containerWidth',
                                        width: 80,
                                        min: 120,
                                        max: 1200
                                    })
                                ]
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
                            instanceWidth: containerWidth,
                            showValue: false,
                            caption: `Container width ${containerWidth}px. A blank title and body render nothing.`,
                            config: fmtDemoConfig<CalloutProps>('callout', calloutConfig),
                            children: div({
                                className: 'tb-callout-panel__measure',
                                children: callout(calloutProps)
                            })
                        })
                    }),
                    demoSection({
                        title: 'Intents',
                        note: 'Neutral (no intent) and each intent, with and without a title.',
                        children: demoGrid({
                            className: 'tb-callout-panel__gallery',
                            columns: 2,
                            children: INTENTS.flatMap(intent => [
                                callout({
                                    key: `${intent}-title`,
                                    intent,
                                    title: intentTitle(intent),
                                    children: intentBody(intent)
                                }),
                                callout({
                                    key: `${intent}-body`,
                                    intent,
                                    children: intentBody(intent)
                                })
                            ])
                        })
                    }),
                    demoSection({
                        title: 'Icons',
                        note: 'A custom icon, icon: false, and an icon on a neutral callout.',
                        children: demoGrid({
                            className: 'tb-callout-panel__gallery',
                            columns: 3,
                            children: [
                                callout({
                                    intent: 'primary',
                                    icon: Icon.clock(),
                                    title: 'Delayed prices',
                                    children: 'Prices are delayed 15 minutes.'
                                }),
                                callout({
                                    intent: 'warning',
                                    icon: false,
                                    title: 'No icon',
                                    children: 'icon: false. Color is the only signal here.'
                                }),
                                callout({
                                    icon: Icon.clock(),
                                    children: 'Positions as of the close of business.'
                                }),
                                callout({
                                    intent: 'success',
                                    icon: Icon.thumbsUp(),
                                    children: 'A custom icon, and a body with no title.'
                                }),
                                callout({
                                    intent: 'danger',
                                    icon: Icon.lock(),
                                    title: 'Read only',
                                    children: 'This book is locked for month-end close.'
                                }),
                                callout({
                                    title: 'Title only',
                                    icon: Icon.bookmark()
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'In a Form',
                        note: 'A caveat at the top of a form, and a summary in a detail panel.',
                        children: demoGrid({
                            columns: 2,
                            children: [orderForm({model: model.formModel}), tradeDetail()]
                        })
                    }),
                    demoSection({
                        title: 'Above a Grid',
                        note: 'A callout between other content, saying the data is partial.',
                        children: demoFrame({
                            label: 'Regional P&L',
                            info: 'Callouts above and below a grid',
                            children: vbox({
                                className: 'tb-callout-panel__stack',
                                children: [
                                    callout({
                                        intent: 'warning',
                                        title: 'Partial data',
                                        children: markdown({content: RICH_BODY})
                                    }),
                                    div({
                                        className: 'tb-callout-panel__grid',
                                        children: grid({model: model.gridModel})
                                    }),
                                    callout({
                                        icon: Icon.clock(),
                                        children: 'Data as of 07:45 ET. Next refresh at 08:00.'
                                    })
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Rich Content and Wrapping',
                        note: 'markdown() body, and a long unbroken URL at three widths.',
                        children: vbox({
                            className: 'tb-callout-panel__stack',
                            children: [
                                callout({
                                    intent: 'primary',
                                    title: 'Markdown body',
                                    children: markdown({content: RICH_BODY})
                                }),
                                callout({
                                    intent: 'primary',
                                    title: 'Plain string body',
                                    children:
                                        'A string renders as plain text, so **this** is not bold and [this](#) is not a link.'
                                }),
                                hbox({
                                    className: 'tb-callout-panel__row tb-callout-panel__widths',
                                    children: [200, 280, 360].map(w =>
                                        div({
                                            key: w,
                                            style: {width: w, flex: 'none'},
                                            children: demoFrame({
                                                chip: `${w}px`,
                                                children: callout({
                                                    intent: 'danger',
                                                    title: 'Export failed',
                                                    children: `Could not write ${LONG_URL}`
                                                })
                                            })
                                        })
                                    )
                                }),
                                demoFrame({
                                    label: 'In an hbox',
                                    info: 'flex: 1 beside a fixed column',
                                    children: hbox({
                                        className: 'tb-callout-panel__row',
                                        children: [
                                            div({
                                                className: 'tb-callout-panel__block',
                                                children: 'Fixed 160px'
                                            }),
                                            callout({
                                                flex: 1,
                                                intent: 'success',
                                                title: 'Saved',
                                                children:
                                                    'All 14 changes were saved and synced to the reporting database.'
                                            })
                                        ]
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Streaming',
                        note: 'The body grows over time from a title-only start, as in Chat Kit.',
                        children: streamingDemo()
                    }),
                    demoSection({
                        title: 'Restyled with CSS Variables',
                        note: 'No accent bar and tighter padding, set on a container.',
                        children: demoGrid({
                            columns: 2,
                            children: [
                                div({
                                    className: 'tb-callout-panel__flat',
                                    children: callout({
                                        intent: 'warning',
                                        children: 'A flat callout with no left bar.'
                                    })
                                }),
                                div({
                                    className: 'tb-callout-panel__flat',
                                    children: callout({
                                        intent: 'primary',
                                        title: 'Compact',
                                        children: 'Tighter padding and a square corner.'
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

const orderForm = hoistCmp.factory<FormModel>({
    displayName: 'CalloutOrderForm',
    model: false,
    render({model}) {
        return demoFrame({
            label: 'New order',
            children: form({
                model,
                fieldDefaults: {commitOnChange: true},
                children: vbox({
                    className: 'tb-callout-panel__form',
                    children: [
                        callout({
                            intent: 'primary',
                            children:
                                'Orders placed after 16:00 ET are queued for the next trading day.'
                        }),
                        formField({field: 'symbol', children: textInput()}),
                        formField({
                            field: 'quantity',
                            children: numberInput({displayWithCommas: true})
                        }),
                        formField({
                            field: 'side',
                            children: select({options: ['Buy', 'Sell'], enableFilter: false})
                        }),
                        callout({
                            intent: 'warning',
                            title: 'Large order',
                            omit: (model.values.quantity ?? 0) < 100_000,
                            children: 'Orders of 100,000 or more need desk-head approval.'
                        })
                    ]
                })
            })
        });
    }
});

const tradeDetail = hoistCmp.factory({
    displayName: 'CalloutTradeDetail',
    model: false,
    render() {
        const rows: [string, string][] = [
            ['Trade ID', 'T-104882'],
            ['Book', 'Rates NY'],
            ['Notional', '25,000,000'],
            ['Status', 'Rejected']
        ];
        return demoFrame({
            label: 'Trade detail',
            children: vbox({
                className: 'tb-callout-panel__form',
                children: [
                    callout({
                        intent: 'danger',
                        title: 'Limit breach',
                        children: 'VaR is 12% over its limit on the Rates desk.'
                    }),
                    ...rows.map(([k, v]) =>
                        hbox({
                            key: k,
                            className: 'tb-callout-panel__kv',
                            children: [span(k), span(v)]
                        })
                    ),
                    callout({
                        intent: 'success',
                        children: 'Counterparty checks passed.'
                    })
                ]
            })
        });
    }
});

const streamingDemo = hoistCmp.factory<CalloutPanelModel>({
    displayName: 'CalloutStreamingDemo',
    render({model}) {
        const {streamedBody, isStreaming} = model;
        return vbox({
            className: 'tb-callout-panel__stack',
            children: [
                hbox({
                    className: 'tb-callout-panel__row',
                    children: [
                        button({
                            text: isStreaming ? 'Streaming...' : 'Stream',
                            icon: Icon.play(),
                            intent: 'primary',
                            outlined: true,
                            disabled: isStreaming,
                            onClick: () => model.startStream()
                        }),
                        button({
                            text: 'Reset',
                            icon: Icon.reset(),
                            outlined: true,
                            onClick: () => model.resetStream()
                        }),
                        switchInput({bind: 'streamTitle', label: 'With title'})
                    ]
                }),
                div({
                    className: 'tb-callout-panel__stream',
                    children: callout({
                        intent: 'warning',
                        title: model.streamTitle ? 'Overnight risk summary' : null,
                        children: streamedBody
                    })
                }),
                span({
                    className: 'tb-callout-panel__caption',
                    children: `Body length ${streamedBody.length} of ${STREAM_TEXT.length}.`
                })
            ]
        });
    }
});

/** A string as a single-quoted JS literal, for the Playground snippet. */
function quote(v: string): string {
    return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

function intentTitle(intent: Intent): string {
    switch (intent) {
        case 'primary':
            return 'Note';
        case 'success':
            return 'Upload complete';
        case 'warning':
            return 'Stale data';
        case 'danger':
            return 'Limit breach';
        default:
            return 'Neutral';
    }
}

function intentBody(intent: Intent): string {
    switch (intent) {
        case 'primary':
            return 'Prices are delayed 15 minutes.';
        case 'success':
            return 'All 1,204 rows were imported.';
        case 'warning':
            return 'Positions are from yesterday’s close. Today’s load is running late.';
        case 'danger':
            return 'VaR is 12% over its limit on the Rates desk.';
        default:
            return 'No intent and no default icon.';
    }
}

class CalloutPanelModel extends HoistModel {
    @bindable accessor intent: Intent = 'warning';
    @bindable accessor iconMode: IconMode = 'default';
    @bindable accessor title = 'Stale data';
    @bindable accessor body = 'Positions are from yesterday’s close. Today’s load is running late.';
    @bindable accessor useMarkdown = false;
    @bindable accessor containerWidth = 360;

    @bindable accessor streamTitle = true;
    @bindable accessor streamedBody = '';
    @bindable accessor isStreaming = false;

    @managed formModel = new FormModel({
        fields: [
            {name: 'symbol', initialValue: 'ACME'},
            {name: 'quantity', initialValue: 250_000},
            {name: 'side', initialValue: 'Buy'}
        ]
    });

    @managed gridModel = new GridModel({
        store: {idSpec: 'region'},
        sortBy: 'region',
        columns: [
            {field: 'region', flex: 1},
            {
                field: {name: 'pnl', type: 'number'},
                headerName: 'P&L',
                width: 120,
                align: 'right',
                renderer: numberRenderer({precision: 0, colorSpec: true, nullDisplay: '-'})
            },
            {field: 'asOf', headerName: 'As of', width: 100}
        ]
    });

    /** Incremented to cancel a stream in progress. */
    private streamRun = 0;

    constructor() {
        super();
        this.gridModel.loadData([
            {region: 'Americas', pnl: 1_284_000, asOf: '08:00'},
            {region: 'EMEA', pnl: -312_500, asOf: '08:00'},
            {region: 'APAC', pnl: 905_200, asOf: '07:45'},
            {region: 'LATAM', pnl: -48_300, asOf: '07:45'},
            {region: 'Other', pnl: 12_900, asOf: '08:00'}
        ]);
    }

    /** Props for the Playground snippet. Options at their default resolve to undefined. */
    get calloutConfig() {
        const {intent, iconMode, title, body, useMarkdown} = this;
        return {
            intent: intent || undefined,
            icon:
                iconMode === 'custom'
                    ? raw('Icon.clock()')
                    : iconMode === 'none'
                      ? false
                      : undefined,
            title: title || undefined,
            children: body
                ? useMarkdown
                    ? raw(`markdown({content: ${quote(body)}})`)
                    : body
                : undefined
        };
    }

    /** Props for the Playground callout. */
    get calloutProps(): CalloutProps {
        const {intent, iconMode, title, body, useMarkdown} = this;
        return {
            intent,
            icon: iconMode === 'custom' ? Icon.clock() : iconMode === 'none' ? false : undefined,
            title,
            children: useMarkdown && body ? markdown({content: body}) : body
        };
    }

    async startStream() {
        const run = ++this.streamRun;
        runInAction(() => {
            this.streamedBody = '';
            this.isStreaming = true;
        });
        // Grow a few characters at a time, like a token stream.
        while (this.streamedBody.length < STREAM_TEXT.length) {
            await wait(50);
            if (run !== this.streamRun) return;
            runInAction(() => {
                const len = this.streamedBody.length + 2 + Math.floor(Math.random() * 6);
                this.streamedBody = STREAM_TEXT.slice(0, len);
            });
        }
        runInAction(() => (this.isStreaming = false));
    }

    @action
    resetStream() {
        this.streamRun++;
        this.isStreaming = false;
        this.streamedBody = '';
    }

    override destroy() {
        this.streamRun++;
        super.destroy();
    }
}
