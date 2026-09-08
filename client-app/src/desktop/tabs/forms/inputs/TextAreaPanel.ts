import {form, FormModel} from '@xh/hoist/cmp/form';
import {vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, managed} from '@xh/hoist/core';
import {lengthIs, required} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {numberInput, switchInput, textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoGrid,
    demoPlayground,
    demoRow,
    fmtDemoConfig,
    wrapperOption
} from '../../../common';
import {inputEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';
import {inputDemoPage} from './InputDemoPage';

const ENTRY = inputEntry('TextArea');

export const textAreaPanel = hoistCmp.factory({
    displayName: 'TextAreaPanel',
    model: creates(() => TextAreaPanelModel),

    render({model}) {
        const {
            ambientProps,
            ambientSnippetProps,
            formFieldProps,
            pgPlaceholder,
            pgSelectOnFocus,
            pgSpellCheck,
            pgHeight
        } = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'Multi-line text entry. Holds a fixed `height` (default 100) with internal',
                'scrolling, or flexes to fill a sized parent when given `flex`.',
                '',
                'Supports placeholder, select-on-focus, spell check and commit-on-change like',
                'TextInput.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/TextAreaPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/TextArea.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Placeholder',
                    propName: 'TextAreaProps.placeholder',
                    control: textInput({bind: 'pgPlaceholder', width: 150, commitOnChange: true})
                }),
                wrapperOption({
                    label: 'Select on focus',
                    propName: 'TextAreaProps.selectOnFocus',
                    control: switchInput({bind: 'pgSelectOnFocus'})
                }),
                wrapperOption({
                    label: 'Spell check',
                    propName: 'TextAreaProps.spellCheck',
                    control: switchInput({bind: 'pgSpellCheck'})
                }),
                wrapperOption({
                    label: 'Height',
                    propName: 'LayoutProps.height',
                    control: numberInput({
                        bind: 'pgHeight',
                        min: 60,
                        max: 300,
                        stepSize: 20,
                        width: 80
                    })
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig('textArea', {
                    bind: 'value',
                    placeholder: pgPlaceholder || undefined,
                    selectOnFocus: pgSelectOnFocus || undefined,
                    spellCheck: pgSpellCheck || undefined,
                    height: pgHeight !== 100 ? pgHeight : undefined,
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: textArea({
                    bind: 'playground',
                    ...ambientProps,
                    placeholder: pgPlaceholder,
                    selectOnFocus: pgSelectOnFocus,
                    spellCheck: pgSpellCheck,
                    height: pgHeight,
                    width: '100%'
                })
            }),
            variants: [
                demoRow({
                    label: 'Default',
                    info: 'height: 100 by default',
                    item: textArea({bind: 'plain', ...ambientProps, width: '100%'})
                }),
                demoRow({
                    label: 'Taller',
                    info: 'height: 160',
                    item: textArea({bind: 'notes', ...ambientProps, height: 160, width: '100%'})
                }),
                demoRow({
                    label: 'Flexing',
                    info: 'flex: 1 inside a 160px-tall vbox',
                    item: vbox({
                        height: 160,
                        width: '100%',
                        item: textArea({
                            bind: 'flexed',
                            ...ambientProps,
                            flex: 1,
                            width: '100%'
                        })
                    })
                }),
                demoRow({
                    label: 'Spell check',
                    info: 'spellCheck: true',
                    item: textArea({
                        bind: 'spelling',
                        ...ambientProps,
                        spellCheck: true,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: textArea({
                        bind: 'locked',
                        ...ambientProps,
                        disabled: true,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'Bound to a failing FormField rule',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidNotes',
                            label: null,
                            minimal: true,
                            ...formFieldProps,
                            item: textArea({width: '100%'})
                        })
                    })
                })
            ],
            form: demoGrid({
                columns: 2,
                items: [
                    demoFrame({
                        info: 'FormField, label above, required and length rules satisfied',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'notes',
                                ...formFieldProps,
                                item: textArea({width: '100%'})
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'inlineNotes',
                                inline: true,
                                ...formFieldProps,
                                item: textArea({width: '100%'})
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS = {
    playground: null,
    plain: null,
    notes: 'Line one.\nLine two.\nLine three.',
    flexed: null,
    spelling: 'Teh quick brown fox',
    locked: 'Read me, but do not edit me.'
};

class TextAreaPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgPlaceholder = 'Tell us your thoughts...';
    @bindable pgSelectOnFocus = false;
    @bindable pgSpellCheck = false;
    @bindable pgHeight = 100;

    // Inputs
    @bindable playground: string = SEEDS.playground;
    @bindable plain: string = SEEDS.plain;
    @bindable notes: string = SEEDS.notes;
    @bindable flexed: string = SEEDS.flexed;
    @bindable spelling: string = SEEDS.spelling;
    @bindable locked: string = SEEDS.locked;

    @managed
    override formModel = new FormModel({
        fields: [
            {
                name: 'notes',
                displayName: 'Notes',
                initialValue:
                    'This note demonstrates a FormField with its label positioned above the input.',
                rules: [required, lengthIs({max: 300})]
            },
            {
                name: 'inlineNotes',
                displayName: 'Notes',
                initialValue: '',
                rules: [required]
            },
            {name: 'invalidNotes', initialValue: 'Too short', rules: [lengthIs({min: 10})]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super();
        makeObservable(this);
        // Show the failing rules on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }
}
