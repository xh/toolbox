import {hoistCmp, uses} from '@xh/hoist/core';
import {div, filler, span, vbox} from '@xh/hoist/cmp/layout';
import {form} from '@xh/hoist/cmp/form';
import {genDisplayName} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    codeInput,
    select,
    switchInput,
    textInput,
    numberInput,
    buttonGroupInput
} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {InputDef, ConfigPropertyDef, WidgetMeta} from '../dash/types';
import {AppModel} from '../AppModel';
import {getInputWidgetColor} from '../dash/colorCoding';

//--------------------------------------------------
// Constants
//--------------------------------------------------
const SOURCE_MANUAL = '__manual__';
const SOURCE_UNBOUND = '__unbound__';

//--------------------------------------------------
// Component
//--------------------------------------------------
/**
 * Settings form for a configurable widget.
 * Renders controls for the widget's declared inputs (with provider widget linkage)
 * and config properties. Shown in the modal dialog alongside the widget preview.
 */
export const widgetSettingsForm = hoistCmp.factory({
    displayName: 'WidgetSettingsForm',
    className: 'weather-v2-settings-form',
    model: uses(BaseWeatherWidgetModel, {publishMode: 'none'}),

    render({model, className}) {
        const meta = (model.constructor as any).meta as WidgetMeta;
        if (!meta) return null;

        const {inputs, config} = meta,
            hasInputs = inputs.length > 0,
            hasConfig = Object.keys(config).length > 0;

        return panel({
            className,
            scrollable: true,
            tbar: toolbar({
                className: 'weather-v2-settings-form__header',
                items: [
                    Icon.gear(),
                    span({className: 'weather-v2-settings-form__title', item: 'Settings'}),
                    filler(),
                    button({
                        icon: Icon.close(),
                        minimal: true,
                        onClick: () => model.panelModel.toggleIsModal()
                    })
                ]
            }),
            item: div({
                className: 'weather-v2-settings-form__body',
                items: [
                    hasInputs ? renderInputsSection(model, inputs) : null,
                    hasConfig ? renderConfigSection(model, config) : null
                ]
            })
        });
    }
});

//--------------------------------------------------
// Inputs Section — configure where each input comes from
//--------------------------------------------------
function renderInputsSection(widgetModel: BaseWeatherWidgetModel, inputs: InputDef[]) {
    return vbox({
        className: 'weather-v2-settings-form__section',
        items: [
            div({
                className: 'weather-v2-settings-form__section-title',
                item: 'Inputs'
            }),
            ...inputs.map(inputDef => renderInputField(widgetModel, inputDef))
        ]
    });
}

function renderInputField(widgetModel: BaseWeatherWidgetModel, inputDef: InputDef) {
    const viewState = widgetModel.viewModel.viewState ?? {},
        bindings = viewState.bindings ?? {},
        binding = bindings[inputDef.name],
        providers = findProviders(inputDef, widgetModel.viewModel.id),
        currentSource = determineSource(binding, viewState[inputDef.name]),
        isLinked = currentSource !== SOURCE_MANUAL && currentSource !== SOURCE_UNBOUND,
        isUnbound = currentSource === SOURCE_UNBOUND,
        manualValue = viewState[inputDef.name] ?? '';

    const sourceOptions = [
        {label: 'Set manually...', value: SOURCE_MANUAL},
        ...providers.map(p => ({
            label: formatProviderLabel(p),
            value: `${p.widgetId}:${p.outputName}`
        }))
    ];

    // Show "Not configured" only when currently unbound — once the user picks
    // a real source it disappears from the dropdown.
    if (isUnbound) {
        sourceOptions.unshift({label: 'Not configured', value: SOURCE_UNBOUND});
    }

    return vbox({
        className: 'weather-v2-settings-form__field',
        items: [
            div({
                className: `weather-v2-settings-form__field-label${isUnbound && inputDef.required ? ' weather-v2-settings-form__field-label--warning' : ''}`,
                items: [
                    isUnbound && inputDef.required
                        ? Icon.warning({className: 'weather-v2-settings-form__warning-icon'})
                        : null,
                    genDisplayName(inputDef.name)
                ]
            }),
            select({
                value: currentSource,
                options: sourceOptions,
                width: '100%',
                onChange: (val: string) => handleSourceChange(widgetModel, inputDef, val)
            }),
            currentSource === SOURCE_MANUAL
                ? renderManualInput(widgetModel, inputDef, manualValue)
                : null,
            isLinked
                ? div({
                      className: 'weather-v2-settings-form__linked-note',
                      items: [Icon.link(), span(' Linked to provider widget')]
                  })
                : null,
            isUnbound
                ? div({
                      className: 'weather-v2-settings-form__unbound-note',
                      items: [
                          Icon.warning(),
                          span(
                              inputDef.required
                                  ? ' Required input — select a source'
                                  : ' No source configured'
                          )
                      ]
                  })
                : null
        ]
    });
}

//--------------------------------------------------
// Config Section — widget-specific configuration via FormModel
//--------------------------------------------------
function renderConfigSection(
    widgetModel: BaseWeatherWidgetModel,
    config: Record<string, ConfigPropertyDef>
) {
    const {configFormModel} = widgetModel;
    if (!configFormModel) return null;

    return vbox({
        className: 'weather-v2-settings-form__section',
        items: [
            div({
                className: 'weather-v2-settings-form__section-title',
                item: 'Configuration'
            }),
            form({
                model: configFormModel,
                fieldDefaults: {commitOnChange: true},
                items: Object.entries(config).map(([key, def]) => renderConfigField(key, def))
            })
        ]
    });
}

