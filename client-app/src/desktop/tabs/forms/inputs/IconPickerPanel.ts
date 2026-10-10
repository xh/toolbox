import {form, FormModel} from '@xh/hoist/cmp/form';
import {hbox, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, managed} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import type {IconPickerProps} from '@xh/hoist/desktop/cmp/input';
import {iconPicker, segmentedControl, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import type {HoistIconPrefix} from '@xh/hoist/icon';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {demoFrame, demoGrid, demoPlayground, demoRow, fmtDemoConfig} from '../../../common/Demo';
import {wrapperOption} from '../../../common/Wrapper';
import {inputEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';
import {inputDemoPage} from './InputDemoPage';

const ENTRY = inputEntry('IconPicker');

/** Toolbox's own registrations (see `core/Icons.ts`), plus a few built-ins. */
const CURATED_ICONS = [
    'github',
    'markdown',
    'react',
    'faceSmile',
    'faceMeh',
    'faceFrown',
    'chartLine',
    'rocket',
    'star',
    'flag',
    'bolt',
    'globe'
];

// Semantic icons for a hypothetical rules feature - app names for built-in Hoist glyphs. A picker
// with `valueField: 'name'` stores these names, so re-pointing one later updates every stored rule.
const RULE_ICONS = ['businessRule', 'complianceRule', 'riskRule'];
Icon.registerAll([
    {name: 'businessRule', faName: 'briefcase', displayName: 'Business rule'},
    {name: 'complianceRule', faName: 'balance-scale', displayName: 'Compliance rule'},
    {name: 'riskRule', faName: 'shield-check', displayName: 'Risk rule'}
]);

export const iconPickerPanel = hoistCmp.factory({
    displayName: 'IconPickerPanel',
    model: creates(() => IconPickerPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'A trigger button that opens a searchable grid of icons. The value is the',
                "icon's FontAwesome name (e.g. `'chart-line'`) - stable to persist, and rendered",
                'back with `Icon.get(value)`.',
                '',
                "Options come from `Icon.getCatalog()`: Hoist's built-in set plus any icon the app",
                "has registered via `Icon.register()`. Toolbox's own registrations - GitHub, React,",
                'the feedback faces - appear here with no extra wiring, and their registered',
                'keywords are searchable (try "feedback").',
                '',
                'Use the arrow keys and enter to choose from the filter box. Pass `icons` to offer',
                'a subset, by FA or `Icon` factory name.'
            ],
            links: [
                {
                    url: '$HR/icon/README.md',
                    text: 'Icon docs',
                    notes: 'Icon registration and the icon catalog.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/IconPickerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$TB/client-app/src/core/Icons.ts',
                    notes: 'Toolbox custom icon registrations.'
                },
                {url: '$HR/desktop/cmp/input/IconPicker.ts', notes: 'Hoist component.'},
                {url: '$HR/icon/impl/IconCatalog.ts', notes: 'Catalog behind the picker.'}
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Show name',
                    propName: 'IconPickerProps.showName',
                    control: switchInput({bind: 'pgShowName'})
                }),
                wrapperOption({
                    label: 'Filter',
                    propName: 'IconPickerProps.enableFilter',
                    info: 'Without it, the grid takes focus for keyboard nav.',
                    control: switchInput({bind: 'pgEnableFilter'})
                }),
                wrapperOption({
                    label: 'Clear',
                    propName: 'IconPickerProps.enableClear',
                    control: switchInput({bind: 'pgEnableClear'})
                }),
                wrapperOption({
                    label: 'Value field',
                    propName: 'IconPickerProps.valueField',
                    info: 'Emit the FA name, or the Icon name.',
                    control: segmentedControl({
                        bind: 'pgValueField',
                        fill: false,
                        compact: true,
                        options: ['faName', 'name']
                    })
                }),
                wrapperOption({
                    label: 'Weight',
                    propName: 'IconPickerProps.prefix',
                    info: 'Icons not registered in a weight fall back to their default.',
                    control: segmentedControl({
                        bind: 'pgPrefix',
                        fill: false,
                        compact: true,
                        options: ['far', 'fas', 'fal', 'fat']
                    })
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig<IconPickerProps>('iconPicker', {
                    bind: 'value',
                    showName: model.pgShowName ? undefined : false,
                    enableFilter: model.pgEnableFilter ? undefined : false,
                    enableClear: model.pgEnableClear ? undefined : false,
                    prefix: model.pgPrefix === 'far' ? undefined : model.pgPrefix,
                    valueField: model.pgValueField === 'faName' ? undefined : model.pgValueField,
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: iconPicker({
                    bind: 'playground',
                    ...ambientProps,
                    showName: model.pgShowName,
                    enableFilter: model.pgEnableFilter,
                    enableClear: model.pgEnableClear,
                    prefix: model.pgPrefix,
                    valueField: model.pgValueField
                })
            }),
            variants: [
                demoRow({
                    label: 'Rendered back',
                    info: 'Icon.get(value) - the persisted FA name round-trips',
                    item: hbox({
                        alignItems: 'center',
                        gap: 12,
                        items: [
                            iconPicker({bind: 'roundTrip', ...ambientProps}),
                            span(model.roundTrip ? Icon.get(model.roundTrip, {size: '2x'}) : null)
                        ]
                    })
                }),
                demoRow({
                    label: 'Semantic names',
                    info: "valueField: 'name' - stores the app's own icon names",
                    item: hbox({
                        alignItems: 'center',
                        gap: 12,
                        items: [
                            iconPicker({
                                bind: 'ruleIcon',
                                ...ambientProps,
                                valueField: 'name',
                                icons: RULE_ICONS,
                                columns: 3
                            }),
                            span({className: 'xh-font-family-mono', item: `'${model.ruleIcon}'`})
                        ]
                    })
                }),
                demoRow({
                    label: 'Icon only',
                    info: 'showName: false',
                    item: iconPicker({bind: 'iconOnly', ...ambientProps, showName: false})
                }),
                demoRow({
                    label: 'Subset',
                    info: 'icons: [...] - custom and built-in, by name',
                    item: iconPicker({
                        bind: 'subset',
                        ...ambientProps,
                        icons: CURATED_ICONS,
                        columns: 6
                    })
                }),
                demoRow({
                    label: 'No filter',
                    info: 'enableFilter: false - arrow keys work on open',
                    item: iconPicker({
                        bind: 'noFilter',
                        ...ambientProps,
                        icons: CURATED_ICONS,
                        enableFilter: false,
                        columns: 6
                    })
                }),
                demoRow({
                    label: 'Solid weight',
                    info: "prefix: 'fas' - regular-only custom icons fall back",
                    item: iconPicker({
                        bind: 'solid',
                        ...ambientProps,
                        icons: CURATED_ICONS,
                        prefix: 'fas',
                        columns: 6
                    })
                }),
                demoRow({
                    label: 'Button trigger',
                    info: 'styleButtonAsInput: false',
                    item: iconPicker({
                        bind: 'buttonTrigger',
                        ...ambientProps,
                        styleButtonAsInput: false
                    })
                }),
                demoRow({
                    label: 'Minimal popover',
                    info: 'popoverMinimal: true',
                    item: iconPicker({
                        bind: 'minimalPopover',
                        ...ambientProps,
                        popoverMinimal: true
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: iconPicker({bind: 'disabledIcon', ...ambientProps, disabled: true})
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'Bound to a failing FormField rule',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidIcon',
                            label: null,
                            minimal: true,
                            item: iconPicker()
                        })
                    })
                })
            ],
            toolbarItems: compact => [
                iconPicker({
                    bind: 'tbarIcon',
                    ...ambientProps,
                    compact,
                    showName: false
                }),
                toolbarSep(),
                iconPicker({bind: 'tbarNamedIcon', ...ambientProps, compact, width: 180})
            ],
            form: demoGrid({
                columns: 2,
                items: [
                    demoFrame({
                        info: 'FormField, label above, required rule satisfied',
                        item: form({
                            model: model.formModel,
                            item: formField({field: 'icon', item: iconPicker({width: 220})})
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'categoryIcon',
                                inline: true,
                                item: iconPicker()
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS: Record<string, string> = {
    playground: 'chart-line',
    roundTrip: 'rocket',
    ruleIcon: 'businessRule',
    iconOnly: 'star',
    subset: 'github',
    noFilter: 'face-smile',
    solid: 'flag',
    buttonTrigger: null,
    minimalPopover: null,
    disabledIcon: 'bolt',
    tbarIcon: 'globe',
    tbarNamedIcon: null
};

class IconPickerPanelModel extends InputDemoModel {
    // Playground props
    @bindable accessor pgShowName = true;
    @bindable accessor pgEnableFilter = true;
    @bindable accessor pgEnableClear = true;
    @bindable accessor pgPrefix: HoistIconPrefix = 'far';
    @bindable accessor pgValueField: 'faName' | 'name' = 'faName';

    // Inputs
    @bindable accessor playground: string = SEEDS.playground;
    @bindable accessor roundTrip: string = SEEDS.roundTrip;
    @bindable accessor ruleIcon: string = SEEDS.ruleIcon;
    @bindable accessor iconOnly: string = SEEDS.iconOnly;
    @bindable accessor subset: string = SEEDS.subset;
    @bindable accessor noFilter: string = SEEDS.noFilter;
    @bindable accessor solid: string = SEEDS.solid;
    @bindable accessor buttonTrigger: string = SEEDS.buttonTrigger;
    @bindable accessor minimalPopover: string = SEEDS.minimalPopover;
    @bindable accessor disabledIcon: string = SEEDS.disabledIcon;
    @bindable accessor tbarIcon: string = SEEDS.tbarIcon;
    @bindable accessor tbarNamedIcon: string = SEEDS.tbarNamedIcon;

    @managed
    override formModel = new FormModel({
        fields: [
            {name: 'icon', displayName: 'Icon', initialValue: 'cog', rules: [required]},
            {
                name: 'categoryIcon',
                displayName: 'Category icon',
                initialValue: null,
                rules: [required]
            },
            {name: 'invalidIcon', initialValue: null, rules: [required]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super({supportsCompact: true, commitOnChangeDefault: null});
        // Show the failing rules on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }
}
