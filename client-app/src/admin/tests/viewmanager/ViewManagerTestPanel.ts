import {badge} from '@xh/hoist/cmp/badge';
import {form} from '@xh/hoist/cmp/form';
import {box, filler, hbox, hframe, hspacer, placeholder, span, vframe} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
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
                    outputPanel()
                ]
            })
        });
    }
});

const modelConFigForm = hoistCmp.factory<ViewManagerTestModel>({
    render({model}) {
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
                fieldDefaults: {commitOnChange: true},
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
                        intent: 'success',
                        outlined: !model.configFormModel.isDirty,
                        minimal: !model.configFormModel.isDirty,
                        disabled: !model.configFormModel.isValid,
                        onClick: () => model.rebuildViewManagerModelAsync()
                    })
                ]
            })
        });
    }
});

const modelValueDisplay = hoistCmp.factory<ViewManagerTestModel>({
    render({model, showPendingValue}) {
        return panel({
            title: showPendingValue
                ? hbox(
                      'Pending Value',
                      badge({
                          intent: 'warning',
                          item: 'Dirty',
                          omit: !model.viewManagerModel?.isDirty
                      }),
                      badge({
                          intent: 'success',
                          item: 'Clean',
                          omit: model.viewManagerModel?.isDirty
                      })
                  )
                : 'Value',
            icon: Icon.json(),
            compactHeader: true,
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

// const outputPanel = hoistCmp.factory<ViewManagerTestModel>({});

const outputPanel = hoistCmp.factory<ViewManagerTestModel>({
    render({model}) {
        if (!model.viewManagerModel) return placeholder('ViewManager not yet created');

        return panel({
            className: 'tb-vm-test__output',
            tbar: [
                viewManager(),
                filler(),
                span({
                    className: 'xh-font-family-mono xh-font-size-small',
                    item: 'Available @ window.testViewManagerModel'
                })
            ],
            items: [
                persistedComp({
                    title: 'Grouping Chooser',
                    icon: Icon.treeList(),
                    persistPath: 'groupingChooser',
                    item: groupingChooser()
                }),
                persistedComp({
                    title: 'Filter Chooser',
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
                        height: 100,
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
                    title: 'Grid',
                    icon: Icon.gridPanel(),
                    persistPath: 'grid',
                    item: box({
                        height: 300,
                        item: sampleGrid({model: model.gridModel, omitGridTools: true})
                    })
                })
            ]
        });
    }
});

const persistedComp = hoistCmp.factory<ViewManagerTestModel>({
    render({title, icon, persistPath, children, model}) {
        const {value, pendingValue} = model.viewManagerModel,
            compVal = get(value, persistPath),
            compPendingVal = get(pendingValue, persistPath),
            atDefault = !compPendingVal,
            dirty = !isEqual(compVal, compPendingVal);

        return panel({
            title,
            icon,
            compactHeader: true,
            headerItems: [
                badge({
                    intent: 'primary',
                    item: 'Default State',
                    omit: !atDefault
                }),
                badge({
                    intent: 'warning',
                    item: 'Dirty',
                    omit: !dirty
                }),
                hspacer()
            ],
            className: 'tb-vm-test__comp',
            items: children
        });
    }
});
