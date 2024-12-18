import {badge} from '@xh/hoist/cmp/badge';
import {form} from '@xh/hoist/cmp/form';
import {div, filler, hbox, hframe, hspacer, placeholder, vbox, vframe} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dashCanvas, dashContainer} from '@xh/hoist/desktop/cmp/dash';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {jsonInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {numberInput} from '@xh/hoist/desktop/cmp/input';
import {get, isEqual} from 'lodash';
import {sampleGrid} from '../../../desktop/common';
import {ViewManagerTestModel} from './ViewManagerTestModel';
import './ViewManagerTest.scss';

export const viewManagerTestPanel = hoistCmp.factory({
    displayName: 'ViewManagerTestTab',
    className: 'tb-vm-test',
    model: creates(ViewManagerTestModel),

    render({className}) {
        return panel({
            className,
            item: hframe({
                items: [
                    panel({
                        title: 'Model Config + Props',
                        icon: Icon.gears(),
                        compactHeader: true,
                        modelConfig: {
                            side: 'left',
                            defaultSize: 500
                        },
                        items: [
                            modelConfigForm(),
                            hframe(modelValueDisplay(), modelValueDisplay({showPendingValue: true}))
                        ]
                    }),
                    persistablesPanel()
                ]
            })
        });
    }
});

const modelConfigForm = hoistCmp.factory<ViewManagerTestModel>({
    render({model}) {
        const {configFormModel, modelConfigDirty} = model,
            {isValid} = configFormModel;
        return panel({
            flex: 'none',
            item: form({
                fieldDefaults: {commitOnChange: true, minimal: true, inline: true, labelWidth: 160},
                item: tabContainer({
                    modelConfig: {
                        tabs: [
                            {id: 'modelConfig', content: modelConfig()},
                            {id: 'cmpProps', title: 'Component Props', content: cmpProps()}
                        ]
                    }
                })
            }),
            bbar: toolbar({
                compact: true,
                items: [
                    filler(),
                    button({
                        text: 'Rebuild View Manager Model',
                        icon: Icon.reset(),
                        intent: modelConfigDirty ? 'warning' : 'success',
                        minimal: !modelConfigDirty,
                        disabled: !isValid,
                        onClick: () => model.rebuildViewManagerModelAsync()
                    })
                ]
            })
        });
    }
});

const cmpProps = hoistCmp.factory({
    render() {
        return vframe({
            className: 'xh-pad tb-vm-test__model-conf',
            items: [
                formField({
                    field: 'showSaveButton',
                    item: select({
                        options: ['always', 'never', 'whenDirty'],
                        enableFilter: false
                    })
                }),
                formField({
                    field: 'showRevertButton',
                    item: select({
                        options: ['always', 'never', 'whenDirty'],
                        enableFilter: false
                    })
                }),
                formField({
                    field: 'buttonSide',
                    item: select({
                        options: ['left', 'right'],
                        enableFilter: false
                    })
                }),
                hbox(
                    formField({
                        field: 'customMenuButtonProps',
                        item: switchInput()
                    })
                )
            ]
        });
    }
});

const modelConfig = hoistCmp.factory({
    render() {
        return vframe({
            className: 'xh-pad tb-vm-test__model-conf',
            items: [
                formField({
                    field: 'type',
                    item: textInput()
                }),
                formField({
                    field: 'typeDisplayName',
                    item: textInput({enableClear: true})
                }),
                formField({
                    field: 'globalDisplayName',
                    item: textInput({enableClear: true})
                }),
                formField({
                    field: 'localStorageKey',
                    item: textInput({enableClear: true})
                }),
                formField({
                    field: 'sessionStorageKey',
                    info: 'If set, will persist pendingValue',
                    item: textInput({enableClear: true})
                }),
                formField({
                    field: 'initialViewName',
                    item: textInput({enableClear: true})
                }),
                formField({
                    field: 'settleTime',
                    item: numberInput()
                }),
                hbox(
                    vbox(
                        formField({
                            field: 'enableAutoSave',
                            item: switchInput()
                        }),
                        formField({
                            field: 'enableDefault',
                            item: switchInput()
                        })
                    ),
                    vbox(
                        formField({
                            field: 'enableGlobal',
                            item: switchInput()
                        }),
                        formField({
                            field: 'enableSharing',
                            item: switchInput()
                        })
                    ),
                    vbox(
                        formField({
                            field: 'manageGlobal',
                            item: switchInput()
                        })
                    )
                ),
                hbox()
            ]
        });
    }
});

const modelValueDisplay = hoistCmp.factory<ViewManagerTestModel>({
    render({model, showPendingValue}) {
        let title = showPendingValue ? 'Pending' : 'Value';
        if (model.focusedPersistable) title += ` [${model.focusedPersistable}]`;

        return panel({
            title,
            icon: model.focusedPersistable ? Icon.target() : null,
            compactHeader: true,
            headerItems: [
                badge({
                    intent: 'danger',
                    item: 'Dirty',
                    omit: !showPendingValue || !model.viewManagerModel?.isValueDirty
                }),
                badge({
                    intent: 'success',
                    item: 'Clean',
                    omit: !showPendingValue || model.viewManagerModel?.isValueDirty
                }),
                hspacer()
            ],
            flex: 1,
            item: jsonInput({
                flex: 1,
                width: '100%',
                readonly: true,
                value: showPendingValue ? model.pendingValue : model.value,
                enableSearch: true
            })
        });
    }
});

const persistablesPanel = hoistCmp.factory<ViewManagerTestModel>({
    render({model}) {
        if (!model.viewManagerModel) return placeholder('ViewManager not yet created');

        const {showSaveButton, showRevertButton, customMenuButtonProps, buttonSide} =
                model.configFormModel.values,
            menuButtonProps = customMenuButtonProps
                ? ({
                      icon: Icon.star(),
                      intent: 'success'
                  } as const)
                : undefined;
        return panel({
            className: 'tb-vm-test__output',
            tbar: [
                filler({omit: buttonSide == 'right'}),
                viewManager({
                    showSaveButton,
                    showRevertButton,
                    menuButtonProps,
                    buttonSide
                })
            ],
            item: div({
                style: {overflowY: 'auto'},
                items: [
                    persistedComp({
                        title: 'Model Property via markPersist()',
                        icon: Icon.boxFull(),
                        persistPath: 'stringValue',
                        item: textInput({
                            bind: 'stringValue',
                            commitOnChange: true,
                            model: model.persistedPropertyModel,
                            width: '100%'
                        })
                    }),
                    persistedComp({
                        title: 'Grouping Chooser',
                        icon: Icon.treeList(),
                        persistPath: 'groupingChooser',
                        item: groupingChooser()
                    }),
                    persistedComp({
                        title: 'Filter Chooser (favorites persisted to localStorage)',
                        icon: Icon.filter(),
                        persistPath: 'filterChooser',
                        item: filterChooser()
                    }),
                    persistedComp({
                        title: 'Tab Container',
                        icon: Icon.folder(),
                        persistPath: 'tabContainer',
                        item: tabContainer()
                    }),
                    persistedComp({
                        title: 'Panel Sizing',
                        icon: Icon.arrowsLeftRight(),
                        persistPath: 'panel',
                        item: hbox({
                            className: 'xh-border',
                            height: 60,
                            items: [
                                panel({
                                    item: placeholder('Primary Panel')
                                }),
                                panel({
                                    item: placeholder('Secondary Panel'),
                                    model: model.panelModel
                                })
                            ]
                        })
                    }),
                    persistedComp({
                        title: 'Panel Sizing (defaultSize as percentage)',
                        icon: Icon.arrowsLeftRight(),
                        persistPath: 'panelPct',
                        item: hbox({
                            className: 'xh-border',
                            height: 60,
                            items: [
                                panel({
                                    item: placeholder('Primary Panel')
                                }),
                                panel({
                                    item: placeholder('Secondary Panel'),
                                    model: model.panelPctModel
                                })
                            ]
                        })
                    }),
                    persistedComp({
                        title: 'Grid',
                        icon: Icon.gridPanel(),
                        persistPath: 'grid',
                        minHeight: 250,
                        item: sampleGrid({omitGridTools: true})
                    }),
                    persistedComp({
                        title: 'Dash Canvas',
                        icon: Icon.layout(),
                        persistPath: 'dashCanvas',
                        minHeight: 250,
                        item: dashCanvas()
                    }),
                    persistedComp({
                        title: 'Dash Container',
                        icon: Icon.layout(),
                        persistPath: 'dashContainer',
                        minHeight: 500,
                        item: dashContainer()
                    })
                ]
            })
        });
    }
});

const persistedComp = hoistCmp.factory({
    model: uses(ViewManagerTestModel),
    render({title, icon, persistPath, children, model, minHeight}) {
        if (!persistPath) return null;
        const {viewManagerModel} = model,
            {value} = viewManagerModel.view,
            pendingValue = viewManagerModel.getValue(),
            compVal = get(value, persistPath),
            compPendingVal = get(pendingValue, persistPath),
            atDefault = !compPendingVal,
            dirty = !isEqual(compVal, compPendingVal),
            focused = persistPath === model.focusedPersistable;

        return panel({
            title,
            icon,
            minHeight,
            compactHeader: true,
            headerItems: [
                badge({
                    intent: 'primary',
                    item: 'Default State',
                    omit: !atDefault
                }),
                badge({
                    intent: 'warning',
                    item: 'Custom State',
                    omit: atDefault
                }),
                badge({
                    intent: 'danger',
                    item: 'Dirty',
                    omit: !dirty
                }),
                badge({
                    intent: 'success',
                    item: 'Clean',
                    omit: dirty
                }),
                button({
                    icon: Icon.target(),
                    intent: focused ? 'danger' : null,
                    minimal: !focused,
                    width: 38,
                    onClick: () => (model.focusedPersistable = focused ? null : persistPath)
                }),
                hspacer()
            ],
            className: 'tb-vm-test__comp',
            items: children
        });
    }
});
