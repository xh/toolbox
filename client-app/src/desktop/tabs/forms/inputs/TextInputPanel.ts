import {form, FormModel} from '@xh/hoist/cmp/form';
import {span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, managed} from '@xh/hoist/core';
import {required, validEmail} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {switchInput, textInput, TextInputProps} from '@xh/hoist/desktop/cmp/input';
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

const ENTRY = inputEntry('TextInput');

export const textInputPanel = hoistCmp.factory({
    displayName: 'TextInputPanel',
    model: creates(() => TextInputPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps, formFieldProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'Single-line text entry. Supports left icons, an inline clear button, password',
                'masking, and select-on-focus.',
                '',
                "Renders 200px wide by default - set `width`, or `flex: 1` / `width: '100%'` to",
                'fill a flex or grid parent.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/TextInputPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/TextInput.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Left icon',
                    propName: 'TextInputProps.leftIcon',
                    control: switchInput({bind: 'pgLeftIcon'})
                }),
                wrapperOption({
                    label: 'Clear button',
                    propName: 'TextInputProps.enableClear',
                    control: switchInput({bind: 'pgEnableClear'})
                }),
                wrapperOption({
                    label: 'Rounded',
                    propName: 'TextInputProps.round',
                    control: switchInput({bind: 'pgRound'})
                }),
                wrapperOption({
                    label: 'Placeholder',
                    propName: 'TextInputProps.placeholder',
                    control: textInput({bind: 'pgPlaceholder', width: 150, commitOnChange: true})
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig<TextInputProps>('textInput', {
                    bind: 'value',
                    leftIcon: model.pgLeftIcon ? raw('Icon.mail()') : undefined,
                    enableClear: model.pgEnableClear || undefined,
                    round: model.pgRound || undefined,
                    placeholder: model.pgPlaceholder || undefined,
                    ...ambientSnippetProps,
                    width: '100%'
                }),
                value: model.playground,
                item: textInput({
                    bind: 'playground',
                    ...ambientProps,
                    leftIcon: model.pgLeftIcon ? Icon.mail() : null,
                    enableClear: model.pgEnableClear,
                    round: model.pgRound,
                    placeholder: model.pgPlaceholder,
                    width: '100%'
                })
            }),
            variants: [
                demoRow({
                    label: 'Default',
                    info: 'No props beyond bind',
                    item: textInput({
                        bind: 'plain',
                        ...ambientProps,
                        placeholder: 'Enter text...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Password',
                    info: 'type: password, selectOnFocus',
                    item: textInput({
                        bind: 'password',
                        ...ambientProps,
                        type: 'password',
                        selectOnFocus: true,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Left element',
                    info: 'leftElement - wider than an icon, the padding tracks its width',
                    item: textInput({
                        bind: 'url',
                        ...ambientProps,
                        leftElement: span({className: 'tbox-demo-affix', item: 'https://'}),
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Right element',
                    info: 'rightElement - an action button inside the input',
                    item: textInput({
                        bind: 'search',
                        ...ambientProps,
                        placeholder: 'Search...',
                        rightElement: button({icon: Icon.search(), minimal: true}),
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: textInput({
                        bind: 'email',
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
                            field: 'invalidEmail',
                            label: null,
                            minimal: true,
                            ...formFieldProps,
                            item: textInput()
                        })
                    })
                })
            ],
            toolbarItems: () => [
                textInput({
                    bind: 'tbarSearch',
                    ...ambientProps,
                    placeholder: 'Search...',
                    leftIcon: Icon.search(),
                    width: 200
                }),
                toolbarSep(),
                textInput({
                    bind: 'tbarFlex',
                    ...ambientProps,
                    placeholder: 'Flexes to fill remaining space...',
                    flex: 1
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
                                field: 'email',
                                ...formFieldProps,
                                item: textInput({leftIcon: Icon.mail(), enableClear: true})
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'inlineEmail',
                                inline: true,
                                ...formFieldProps,
                                item: textInput()
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
    password: 'somethingSuperS3cret!',
    url: 'xh.io',
    search: null,
    email: 'support@xh.io',
    tbarSearch: null,
    tbarFlex: null
};

class TextInputPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgLeftIcon = true;
    @bindable pgEnableClear = true;
    @bindable pgRound = false;
    @bindable pgPlaceholder = 'Enter text...';

    // Inputs
    @bindable playground: string = SEEDS.playground;
    @bindable plain: string = SEEDS.plain;
    @bindable password: string = SEEDS.password;
    @bindable url: string = SEEDS.url;
    @bindable search: string = SEEDS.search;
    @bindable email: string = SEEDS.email;
    @bindable tbarSearch: string = SEEDS.tbarSearch;
    @bindable tbarFlex: string = SEEDS.tbarFlex;

    @managed
    override formModel = new FormModel({
        fields: [
            {
                name: 'email',
                displayName: 'Email',
                initialValue: 'support@xh.io',
                rules: [required, validEmail]
            },
            {
                name: 'inlineEmail',
                displayName: 'Email',
                initialValue: 'not-an-email',
                rules: [required, validEmail]
            },
            {name: 'invalidEmail', initialValue: 'not-an-email', rules: [required, validEmail]}
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
