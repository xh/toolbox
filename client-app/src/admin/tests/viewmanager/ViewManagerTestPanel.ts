import {badge} from '@xh/hoist/cmp/badge';
import {form} from '@xh/hoist/cmp/form';
import {div, filler, hbox, hframe, hspacer, placeholder, vframe} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dashCanvas, dashContainer} from '@xh/hoist/desktop/cmp/dash';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {jsonInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {get, isEqual} from 'lodash';
import {sampleGrid} from '../../../desktop/common';
import {ViewManagerTestModel} from './ViewManagerTestModel';
import './ViewManagerTest.scss';

export const viewManagerTestPanel = hoistCmp.factory({
    displayName: 'ViewManagerTestTab',
    className: 'tb-vm-test',
    model: creates(ViewManagerTestModel),

    render({model, className}) {
        return panel({
            className,
            item: hframe({
                items: [
                    panel({
                        collapsedTitle: 'Model Configuration',
                        collapsedIcon: Icon.gears(),
                        modelConfig: {
                            side: 'left',
                            defaultSize: 500
                        },
                        items: [
                            modelConFigForm(),
                            hframe(modelValueDisplay(), modelValueDisplay({showPendingValue: true}))
                        ]
                    }),
                    persistablesPanel()
                ]
            })
        });
    }
});

const modelConFigForm = hoistCmp.factory<ViewManagerTestModel>({
    render({model}) {
        const {isDirty, isValid} = model.configFormModel;
        return panel({
            title: 'Model Configuration',
            icon: Icon.gears(),
            compactHeader: true,
            flex: 'none',
            modelConfig: {
                side: 'top',
                defaultSize: 240
            },
            item: form({
                fieldDefaults: {commitOnChange: true, minimal: true},
                item: vframe({
                    className: 'xh-pad tb-vm-test__model-conf',
                    items: [
                        hbox(
                            formField({
                                field: 'entityName',
                                info: 'Affects loading of prior saved views',
                                width: '50%',
                                item: textInput()
                            }),
                            formField({
                                field: 'entityDisplayName',
                                info: 'For visual testing only',
                                width: '50%',
                                item: textInput()
                            })
                        ),
                        hbox(
                            formField({
                                field: 'localStorageKey',
                                info: 'Persists selected view, autoSave, favorites',
                                item: textInput({enableClear: true}),
                                width: '50%',
                                minWidth: '50%'
                            }),
                            formField({
                                field: 'enableSharing',
                                item: switchInput()
                            }),
                            formField({
                                field: 'enableDefault',
                                item: switchInput()
                            }),
                            formField({
                                field: 'enableAutoSave',
                                item: switchInput()
                            }),
                            formField({
                                field: 'enableFavorites',
                                item: switchInput()
                            })
                        )
                    ]
                })
            }),
            bbar: toolbar({
                compact: true,
                items: [
                    filler(),
                    button({
                        text: 'Rebuild View Manager Model',
                        icon: Icon.reset(),
                        intent: isDirty ? 'warning' : 'success',
                        outlined: !isDirty,
                        minimal: !isDirty,
                        disabled: !isValid,
                        onClick: () => model.rebuildViewManagerModelAsync()
                    })
                ]
            })
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
                    omit: !showPendingValue || !model.viewManagerModel?.isDirty
                }),
                badge({
                    intent: 'success',
                    item: 'Clean',
                    omit: !showPendingValue || model.viewManagerModel?.isDirty
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

        return panel({
            className: 'tb-vm-test__output',
            tbar: [
                viewManager(),
                filler(),
                viewManager({
                    menuButtonProps: {
                        icon: Icon.star(),
                        intent: 'primary'
                    },
                    showSaveButton: 'never'
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
        const {value, pendingValue} = model.viewManagerModel,
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