function renderConfigField(configKey: string, configDef: ConfigPropertyDef) {
    const info = configDef.description || undefined;

    switch (configDef.type) {
        case 'boolean':
            return formField({field: configKey, info, item: switchInput({label: null})});

        case 'enum':
            if (configDef.enum && configDef.enum.length <= 3) {
                return formField({
                    field: configKey,
                    info,
                    item: buttonGroupInput({
                        outlined: true,
                        items: configDef.enum.map(opt => button({text: opt, value: opt, flex: 1}))
                    })
                });
            }
            return formField({
                field: configKey,
                info,
                item: select({options: configDef.enum ?? []})
            });

        case 'number':
            return formField({
                field: configKey,
                info,
                item: numberInput({min: configDef.min, max: configDef.max})
            });

        case 'string[]': {
            const knownOptions = extractOptionsFromDesc(configDef.description);
            if (knownOptions.length > 0) {
                return formField({
                    field: configKey,
                    info,
                    item: select({enableMulti: true, enableFilter: false, options: knownOptions})
                });
            }
            return formField({
                field: configKey,
                info,
                item: textInput({placeholder: 'Comma-separated values...'})
            });
        }

        case 'markdown':
            return formField({
                field: configKey,
                info,
                item: codeInput({mode: 'markdown', showFullscreenButton: true})
            });

        case 'string':
        default:
            return formField({field: configKey, info, item: textInput()});
    }
}

//--------------------------------------------------
// Helpers
//--------------------------------------------------

interface ProviderInfo {
    widgetId: string;
    outputName: string;
    widgetTitle: string;
    specId: string;
}

/** Find all widget instances that produce outputs compatible with the given input. */
function findProviders(inputDef: InputDef, currentWidgetId: string): ProviderInfo[] {
    const dashModel = AppModel.instance.weatherV2DashModel,
        canvasModel = dashModel.dashCanvasModel,
        providers: ProviderInfo[] = [];

    for (const vm of canvasModel.viewModels) {
        if (vm.id === currentWidgetId) continue;
        const meta = widgetRegistry.get(vm.viewSpec.id);
        if (!meta) continue;
        for (const output of meta.outputs) {
            if (output.type === inputDef.type) {
                providers.push({
                    widgetId: vm.id,
                    outputName: output.name,
                    widgetTitle: vm.title ?? meta.title,
                    specId: vm.viewSpec.id
                });
            }
        }
    }
    return providers;
}

/** Determine the current source setting for an input from its binding/value. */
function determineSource(binding: any, directValue: any): string {
    if (binding) {
        if ('fromWidget' in binding) return `${binding.fromWidget}:${binding.output}`;
        if ('const' in binding) return SOURCE_MANUAL;
    }
    if (directValue !== undefined) return SOURCE_MANUAL;
    return SOURCE_UNBOUND;
}

/** Handle changes to the source dropdown for an input. */
function handleSourceChange(
    widgetModel: BaseWeatherWidgetModel,
    inputDef: InputDef,
    newSource: string
) {
    // SOURCE_UNBOUND is a read-only display state — no-op
    if (newSource === SOURCE_UNBOUND) return;

    const viewState = {...(widgetModel.viewModel.viewState ?? {})},
        bindings = {...(viewState.bindings ?? {})};

    if (newSource === SOURCE_MANUAL) {
        delete bindings[inputDef.name];
        viewState[inputDef.name] = inputDef.default ?? '';
    } else {
        // Provider: "widgetId:outputName"
        const [fromWidget, output] = newSource.split(':');
        bindings[inputDef.name] = {fromWidget, output};
        delete viewState[inputDef.name];
    }

    viewState.bindings = Object.keys(bindings).length > 0 ? bindings : undefined;
    widgetModel.viewModel.setViewState(viewState);
}

/** Render the appropriate input control for a manual value based on the input's metadata. */
function renderManualInput(widgetModel: BaseWeatherWidgetModel, inputDef: InputDef, value: any) {
    const onChange = (val: any) => {
        const vs = {...(widgetModel.viewModel.viewState ?? {})};
        vs[inputDef.name] = val;
        widgetModel.viewModel.setViewState(vs);
    };

    if (inputDef.enum?.length) {
        return buttonGroupInput({
            className: 'weather-v2-settings-form__manual-input',
            value: value ?? inputDef.default ?? inputDef.enum[0],
            outlined: true,
            width: '100%',
            onChange,
            items: inputDef.enum.map(opt => button({text: opt, value: opt, flex: 1}))
        });
    }

    return textInput({
        className: 'weather-v2-settings-form__manual-input',
        value: value?.toString() ?? '',
        width: '100%',
        placeholder: `Enter ${inputDef.name}...`,
        onCommit: onChange
    });
}

/** Format a provider widget label for the source dropdown. */
function formatProviderLabel(provider: ProviderInfo): string {
    const color = getInputWidgetColor(provider.widgetId);
    const colorPrefix = color ? '\u25CF ' : '';
    return `${colorPrefix}${provider.widgetTitle}`;
}

/** Try to extract known options from a config description (e.g., quoted strings). */
function extractOptionsFromDesc(description?: string): string[] {
    const matches = description?.match(/"([^"]+)"/g);
    if (!matches || matches.length < 2) return [];
    return matches.map(m => m.replace(/"/g, ''));
}
