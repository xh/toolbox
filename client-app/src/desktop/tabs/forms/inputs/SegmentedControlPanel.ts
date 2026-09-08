import {form, FormModel} from '@xh/hoist/cmp/form';
import {SegmentedControlOption} from '@xh/hoist/cmp/input';
import {creates, hoistCmp, Intent, managed} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {intentInput, segmentedControl, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoGrid,
    demoPlayground,
    demoRow,
    fmtDemoConfig,
    raw,
    wrapperOption
} from '../../../common';
import {inputEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';
import {inputDemoPage} from './InputDemoPage';

const ENTRY = inputEntry('SegmentedControl');

const SC_OPTIONS = [
    {label: 'Trader', value: 'trader', icon: Icon.user()},
    {label: 'Strategy', value: 'strategy', icon: Icon.chessKnight()},
    {label: 'Fund', value: 'fund', icon: Icon.fund()}
];

const INTENT_OPTIONS: SegmentedControlOption[] = [
    {label: 'Primary', value: 'primary', intent: 'primary'},
    {label: 'Success', value: 'success', intent: 'success'},
    {label: 'Warning', value: 'warning', intent: 'warning'},
    {label: 'Danger', value: 'danger', intent: 'danger'}
];

export const segmentedControlPanel = hoistCmp.factory({
    displayName: 'SegmentedControlPanel',
    model: creates(() => SegmentedControlPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'A single choice from a small, mutually exclusive set, rendered as toggle segments',
                'in a tray. Fills its container by default or hugs its options with `fill: false`.',
                '',
                'Options take a label, value, icon, disabled flag and intent; a null-valued option',
                'gives the control an explicit empty state.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/SegmentedControlPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/SegmentedControl.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/input/SegmentedControlOption.ts', notes: 'Option shape.'},
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Fill width',
                    propName: 'SegmentedControlProps.fill',
                    control: switchInput({bind: 'pgFill'})
                }),
                wrapperOption({
                    label: 'Tray background',
                    propName: 'SegmentedControlProps.showTrayBackground',
                    control: switchInput({bind: 'pgTrayBackground'})
                }),
                wrapperOption({
                    label: 'Outlined',
                    propName: 'SegmentedControlProps.outlined',
                    control: switchInput({bind: 'pgOutlined'})
                }),
                wrapperOption({
                    label: 'Option dividers',
                    propName: 'SegmentedControlProps.showOptionDividers',
                    control: select({
                        bind: 'pgDividers',
                        enableFilter: false,
                        width: 90,
                        options: ['auto', 'true', 'false']
                    })
                }),
                wrapperOption({
                    label: 'Intent',
                    propName: 'SegmentedControlProps.intent',
                    control: intentInput({bind: 'pgIntent', enableClear: true})
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig('segmentedControl', {
                    bind: 'value',
                    options: raw('SC_OPTIONS'),
                    fill: model.pgFill ? undefined : false,
                    showTrayBackground: model.pgTrayBackground ? undefined : false,
                    outlined: model.pgOutlined ? undefined : false,
                    showOptionDividers:
                        model.pgDividers === 'auto' ? undefined : model.pgDividers === 'true',
                    intent: model.pgIntent || undefined,
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: segmentedControl({
                    bind: 'playground',
                    ...ambientProps,
                    fill: model.pgFill,
                    showTrayBackground: model.pgTrayBackground,
                    outlined: model.pgOutlined,
                    showOptionDividers:
                        model.pgDividers === 'auto' ? 'auto' : model.pgDividers === 'true',
                    intent: model.pgIntent ?? 'none',
                    options: SC_OPTIONS
                })
            }),
            variants: [
                demoRow({
                    label: 'Icon and text',
                    info: 'Default options with icons',
                    item: segmentedControl({
                        bind: 'iconText',
                        ...ambientProps,
                        options: SC_OPTIONS
                    })
                }),
                demoRow({
                    label: 'Empty state',
                    info: 'No value set - dividers appear until a choice is made',
                    item: segmentedControl({
                        bind: 'emptyState',
                        ...ambientProps,
                        options: SC_OPTIONS
                    })
                }),
                demoRow({
                    label: 'Per-option intents',
                    info: 'Each option carries its own intent',
                    item: segmentedControl({
                        bind: 'perOptionIntent',
                        ...ambientProps,
                        options: INTENT_OPTIONS
                    })
                }),
                demoRow({
                    label: 'Content-sized segments',
                    info: 'equalSegmentWidths: false',
                    item: segmentedControl({
                        bind: 'contentSized',
                        ...ambientProps,
                        equalSegmentWidths: false,
                        options: ['Short', 'A much longer label', 'Mid']
                    })
                }),
                demoRow({
                    label: 'Primitive options',
                    info: "options: ['Low', 'Medium', 'High']",
                    item: segmentedControl({
                        bind: 'primitiveOptions',
                        ...ambientProps,
                        options: ['Low', 'Medium', 'High']
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: segmentedControl({
                        bind: 'disabledExample',
                        ...ambientProps,
                        disabled: true,
                        options: SC_OPTIONS
                    })
                })
            ],
            toolbarItems: compact => [
                segmentedControl({
                    bind: 'tbarSegment',
                    ...ambientProps,
                    compact,
                    fill: false,
                    options: SC_OPTIONS
                }),
                toolbarSep(),
                segmentedControl({
                    bind: 'tbarLevel',
                    ...ambientProps,
                    compact,
                    fill: false,
                    options: ['Low', 'Medium', 'High']
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
                                field: 'role',
                                item: segmentedControl({fill: false, options: SC_OPTIONS})
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'level',
                                inline: true,
                                item: segmentedControl({
                                    fill: false,
                                    options: ['Low', 'Medium', 'High']
                                })
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS = {
    playground: 'strategy',
    iconText: 'strategy',
    emptyState: null,
    perOptionIntent: 'primary',
    contentSized: 'Short',
    primitiveOptions: 'Medium',
    disabledExample: 'fund',
    tbarSegment: null,
    tbarLevel: null
};

class SegmentedControlPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgFill = true;
    @bindable pgTrayBackground = true;
    @bindable pgOutlined = true;
    @bindable pgDividers: 'auto' | 'true' | 'false' = 'auto';
    @bindable pgIntent: Intent = null;

    // Inputs
    @bindable playground: string = SEEDS.playground;
    @bindable iconText: string = SEEDS.iconText;
    @bindable emptyState: string = SEEDS.emptyState;
    @bindable perOptionIntent: string = SEEDS.perOptionIntent;
    @bindable contentSized: string = SEEDS.contentSized;
    @bindable primitiveOptions: string = SEEDS.primitiveOptions;
    @bindable disabledExample: string = SEEDS.disabledExample;
    @bindable tbarSegment: string = SEEDS.tbarSegment;
    @bindable tbarLevel: string = SEEDS.tbarLevel;

    @managed
    override formModel = new FormModel({
        fields: [
            {name: 'role', displayName: 'Role', initialValue: 'trader', rules: [required]},
            {name: 'level', displayName: 'Level', initialValue: null, rules: [required]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super({supportsCompact: true, commitOnChangeDefault: null});
        makeObservable(this);
        // Show the failing 'level' rule on load - FormField displays messages only after
        // validation runs.
        this.formModel.validateAsync();
    }
}
