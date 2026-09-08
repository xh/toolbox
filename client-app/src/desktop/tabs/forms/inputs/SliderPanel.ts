import {form, FormModel} from '@xh/hoist/cmp/form';
import {creates, hoistCmp, managed} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {numberInput, slider, switchInput} from '@xh/hoist/desktop/cmp/input';
import {fmtThousands} from '@xh/hoist/format';
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

const ENTRY = inputEntry('Slider');

export const sliderPanel = hoistCmp.factory({
    displayName: 'SliderPanel',
    model: creates(() => SliderPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'A slider for one number, or for a `[min, max]` range when bound to a two-element',
                'array. Tick labels come from `labelStepSize` and can be formatted with',
                '`labelRenderer`.',
                '',
                'Give it a `width`; it does not measure its container.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/SliderPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/Slider.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Label step',
                    propName: 'SliderProps.labelStepSize',
                    control: numberInput({
                        bind: 'pgLabelStep',
                        min: 5,
                        max: 50,
                        stepSize: 5,
                        width: 70
                    })
                }),
                wrapperOption({
                    label: 'Step size',
                    propName: 'SliderProps.stepSize',
                    control: numberInput({bind: 'pgStep', min: 1, max: 25, width: 70})
                }),
                wrapperOption({
                    label: 'Track fill',
                    propName: 'SliderProps.showTrackFill',
                    control: switchInput({bind: 'pgTrackFill'})
                }),
                wrapperOption({
                    label: 'Vertical',
                    propName: 'SliderProps.vertical',
                    control: switchInput({bind: 'pgVertical'})
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig('slider', {
                    bind: 'value',
                    min: 0,
                    max: 100,
                    labelStepSize: model.pgLabelStep,
                    stepSize: model.pgStep,
                    showTrackFill: model.pgTrackFill ? undefined : false,
                    vertical: model.pgVertical || undefined,
                    height: model.pgVertical ? 160 : undefined,
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: slider({
                    bind: 'playground',
                    ...ambientProps,
                    min: 0,
                    max: 100,
                    labelStepSize: model.pgLabelStep,
                    stepSize: model.pgStep,
                    showTrackFill: model.pgTrackFill,
                    vertical: model.pgVertical,
                    width: model.pgVertical ? null : '100%',
                    height: model.pgVertical ? 160 : null
                })
            }),
            variants: [
                demoRow({
                    label: 'Range',
                    info: 'Two-element value, labelRenderer with $ and thousands',
                    item: slider({
                        bind: 'range',
                        ...ambientProps,
                        min: 50000,
                        max: 150000,
                        labelStepSize: 50000,
                        stepSize: 1000,
                        labelRenderer: v =>
                            '$' +
                            fmtThousands(v, {
                                label: true,
                                precision: 0,
                                labelCls: null,
                                asHtml: true
                            }),
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'No labels',
                    info: 'labelRenderer: false',
                    item: slider({
                        bind: 'noLabels',
                        ...ambientProps,
                        min: 0,
                        max: 100,
                        labelRenderer: false,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Fine steps',
                    info: 'stepSize: 0.1, labelStepSize: 1, min 0 max 5',
                    item: slider({
                        bind: 'fineSteps',
                        ...ambientProps,
                        min: 0,
                        max: 5,
                        stepSize: 0.1,
                        labelStepSize: 1,
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: slider({
                        bind: 'disabledSlider',
                        ...ambientProps,
                        disabled: true,
                        min: 0,
                        max: 100,
                        labelStepSize: 25,
                        width: '100%'
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
                                field: 'confidence',
                                item: slider({
                                    min: 0,
                                    max: 100,
                                    labelStepSize: 25,
                                    width: '100%'
                                })
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'allocation',
                                inline: true,
                                item: slider({
                                    min: 0,
                                    max: 100,
                                    labelStepSize: 25,
                                    width: '100%'
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
    playground: 45,
    range: [62000, 134000],
    noLabels: 30,
    fineSteps: 2.5,
    disabledSlider: 70
};

class SliderPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgLabelStep = 25;
    @bindable pgStep = 1;
    @bindable pgTrackFill = true;
    @bindable pgVertical = false;

    // Inputs
    @bindable playground: number = SEEDS.playground;
    @bindable.ref range: number[] = SEEDS.range;
    @bindable noLabels: number = SEEDS.noLabels;
    @bindable fineSteps: number = SEEDS.fineSteps;
    @bindable disabledSlider: number = SEEDS.disabledSlider;

    @managed
    override formModel = new FormModel({
        fields: [
            {
                name: 'confidence',
                displayName: 'Confidence',
                initialValue: 80,
                rules: [required]
            },
            {
                name: 'allocation',
                displayName: 'Allocation',
                initialValue: 90,
                rules: [({value}) => (value > 80 ? 'Must not exceed 80.' : null)]
            }
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super({commitOnChangeDefault: null});
        makeObservable(this);
        // Show the failing rule on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }
}
