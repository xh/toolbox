import {div} from '@xh/hoist/cmp/layout';
import type {StepSpec, StepsProps, StepStatus} from '@xh/hoist/cmp/steps';
import {steps} from '@xh/hoist/cmp/steps';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
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
import './StepsPanel.scss';

/** The lifecycle of an order, as an app would list it. */
const ORDER_STEPS: StepSpec[] = [
    {title: 'Received', detail: '09:30:02', description: 'Order accepted from the desk.'},
    {title: 'Validated', detail: '09:30:03', description: 'Limits and restrictions checked.'},
    {title: 'Routed', detail: '09:30:05', description: 'Sent to the broker.'},
    {title: 'Filled', description: 'Waiting for the last fills.'},
    {title: 'Settled', description: 'Two days after the trade date.'}
];

const TITLES_ONLY: StepSpec[] = ORDER_STEPS.map(({title}) => ({title}));

export const stepsPanel = hoistCmp.factory({
    displayName: 'StepsPanel',
    model: creates(() => StepsPanelModel),

    render({model}) {
        const {playgroundSteps, current, vertical, minStepWidth, clickable, wizardStep} = model;
        return wrapper({
            title: 'Steps',
            icon: Icon.treeList(),
            description: [
                '`Steps` shows an ordered sequence of steps, each with a status: the lifecycle of',
                'an order, the stages of a wizard, a workflow or a checklist. A line connects each',
                'step to the next.',
                '',
                'The component holds no state. Set `current` to derive each status from a',
                'position in the sequence, or set a `status` on each step. A horizontal row gives',
                'each step an equal share of the width, and its text wraps and is never truncated.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/StepsPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/steps/Steps.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/steps/Steps.scss', notes: 'Styles and CSS variables.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground steps.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    items: [
                        wrapperOption({
                            label: 'Current',
                            propName: 'StepsProps.current',
                            info: 'Empty to leave every step pending.',
                            control: numberInput({bind: 'current', min: 0, max: 5, width: 70})
                        }),
                        wrapperOption({
                            label: 'Vertical',
                            propName: 'StepsProps.vertical',
                            control: switchInput({bind: 'vertical'})
                        }),
                        wrapperOption({
                            label: 'Min step width',
                            propName: 'StepsProps.minStepWidth',
                            info: 'Empty for 96. Above 124 the row shows as vertical. 0 keeps the row.',
                            control: numberInput({bind: 'minStepWidth', min: 0, width: 70})
                        }),
                        wrapperOption({
                            label: 'Third step status',
                            propName: 'StepSpec.status',
                            info: 'A status on a step wins over current.',
                            control: select({
                                bind: 'thirdStatus',
                                enableFilter: false,
                                enableClear: true,
                                width: 130,
                                options: ['pending', 'current', 'complete', 'warning', 'error']
                            })
                        }),
                        wrapperOption({
                            label: 'Descriptions',
                            propName: 'StepSpec.description',
                            control: switchInput({bind: 'showDescriptions'})
                        }),
                        wrapperOption({
                            label: 'Details',
                            propName: 'StepSpec.detail',
                            control: switchInput({bind: 'showDetails'})
                        }),
                        wrapperOption({
                            label: 'Clickable',
                            propName: 'StepsProps.onStepClick',
                            info: 'A click makes that step current.',
                            control: switchInput({bind: 'clickable'})
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
                            instanceWidth: 620,
                            showValue: false,
                            caption: 'Five steps of an order. Set current to 5 to complete them.',
                            config: fmtDemoConfig<StepsProps>('steps', {
                                steps: raw('orderSteps'),
                                current: current ?? undefined,
                                vertical: vertical || undefined,
                                minStepWidth: minStepWidth ?? undefined,
                                onStepClick: clickable
                                    ? raw('(step, index) => model.setCurrent(index)')
                                    : undefined
                            }),
                            item: steps({
                                steps: playgroundSteps,
                                current,
                                vertical,
                                minStepWidth,
                                onStepClick: clickable ? (step, idx) => (model.current = idx) : null
                            })
                        })
                    }),
                    demoSection({
                        title: 'Horizontal',
                        note: 'Titles only, then with a detail and a description on each step.',
                        items: [
                            steps({steps: TITLES_ONLY, current: 2}),
                            steps({steps: ORDER_STEPS, current: 3, marginTop: 20})
                        ]
                    }),
                    demoSection({
                        title: 'Vertical',
                        note: 'A timeline with long text, and a checklist with a status per step.',
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoFrame({
                                    label: 'Timeline',
                                    info: 'current: 3',
                                    item: steps({
                                        vertical: true,
                                        current: 3,
                                        steps: ORDER_STEPS.map(it => ({
                                            ...it,
                                            description:
                                                it.title === 'Routed'
                                                    ? 'Sent to the broker over the primary route. The route fell back to the secondary session after a timeout, and the order was sent again with the same client order id.'
                                                    : it.description
                                        }))
                                    })
                                }),
                                demoFrame({
                                    label: 'Checklist',
                                    info: 'A status on each step, no current',
                                    item: steps({
                                        vertical: true,
                                        steps: [
                                            {title: 'Positions loaded', status: 'complete'},
                                            {
                                                title: 'Prices loaded',
                                                status: 'warning',
                                                description: '14 symbols use the prior close.'
                                            },
                                            {
                                                title: 'Limits checked',
                                                status: 'error',
                                                description: 'The limits service did not answer.'
                                            },
                                            {title: 'Report sent', status: 'pending'}
                                        ]
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Statuses',
                        note: 'Each status, set on its step.',
                        item: steps({
                            steps: STATUSES.map(status => ({
                                title: status,
                                status,
                                description: `status: '${status}'`
                            }))
                        })
                    }),
                    demoSection({
                        title: 'Icons',
                        note: 'icon replaces the number, the check and the status icons.',
                        item: steps({
                            current: 2,
                            steps: [
                                {title: 'Upload', icon: Icon.upload()},
                                {title: 'Map columns', icon: Icon.grid()},
                                {title: 'Review', icon: Icon.detail()},
                                {title: 'Import', icon: Icon.database()}
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Narrow',
                        note: 'Five steps at 340px. A row too narrow for its steps shows as vertical.',
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoFrame({
                                    label: 'Default',
                                    info: 'minStepWidth: 96',
                                    item: div({
                                        style: {width: 340},
                                        item: steps({steps: ORDER_STEPS, current: 3})
                                    })
                                }),
                                demoFrame({
                                    label: 'Kept as a row',
                                    info: 'minStepWidth: 0 - words break',
                                    item: div({
                                        style: {width: 340},
                                        item: steps({
                                            steps: ORDER_STEPS,
                                            current: 3,
                                            minStepWidth: 0
                                        })
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Clickable',
                        note: 'onStepClick moves a wizard, by mouse or keyboard.',
                        item: steps({
                            current: wizardStep,
                            onStepClick: (step, idx) => {
                                model.wizardStep = idx;
                                XH.toast({message: `Step ${idx + 1}: ${step.title}`});
                            },
                            steps: [
                                {title: 'Account', description: 'Pick an account.'},
                                {title: 'Instrument', description: 'Pick a symbol.'},
                                {title: 'Quantity', description: 'Set the size.'},
                                {title: 'Confirm', description: 'Review and send.'}
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Many Steps',
                        note: 'Nine steps in one row, some with long titles.',
                        item: steps({
                            current: 4,
                            steps: [
                                'Draft',
                                'Compliance review',
                                'Risk sign-off',
                                'Pricing',
                                'Client confirmation',
                                'Allocation',
                                'Booking',
                                'Settlement instructions',
                                'Closed'
                            ].map(title => ({title}))
                        })
                    }),
                    demoSection({
                        title: 'Restyled with CSS Variables',
                        note: 'Large markers, a success color and a thin connector.',
                        item: demoFrame({
                            className: 'tb-steps-panel__restyled',
                            item: steps({steps: TITLES_ONLY, current: 3})
                        })
                    })
                ]
            })
        });
    }
});

const STATUSES: StepStatus[] = ['pending', 'current', 'complete', 'warning', 'error'];

class StepsPanelModel extends HoistModel {
    @bindable accessor current: number = 2;
    @bindable accessor vertical = false;
    @bindable accessor minStepWidth: number = null;
    @bindable accessor thirdStatus: StepStatus = null;
    @bindable accessor showDescriptions = true;
    @bindable accessor showDetails = true;
    @bindable accessor clickable = false;

    /** Current step of the Clickable example. */
    @bindable accessor wizardStep = 1;

    /** The order steps as the rail sets them. */
    get playgroundSteps(): StepSpec[] {
        const {thirdStatus, showDescriptions, showDetails} = this;
        return ORDER_STEPS.map(({title, detail, description}, idx) => ({
            title,
            detail: showDetails ? detail : undefined,
            description: showDescriptions ? description : undefined,
            status: idx === 2 && thirdStatus ? thirdStatus : undefined
        }));
    }
}
