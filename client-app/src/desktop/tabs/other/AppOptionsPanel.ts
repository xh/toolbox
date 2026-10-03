import {form, FormModel} from '@xh/hoist/cmp/form';
import type {AppOptionSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed, SizingMode, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {
    autoRefreshAppOption,
    sizingModeAppOption,
    themeAppOption
} from '@xh/hoist/desktop/cmp/appOption';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {radioCardInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {executeIfFunction} from '@xh/hoist/utils/js';
import {demoFrame, demoGrid, demoPanel, demoPlayground, demoSection} from '../../common/Demo';
import {wrapper} from '../../common/Wrapper';
import {chartThumb} from '../forms/inputs/RadioCardPreviews';

export const appOptionsPanel = hoistCmp.factory({
    displayName: 'AppOptionsPanel',
    model: creates(() => AppOptionsPanelModel),

    render({model}) {
        const {formModel} = model;
        return wrapper({
            title: 'App Options',
            icon: Icon.options(),
            description: [
                'App options are the user-facing settings shown in the Options dialog, opened',
                'from the app menu or via `XH.showOptionsDialog()`. An app declares them by',
                'implementing `HoistAppModel.getAppOptions()`, returning one `AppOptionSpec` per',
                'setting.',
                '',
                'Each option is backed by a preference (`prefName`) or by a',
                '`valueGetter` / `valueSetter` pair, and supplies a `formField` config for the',
                'dialog to render. Hoist ships presets for theme, grid sizing and auto-refresh.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/AppOptionsPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/appcontainer/README.md#app-options-dialog',
                    text: 'App Options docs',
                    notes: 'App Options Dialog section of the app shell guide.'
                },
                {
                    url: '$HR/desktop/cmp/appOption/ThemeAppOption.ts',
                    notes: 'Theme preset, with app-window preview cards.'
                },
                {
                    url: '$HR/desktop/cmp/appOption/SizingModeAppOption.ts',
                    notes: 'Grid sizing preset, with mini-grid preview cards.'
                },
                {
                    url: '$HR/desktop/cmp/input/RadioCardInput.ts',
                    notes: 'Card input behind the preset previews.'
                },
                {
                    url: '$TB/client-app/src/desktop/AppModel.ts',
                    notes: "Toolbox's own getAppOptions(), including a custom Font option."
                }
            ],
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Options dialog',
                        note: 'The real dialog for this app.',
                        item: demoFrame({
                            info: 'Changes made in the dialog apply to the app and are saved to your preferences.',
                            item: button({
                                icon: Icon.options(),
                                text: 'Open Options dialog',
                                outlined: true,
                                onClick: () => XH.showOptionsDialog()
                            })
                        })
                    }),
                    demoSection({
                        title: 'Built-in presets',
                        note: 'Bound to local fields here - nothing is applied or saved.',
                        item: form({
                            model: formModel,
                            item: demoGrid({
                                columns: 2,
                                items: [
                                    presetFrame({
                                        label: 'themeAppOption()',
                                        info: 'Default - preview cards',
                                        field: 'themeCards',
                                        spec: themeAppOption()
                                    }),
                                    presetFrame({
                                        label: 'themeAppOption({previewCards: false})',
                                        info: 'Compact SegmentedControl',
                                        field: 'themeSegmented',
                                        spec: themeAppOption({previewCards: false})
                                    }),
                                    presetFrame({
                                        label: 'sizingModeAppOption()',
                                        info: "Mini grids drawn at each mode's row height",
                                        field: 'sizingCards',
                                        spec: sizingModeAppOption()
                                    }),
                                    presetFrame({
                                        label: 'sizingModeAppOption({previewCards: false})',
                                        info: 'Compact SegmentedControl',
                                        field: 'sizingSegmented',
                                        spec: sizingModeAppOption({previewCards: false})
                                    }),
                                    presetFrame({
                                        label: 'sizingModeAppOption({modes: [...]})',
                                        info: 'Limited to a subset of modes',
                                        field: 'sizingSubset',
                                        spec: sizingModeAppOption({modes: SIZING_SUBSET})
                                    }),
                                    presetFrame({
                                        label: 'autoRefreshAppOption()',
                                        info: 'Omitted when the auto-refresh interval is 0',
                                        field: 'autoRefresh',
                                        spec: autoRefreshAppOption()
                                    })
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Custom option',
                        note: 'Any input works - here a RadioCardInput.',
                        item: demoPlayground({
                            instanceWidth: 360,
                            caption:
                                'Rendered from the spec at right. Toolbox uses the same pattern for its Font option.',
                            config: CUSTOM_SNIPPET,
                            value: formModel.values.chartType,
                            item: form({
                                model: formModel,
                                item: formField({field: 'chartType', ...CUSTOM_OPTION.formField})
                            })
                        })
                    })
                ]
            })
        });
    }
});

/**
 * One preset rendered the way the Options dialog renders it - a `formField` built from the spec's
 * `formField` config - but bound to a local field instead of the option's own name and value.
 */
function presetFrame({
    label,
    info,
    field,
    spec
}: {
    label: string;
    info: string;
    field: string;
    spec: AppOptionSpec;
}) {
    const omitted = executeIfFunction(spec.omit);
    return demoFrame({
        key: field,
        label,
        info: omitted ? `${info} - omitted in this app` : info,
        item: omitted ? null : formField({...spec.formField, field})
    });
}

const SIZING_SUBSET = [SizingMode.COMPACT, SizingMode.STANDARD, SizingMode.LARGE];

const CUSTOM_OPTION: AppOptionSpec = {
    name: 'defaultChartType',
    prefName: 'defaultChartType',
    refreshRequired: false,
    formField: {
        label: 'Chart type',
        item: radioCardInput({
            options: [
                {value: 'line', label: 'Line', preview: chartThumb('line')},
                {value: 'area', label: 'Area', preview: chartThumb('area')},
                {value: 'bar', label: 'Bar', preview: chartThumb('bar')}
            ]
        })
    }
};

const CUSTOM_SNIPPET = `{
    name: 'defaultChartType',
    prefName: 'defaultChartType',
    refreshRequired: false,
    formField: {
        label: 'Chart type',
        item: radioCardInput({
            options: [
                {value: 'line', label: 'Line', preview: chartThumb('line')},
                {value: 'area', label: 'Area', preview: chartThumb('area')},
                {value: 'bar', label: 'Bar', preview: chartThumb('bar')}
            ]
        })
    }
}`;

class AppOptionsPanelModel extends HoistModel {
    // Seeded from the app's current settings, then local - edits here never reach the app.
    @managed
    formModel = new FormModel({
        fields: [
            {name: 'themeCards', initialValue: XH.getPref('xhTheme', 'system')},
            {name: 'themeSegmented', initialValue: XH.getPref('xhTheme', 'system')},
            {name: 'sizingCards', initialValue: XH.sizingMode},
            {name: 'sizingSegmented', initialValue: XH.sizingMode},
            {name: 'sizingSubset', initialValue: XH.sizingMode},
            {name: 'autoRefresh', initialValue: XH.getPref('xhAutoRefreshEnabled', false)},
            {name: 'chartType', initialValue: 'area'}
        ]
    });
}
