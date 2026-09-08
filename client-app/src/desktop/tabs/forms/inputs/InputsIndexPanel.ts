import {DateRangePickerModel} from '@xh/hoist/cmp/daterange';
import {filler, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistProps, Intent, managed, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dateRangePicker} from '@xh/hoist/desktop/cmp/daterange';
import {
    buttonGroupInput,
    checkbox,
    checkboxButton,
    codeInput,
    dateInput,
    intentInput,
    jsonInput,
    numberInput,
    picker,
    radioInput,
    segmentedControl,
    select,
    slider,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, computed, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {pluralize} from '@xh/hoist/utils/js';
import {sortBy} from 'lodash';
import {ReactElement} from 'react';
import {usStates} from '../../../../core/data';
import {
    demoGallery,
    demoGalleryTile,
    demoSection,
    wrapper,
    wrapperOption,
    wrapperOptionGroup
} from '../../../common';
import {INPUT_CATALOG, INPUT_CATEGORIES, InputCatalogEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';
import './InputsIndexPanel.scss';

export const inputsIndexPanel = hoistCmp.factory({
    displayName: 'InputsIndexPanel',
    model: creates(() => InputsIndexModel),

    render({model}) {
        const {visibleEntries, groupByCategory} = model,
            count = visibleEntries.length;
        return wrapper({
            title: 'All Inputs',
            icon: Icon.grip(),
            description: [
                'Every desktop `HoistInput`, live and side by side. Use it to find the right',
                'control, or to sweep the whole set after a framework change.',
                '',
                'Each tile opens a dedicated page with a playground, full variants, toolbar',
                'rendering, and `FormField` pairing.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/InputsIndexPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                },
                {
                    url: '$HR/desktop/cmp/input',
                    text: 'Input package',
                    notes: 'The full set of desktop Hoist input components.'
                }
            ],
            options: wrapperOptionGroup({
                label: 'All inputs on the page',
                items: [
                    wrapperOption({
                        label: 'Compact',
                        info: 'Where the input supports it.',
                        control: switchInput({bind: 'compact'})
                    }),
                    wrapperOption({
                        label: 'Disabled',
                        propName: 'HoistInputProps.disabled',
                        control: switchInput({bind: 'disabled'})
                    }),
                    wrapperOption({
                        label: 'Show inputs',
                        info: 'Off collapses the tiles to names, for fast scanning.',
                        control: switchInput({bind: 'showInputs'})
                    })
                ]
            }),
            item: panel({
                className: 'tb-inputs-index',
                width: '100%',
                height: '100%',
                scrollable: true,
                tbar: toolbar(
                    textInput({
                        bind: 'filter',
                        placeholder: 'Filter inputs...',
                        leftIcon: Icon.search(),
                        enableClear: true,
                        commitOnChange: true,
                        width: 220
                    }),
                    toolbarSep(),
                    span('Group by'),
                    segmentedControl({
                        bind: 'groupByCategory',
                        fill: false,
                        options: [
                            {value: true, label: 'Category'},
                            {value: false, label: 'A-Z'}
                        ]
                    }),
                    filler(),
                    span({
                        className: 'tb-inputs-index__count',
                        item: pluralize('input', count, true)
                    })
                ),
                item: vbox({
                    className: 'tbox-demo-body',
                    items: groupByCategory
                        ? INPUT_CATEGORIES.map(category => {
                              const entries = visibleEntries.filter(it => it.category === category);
                              return demoSection({
                                  key: category,
                                  omit: !entries.length,
                                  title: category,
                                  item: gallery({entries})
                              });
                          })
                        : gallery({entries: sortBy(visibleEntries, 'name')})
                })
            })
        });
    }
});

interface GalleryProps extends HoistProps<InputsIndexModel> {
    entries: InputCatalogEntry[];
}

const gallery = hoistCmp.factory<GalleryProps>(({model, entries}) =>
    demoGallery({
        minTileWidth: model.showInputs ? 240 : 180,
        items: entries.map(entry =>
            demoGalleryTile({
                key: entry.name,
                title: entry.name,
                description: entry.description,
                showInstance: model.showInputs,
                onClick: () => XH.navigate(entry.route),
                item: TILE_INPUTS[entry.name](model)
            })
        )
    })
);

const SC_OPTIONS = [
    {label: 'Trader', value: 'trader'},
    {label: 'Strategy', value: 'strategy'},
    {label: 'Fund', value: 'fund'}
];

/** One live input per catalog entry, bound to the index model. */
const TILE_INPUTS: Record<string, (m: InputsIndexModel) => ReactElement> = {
    TextInput: m =>
        textInput({
            bind: 'text',
            disabled: m.disabled,
            placeholder: 'Enter text...',
            width: '100%'
        }),
    TextArea: m =>
        textArea({
            bind: 'textArea',
            disabled: m.disabled,
            placeholder: 'Tell us your thoughts...',
            height: 60,
            width: '100%'
        }),
    JsonInput: m => jsonInput({bind: 'json', disabled: m.disabled, height: 60, width: '100%'}),
    CodeInput: m => codeInput({bind: 'code', disabled: m.disabled, height: 60, width: '100%'}),
    NumberInput: m =>
        numberInput({bind: 'number', disabled: m.disabled, displayWithCommas: true, width: '100%'}),
    Slider: m =>
        slider({
            bind: 'slider',
            disabled: m.disabled,
            min: 0,
            max: 100,
            labelRenderer: false,
            width: '100%'
        }),
    DateInput: m =>
        dateInput({bind: 'date', disabled: m.disabled, valueType: 'localDate', width: '100%'}),
    DateRangePicker: m =>
        dateRangePicker({
            model: m.dateRangeModel,
            buttonProps: {disabled: m.disabled},
            flex: 1
        }),
    Select: m =>
        select({
            bind: 'state',
            disabled: m.disabled,
            options: usStates,
            enableClear: true,
            placeholder: 'Select a state...',
            width: '100%'
        }),
    Picker: m =>
        picker({
            bind: 'states',
            disabled: m.disabled,
            compact: m.compact,
            options: usStates,
            enableMulti: true,
            displayNoun: 'state',
            buttonProps: {icon: Icon.globe()},
            width: '100%'
        }),
    SegmentedControl: m =>
        segmentedControl({
            bind: 'segment',
            disabled: m.disabled,
            compact: m.compact,
            options: SC_OPTIONS
        }),
    ButtonGroupInput: m =>
        buttonGroupInput({
            bind: 'chartType',
            disabled: m.disabled,
            items: [
                button({icon: Icon.chartLine(), text: 'Linear', value: 'linear'}),
                button({icon: Icon.chartArea(), text: 'Area', value: 'area'}),
                button({icon: Icon.chartBar(), text: 'Bar', value: 'bar'})
            ]
        }),
    RadioInput: m =>
        radioInput({
            bind: 'side',
            disabled: m.disabled,
            inline: true,
            options: ['Buy', 'Sell']
        }),
    IntentInput: m => intentInput({bind: 'intent', disabled: m.disabled, compact: m.compact}),
    Checkbox: m => checkbox({bind: 'checked', disabled: m.disabled, label: 'enabled'}),
    CheckboxButton: m => checkboxButton({bind: 'checked', disabled: m.disabled, text: 'Enabled'}),
    SwitchInput: m =>
        switchInput({bind: 'checked', disabled: m.disabled, label: 'Enabled:', labelSide: 'left'})
};

const SEEDS = {
    text: null,
    textArea: null,
    json: JSON.stringify({name: 'Toolbox'}, null, 2),
    code: 'const x = 1;',
    number: 2_000_000,
    slider: 45,
    date: LocalDate.today(),
    state: null,
    states: [],
    segment: 'strategy',
    chartType: 'area',
    side: 'Buy',
    intent: 'primary' as Intent,
    checked: true
};

class InputsIndexModel extends InputDemoModel {
    @bindable filter = '';
    @bindable groupByCategory = true;
    @bindable showInputs = true;

    @managed dateRangeModel = new DateRangePickerModel({});

    @bindable text: string = SEEDS.text;
    @bindable textArea: string = SEEDS.textArea;
    @bindable json: string = SEEDS.json;
    @bindable code: string = SEEDS.code;
    @bindable number: number = SEEDS.number;
    @bindable slider: number = SEEDS.slider;
    @bindable.ref date: LocalDate = SEEDS.date;
    @bindable state: string = SEEDS.state;
    @bindable.ref states: string[] = SEEDS.states;
    @bindable segment: string = SEEDS.segment;
    @bindable chartType: string = SEEDS.chartType;
    @bindable side: string = SEEDS.side;
    @bindable intent: Intent = SEEDS.intent;
    @bindable checked: boolean = SEEDS.checked;

    get inputSeeds() {
        return SEEDS;
    }

    @computed
    get visibleEntries(): InputCatalogEntry[] {
        const q = this.filter.trim().toLowerCase();
        return q
            ? INPUT_CATALOG.filter(
                  it =>
                      it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q)
              )
            : INPUT_CATALOG;
    }

    constructor() {
        super();
        makeObservable(this);
    }
}
