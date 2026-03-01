import {hoistCmp} from '@xh/hoist/core';
import {div, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {
    select,
    switchInput,
    textInput,
    numberInput,
    buttonGroupInput
} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {InputDef, ConfigPropertyDef, WidgetMeta} from '../dash/types';
import {AppModel} from '../AppModel';
import {getInputWidgetColor} from '../dash/colorCoding';

//--------------------------------------------------
// Constants
//--------------------------------------------------
const SOURCE_DEFAULT = '__default__';
const SOURCE_MANUAL = '__manual__';

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

    render(props: any) {
        const widgetModel: BaseWeatherWidgetModel = props.widgetModel;
        const meta = (widgetModel.constructor as any).meta as WidgetMeta;
        if (!meta) return null;

        const {inputs, config} = meta,
            hasInputs = inputs.length > 0,
            hasConfig = Object.keys(config).length > 0;

        return vbox({
            ...props,
            className: 'weather-v2-settings-form',
            items: [
                toolbar({
                    className: 'weather-v2-settings-form__header',
                    items: [
                        Icon.gear(),
                        span({className: 'weather-v2-settings-form__title', item: 'Settings'}),
                        filler(),
                        button({
                            icon: Icon.close(),
                            minimal: true,
                            onClick: () => widgetModel.panelModel.toggleIsModal()
                        })
                    ]
                }),
                div({
                    className: 'weather-v2-settings-form__body',
                    items: [
                        hasInputs ? renderInputsSection(widgetModel, inputs) : null,
                        hasConfig ? renderConfigSection(widgetModel, config) : null
                    ]
                })
            ]
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
        isLinked = currentSource !== SOURCE_DEFAULT && currentSource !== SOURCE_MANUAL,
        manualValue = viewState[inputDef.name] ?? inputDef.default ?? '';

    const sourceOptions = [
        {
            label: `Default${inputDef.default != null ? ` (${inputDef.default})` : ''}`,
            value: SOURCE_DEFAULT
        },
        {label: 'Set manually...', value: SOURCE_MANUAL},
        ...providers.map(p => ({
            label: formatProviderLabel(p),
            value: `${p.widgetId}:${p.outputName}`
        }))
    ];

    return vbox({
        className: 'weather-v2-settings-form__field',
        items: [
            div({
                className: 'weather-v2-settings-form__field-label',
                item: inputDef.name
            }),
            select({
                value: currentSource,
                options: sourceOptions,
                width: '100%',
                onChange: (val: string) => handleSourceChange(widgetModel, inputDef, val)
            }),
            currentSource === SOURCE_MANUAL
                ? textInput({
                      className: 'weather-v2-settings-form__manual-input',
                      value: manualValue?.toString() ?? '',
                      width: '100%',
                      placeholder: `Enter ${inputDef.name}...`,
                      onCommit: (val: string) => {
                          const vs = {...(widgetModel.viewModel.viewState ?? {})};
                          vs[inputDef.name] = val;
                          widgetModel.viewModel.setViewState(vs);
                      }
                  })
                : null,
            isLinked
                ? div({
                      className: 'weather-v2-settings-form__linked-note',
                      items: [Icon.link(), span(' Linked to provider widget')]
                  })
                : null
        ]
    });
}

//--------------------------------------------------
// Config Section — widget-specific configuration
//--------------------------------------------------
function renderConfigSection(
    widgetModel: BaseWeatherWidgetModel,
    config: Record<string, ConfigPropertyDef>
) {
    return vbox({
        className: 'weather-v2-settings-form__section',
        items: [
            div({
                className: 'weather-v2-settings-form__section-title',
                item: 'Configuration'
            }),
            ...Object.entries(config).map(([key, def]) => renderConfigField(widgetModel, key, def))
        ]
    });
}

function renderConfigField(
    widgetModel: BaseWeatherWidgetModel,
    configKey: string,
    configDef: ConfigPropertyDef
) {
    const viewState = widgetModel.viewModel.viewState ?? {},
        currentValue = viewState[configKey] ?? configDef.default;

    const onChange = (val: any) => {
        widgetModel.viewModel.setViewStateKey(configKey, val);
    };

    let control;
    switch (configDef.type) {
        case 'boolean':
            control = switchInput({
                value: !!currentValue,
                onChange,
                inline: true,
                label: null
            });
            break;

        case 'enum':
            if (configDef.enum && configDef.enum.length <= 3) {
                control = buttonGroupInput({
                    value: currentValue,
                    onChange,
                    outlined: true,
                    width: '100%',
                    items: configDef.enum.map(opt => button({text: opt, value: opt, flex: 1}))
                });
            } else {
                control = select({
                    value: currentValue,
                    options: configDef.enum ?? [],
                    onChange,
                    width: '100%'
                });
            }
            break;

        case 'number':
            control = numberInput({
                value: currentValue,
                onCommit: onChange,
                width: '100%',
                min: configDef.min,
                max: configDef.max
            });
            break;

        case 'string[]':
            control = renderStringArrayControl(currentValue, configDef, onChange);
            break;

        case 'string':
        default:
            control = textInput({
                value: currentValue?.toString() ?? '',
                onCommit: onChange,
                width: '100%'
            });
            break;
    }

    return vbox({
        className: 'weather-v2-settings-form__field',
        items: [
            hbox({
                className: 'weather-v2-settings-form__field-label',
                items: [span(configKey), filler(), configDef.type === 'boolean' ? control : null]
            }),
            configDef.type !== 'boolean' ? control : null,
            configDef.description
                ? div({
                      className: 'weather-v2-settings-form__field-desc',
                      item: configDef.description
                  })
                : null
        ]
    });
}

/** Control for string[] config — renders switches for known options or a text input fallback. */
function renderStringArrayControl(
    value: string[],
    configDef: ConfigPropertyDef,
    onChange: (val: string[]) => void
) {
    const knownOptions = extractOptionsFromDesc(configDef.description);
    if (knownOptions.length > 0) {
        const currentSet = new Set(value ?? []);
        return vbox({
            className: 'weather-v2-settings-form__checkbox-group',
            items: knownOptions.map(opt =>
                hbox({
                    className: 'weather-v2-settings-form__checkbox-item',
                    alignItems: 'center',
                    items: [
                        switchInput({
                            value: currentSet.has(opt),
                            onChange: (checked: boolean) => {
                                const next = new Set(currentSet);
                                if (checked) next.add(opt);
                                else next.delete(opt);
                                onChange(Array.from(next));
                            },
                            inline: true,
                            label: null
                        }),
                        span({
                            className: 'weather-v2-settings-form__checkbox-label',
                            item: opt
                        })
                    ]
                })
            )
        });
    }

    return textInput({
        value: (value ?? []).join(', '),
        onCommit: (val: string) => {
            onChange(
                val
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
            );
        },
        width: '100%',
        placeholder: 'Comma-separated values...'
    });
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
    return SOURCE_DEFAULT;
}

/** Handle changes to the source dropdown for an input. */
function handleSourceChange(
    widgetModel: BaseWeatherWidgetModel,
    inputDef: InputDef,
    newSource: string
) {
    const viewState = {...(widgetModel.viewModel.viewState ?? {})},
        bindings = {...(viewState.bindings ?? {})};

    if (newSource === SOURCE_DEFAULT) {
        delete bindings[inputDef.name];
        delete viewState[inputDef.name];
    } else if (newSource === SOURCE_MANUAL) {
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

/** Format a provider widget label for the source dropdown. */
function formatProviderLabel(provider: ProviderInfo): string {
    const color = getInputWidgetColor(provider.widgetId);
    const colorPrefix = color ? '\u25CF ' : '';
    return `${colorPrefix}${provider.widgetTitle}`;
}

/** Try to extract known options from a config description (e.g., quoted strings). */
function extractOptionsFromDesc(description: string): string[] {
    const matches = description.match(/"([^"]+)"/g);
    if (!matches || matches.length < 2) return [];
    return matches.map(m => m.replace(/"/g, ''));
}
