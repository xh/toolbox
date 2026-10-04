import {form, FormModel} from '@xh/hoist/cmp/form';
import {creates, hoistCmp, managed} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import type {RadioCardInputProps, RadioCardOption} from '@xh/hoist/desktop/cmp/input';
import {radioCardInput, segmentedControl, switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoGrid,
    demoPlayground,
    demoRow,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapperOption} from '../../../common/Wrapper';
import {inputEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';
import {inputDemoPage} from './InputDemoPage';
import {chartThumb, layoutThumb} from './RadioCardPreviews';

const ENTRY = inputEntry('RadioCardInput');

interface ChartOptionsSpec {
    withDescriptions?: boolean;
    disablePie?: boolean;
}

/** Chart-type cards with SVG thumbnails - built fresh per instance. */
const chartOptions = ({withDescriptions, disablePie}: ChartOptionsSpec = {}): RadioCardOption[] => [
    {
        value: 'line',
        label: 'Line',
        preview: chartThumb('line'),
        description: withDescriptions ? 'Trends over time' : undefined
    },
    {
        value: 'area',
        label: 'Area',
        preview: chartThumb('area'),
        description: withDescriptions ? 'Cumulative volume' : undefined
    },
    {
        value: 'bar',
        label: 'Bar',
        preview: chartThumb('bar'),
        description: withDescriptions ? 'Compare categories' : undefined
    },
    {
        value: 'pie',
        label: 'Pie',
        preview: chartThumb('pie'),
        description: withDescriptions ? 'Share of a whole' : undefined,
        disabled: disablePie
    }
];

const layoutOptions = (): RadioCardOption[] => [
    {value: 'single', label: 'Single', preview: layoutThumb('single')},
    {value: 'split', label: 'Split', preview: layoutThumb('split')},
    {value: 'sidebar', label: 'Sidebar', preview: layoutThumb('sidebar')},
    {value: 'grid', label: 'Grid', preview: layoutThumb('grid')}
];

/** Plan tiers - text-only cards, with a description and no preview. */
const PLAN_OPTIONS: RadioCardOption[] = [
    {value: 'starter', label: 'Starter', description: 'Up to 5 users, community support'},
    {value: 'team', label: 'Team', description: 'Unlimited users, SSO, email support'},
    {
        value: 'enterprise',
        label: 'Enterprise',
        description: 'Contact sales to enable',
        disabled: true
    }
];

/** Notification channels, led by an explicit "None" card - the null-value option pattern. */
const notifyOptions = (): RadioCardOption[] => [
    {
        value: null,
        label: 'None',
        preview: Icon.disabled({size: '2x', className: 'tb-rc-none'})
    },
    {value: 'email', label: 'Email', preview: Icon.envelope({size: '2x'})},
    {value: 'push', label: 'Mobile push', preview: Icon.mobile({size: '2x'})},
    {value: 'inbox', label: 'In-app', preview: Icon.inbox({size: '2x'})}
];

export const radioCardInputPanel = hoistCmp.factory({
    displayName: 'RadioCardInputPanel',
    model: creates(() => RadioCardInputPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'A single choice from a few options, each drawn as a large card with a visual',
                '`preview`, a label and an optional `description`. The selected card takes an',
                'accent ring. Suits choices that are easier to see than to name - chart types,',
                'layouts, themes, typefaces.',
                '',
                'Renders as a `radiogroup` with arrow-key navigation. As with any radio group, a',
                'selected card cannot be cleared - offer "no value" as an explicit option with',
                "`value: null` and a label such as 'None'.",
                '',
                'All cards share one width - `cardWidth`, default 88px - and wrap onto new rows.',
                'Raise `cardWidth` for longer text, or set `fill` to stretch cards across the row.',
                '',
                'Reach for `SegmentedControl` or `RadioInput` when the options need no visual.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/RadioCardInputPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/RadioCardPreviews.ts',
                    notes: 'Chart and layout thumbnails used as card previews.'
                },
                {url: '$HR/desktop/cmp/input/RadioCardInput.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Card width',
                    propName: 'RadioCardInputProps.cardWidth',
                    info: 'Shared by every card. Default is 88px.',
                    control: segmentedControl({
                        bind: 'pgCardWidth',
                        fill: false,
                        options: [
                            {label: 'Default', value: null},
                            {label: '110', value: 110},
                            {label: '140', value: 140}
                        ]
                    })
                }),
                wrapperOption({
                    label: 'Fill',
                    propName: 'RadioCardInputProps.fill',
                    info: 'Stretch cards across each row, with card width as the minimum.',
                    control: switchInput({bind: 'pgFill'})
                }),
                wrapperOption({
                    label: 'Descriptions',
                    propName: 'RadioCardOption.description',
                    control: switchInput({bind: 'pgDescriptions'})
                }),
                wrapperOption({
                    label: 'Disable Pie',
                    propName: 'RadioCardOption.disabled',
                    control: switchInput({bind: 'pgDisablePie'})
                })
            ],
            playground: demoPlayground({
                instanceWidth: 420,
                config: fmtDemoConfig<RadioCardInputProps>('radioCardInput', {
                    bind: 'value',
                    options: raw('chartOptions()'),
                    cardWidth: model.pgCardWidth ?? undefined,
                    fill: model.pgFill || undefined,
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: radioCardInput({
                    bind: 'playground',
                    ...ambientProps,
                    cardWidth: model.pgCardWidth ?? undefined,
                    fill: model.pgFill,
                    options: chartOptions({
                        withDescriptions: model.pgDescriptions,
                        disablePie: model.pgDisablePie
                    })
                })
            }),
            variants: [
                demoRow({
                    label: 'Chart type',
                    info: 'SVG thumbnails as previews',
                    item: radioCardInput({
                        bind: 'chartType',
                        ...ambientProps,
                        options: chartOptions()
                    })
                }),
                demoRow({
                    label: 'Layout picker',
                    info: 'Wireframe previews',
                    item: radioCardInput({
                        bind: 'layout',
                        ...ambientProps,
                        options: layoutOptions()
                    })
                }),
                demoRow({
                    label: 'Icon previews',
                    info: "Icon previews, plus a 'None' card with value: null",
                    item: radioCardInput({
                        bind: 'notify',
                        ...ambientProps,
                        options: notifyOptions()
                    })
                }),
                demoRow({
                    label: 'Text only',
                    info: 'No preview, cardWidth: 140 for equal cards - one option disabled',
                    item: radioCardInput({
                        bind: 'plan',
                        ...ambientProps,
                        cardWidth: 140,
                        options: PLAN_OPTIONS
                    })
                }),
                demoRow({
                    label: 'Primitive options',
                    info: "options: ['Daily', 'Weekly', 'Monthly']",
                    item: radioCardInput({
                        bind: 'frequency',
                        ...ambientProps,
                        options: ['Daily', 'Weekly', 'Monthly']
                    })
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'Bound to a failing FormField rule',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidLayout',
                            label: null,
                            minimal: true,
                            item: radioCardInput({options: layoutOptions()})
                        })
                    })
                })
            ],
            form: demoGrid({
                columns: 2,
                items: [
                    demoFrame({
                        info: 'FormField, label above, required rule satisfied',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'chartType',
                                item: radioCardInput({options: chartOptions()})
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Label above, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'plan',
                                item: radioCardInput({cardWidth: 140, options: PLAN_OPTIONS})
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS = {
    playground: 'area',
    chartType: 'bar',
    layout: 'sidebar',
    notify: 'email',
    plan: 'team',
    frequency: 'Weekly'
};

class RadioCardInputPanelModel extends InputDemoModel {
    // Playground props
    @bindable accessor pgDescriptions = false;
    @bindable accessor pgDisablePie = false;
    @bindable accessor pgCardWidth: number = null;
    @bindable accessor pgFill = false;

    // Inputs
    @bindable accessor playground: string = SEEDS.playground;
    @bindable accessor chartType: string = SEEDS.chartType;
    @bindable accessor layout: string = SEEDS.layout;
    @bindable accessor notify: string = SEEDS.notify;
    @bindable accessor plan: string = SEEDS.plan;
    @bindable accessor frequency: string = SEEDS.frequency;

    @managed
    override formModel = new FormModel({
        fields: [
            {
                name: 'chartType',
                displayName: 'Chart type',
                initialValue: 'line',
                rules: [required]
            },
            {name: 'plan', displayName: 'Plan', initialValue: null, rules: [required]},
            {name: 'invalidLayout', initialValue: null, rules: [required]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super({commitOnChangeDefault: null});
        // Show the failing rules on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }
}
