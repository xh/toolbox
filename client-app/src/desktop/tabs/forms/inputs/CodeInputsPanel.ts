import {form, FormModel} from '@xh/hoist/cmp/form';
import {creates, hoistCmp, managed} from '@xh/hoist/core';
import {isValidJson} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {codeInput, jsonInput, JsonInputProps, switchInput} from '@xh/hoist/desktop/cmp/input';
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

const ENTRY = inputEntry('JsonInput');

export const codeInputsPanel = hoistCmp.factory({
    displayName: 'CodeInputsPanel',
    model: creates(() => CodeInputsPanelModel),

    render({model}) {
        const {
            ambientProps,
            ambientSnippetProps,
            formFieldProps,
            pgAutoFormat,
            pgSearch,
            pgToolbar,
            pgFullscreen,
            pgWrap
        } = model;
        return inputDemoPage({
            entry: ENTRY,
            title: 'JsonInput & Code',
            description: [
                '`CodeInput` wraps CodeMirror with line numbers, search, a fullscreen mode and',
                'optional formatter and linter hooks. `JsonInput` is the preconfigured JSON',
                'variant with linting and auto-format built in.',
                '',
                'Both bind a string. Size with `height` and `width`.',
                '',
                'Commits on every change by default - turn the ambient switch off to commit on',
                'blur instead.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/CodeInputsPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/input/JsonInput.ts',
                    notes: 'Hoist component - preconfigured JSON editor.'
                },
                {
                    url: '$HR/desktop/cmp/input/CodeInput.ts',
                    notes: 'Hoist component - underlying base editor.'
                },
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Auto format',
                    propName: 'CodeInputProps.autoFormat',
                    info: 'Formats on blur.',
                    control: switchInput({bind: 'pgAutoFormat'})
                }),
                wrapperOption({
                    label: 'Search',
                    propName: 'CodeInputProps.enableSearch',
                    info: 'Forces the toolbar on.',
                    control: switchInput({bind: 'pgSearch'})
                }),
                wrapperOption({
                    label: 'Toolbar',
                    propName: 'CodeInputProps.showToolbar',
                    control: switchInput({bind: 'pgToolbar'})
                }),
                wrapperOption({
                    label: 'Fullscreen button',
                    propName: 'CodeInputProps.showFullscreenButton',
                    control: switchInput({bind: 'pgFullscreen'})
                }),
                wrapperOption({
                    label: 'Line wrapping',
                    propName: 'CodeInputProps.lineWrapping',
                    control: switchInput({bind: 'pgWrap'})
                })
            ],
            playground: demoPlayground({
                instanceWidth: 420,
                config: fmtDemoConfig<JsonInputProps>('jsonInput', {
                    bind: 'value',
                    autoFormat: pgAutoFormat || undefined,
                    enableSearch: pgSearch || undefined,
                    showToolbar: pgToolbar || undefined,
                    showFullscreenButton: pgFullscreen === false ? false : undefined,
                    lineWrapping: pgWrap || undefined,
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: jsonInput({
                    bind: 'playground',
                    ...ambientProps,
                    autoFormat: pgAutoFormat,
                    enableSearch: pgSearch,
                    showToolbar: pgToolbar,
                    showFullscreenButton: pgFullscreen,
                    lineWrapping: pgWrap,
                    height: 180,
                    width: '100%'
                })
            }),
            variants: [
                demoRow({
                    label: 'JsonInput',
                    info: 'Default - JSON linting and formatting',
                    item: jsonInput({bind: 'json', ...ambientProps, height: 140, width: '100%'})
                }),
                demoRow({
                    label: 'CodeInput',
                    info: 'Base editor, no language mode',
                    item: codeInput({bind: 'code', ...ambientProps, height: 140, width: '100%'})
                }),
                demoRow({
                    label: 'Read-only',
                    info: 'readonly: true',
                    item: codeInput({
                        bind: 'readonlyCode',
                        ...ambientProps,
                        readonly: true,
                        height: 140,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Line styles',
                    info: 'lineStyles highlighting line 2',
                    item: codeInput({
                        bind: 'styledCode',
                        ...ambientProps,
                        lineStyles: [{lines: [2], className: 'xh-intent-warning'}],
                        height: 140,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: jsonInput({
                        bind: 'disabledJson',
                        ...ambientProps,
                        disabled: true,
                        height: 140,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'isValidJson rule with malformed JSON',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidJson',
                            label: null,
                            minimal: true,
                            ...formFieldProps,
                            item: jsonInput({height: 140, width: '100%'})
                        })
                    })
                })
            ],
            form: demoGrid({
                columns: 2,
                items: [
                    demoFrame({
                        info: 'FormField, label above, isValidJson rule satisfied',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'config',
                                ...formFieldProps,
                                item: jsonInput({height: 120, width: '100%'})
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'overrides',
                                inline: true,
                                ...formFieldProps,
                                item: jsonInput({height: 120, width: '100%'})
                            })
                        })
                    })
                ]
            })
        });
    }
});

const TOOLBOX_JSON = JSON.stringify(
    {
        name: 'Toolbox',
        version: 4,
        features: ['grids', 'charts', 'forms'],
        config: {theme: 'dark', locale: 'en-US'}
    },
    null,
    2
);
const SAMPLE_CODE = "const model = new FormModel({\n    fields: [{name: 'email'}]\n});";

const SEEDS = {
    playground: TOOLBOX_JSON,
    json: TOOLBOX_JSON,
    code: SAMPLE_CODE,
    readonlyCode: SAMPLE_CODE,
    styledCode: SAMPLE_CODE,
    disabledJson: TOOLBOX_JSON
};

class CodeInputsPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgAutoFormat = true;
    @bindable pgSearch = true;
    @bindable pgToolbar = false;
    @bindable pgFullscreen = true;
    @bindable pgWrap = false;

    // Inputs
    @bindable playground: string = SEEDS.playground;
    @bindable json: string = SEEDS.json;
    @bindable code: string = SEEDS.code;
    @bindable readonlyCode: string = SEEDS.readonlyCode;
    @bindable styledCode: string = SEEDS.styledCode;
    @bindable disabledJson: string = SEEDS.disabledJson;

    @managed
    override formModel = new FormModel({
        fields: [
            {
                name: 'config',
                displayName: 'Config',
                initialValue: TOOLBOX_JSON,
                rules: [isValidJson]
            },
            {
                name: 'overrides',
                displayName: 'Overrides',
                initialValue: '{oops}',
                rules: [isValidJson]
            },
            {name: 'invalidJson', initialValue: '{"name": "Toolbox",}', rules: [isValidJson]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super({commitOnChangeDefault: true});
        makeObservable(this);
        // Show the failing rules on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }
}
