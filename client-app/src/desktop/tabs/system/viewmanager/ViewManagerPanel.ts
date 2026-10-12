import type {ViewManagerConfig} from '@xh/hoist/cmp/viewmanager';
import {box, filler, hframe, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import type {ViewManagerProps} from '@xh/hoist/desktop/cmp/viewmanager';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import type {ReactNode} from 'react';
import {
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    demoToolbar,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {persistedComponents} from './PersistedComponents';
import {ViewManagerPanelModel} from './ViewManagerPanelModel';
import {viewStatePanel} from './ViewStatePanel';
import './ViewManagerPanel.scss';

export const viewManagerPanel = hoistCmp.factory({
    displayName: 'ViewManagerPanel',
    model: creates(ViewManagerPanelModel),

    render({model}) {
        return wrapper({
            title: 'ViewManager',
            icon: Icon.bookmark(),
            description: [
                'A **view** is a named bundle of component state. Bind a model to a',
                '`ViewManagerModel` with `persistWith: {viewManagerModel}`, and its state becomes',
                'part of every view.',
                '',
                'Views are private, shared with other users, or global for everyone. The',
                "**Default** view restores each component's in-code state. Users can turn on",
                'auto-save for views they own.',
                '',
                'In an app, create each `ViewManagerModel` in `AppModel.initAsync()`. This page',
                'builds its own, so you can change its config and rebuild it.',
                '',
                'To try it, change a component below. Its badge turns **Dirty** and the save button',
                'appears. Then save, revert, or switch views. Click a target button to show one',
                'component in the View State panel.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/system/viewmanager/ViewManagerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/viewmanager/README.md',
                    text: 'ViewManager docs',
                    notes: 'Views, sharing, pinning, and auto-save.'
                },
                {
                    url: '$HR/docs/persistence.md',
                    text: 'Persistence docs',
                    notes: 'Providers, paths, and the @persist decorator.'
                },
                {
                    url: '$HR/cmp/viewmanager/ViewManagerModel.ts',
                    notes: 'Hoist model - config, views, and the current value.'
                },
                {
                    url: '$HR/desktop/cmp/viewmanager/ViewManager.ts',
                    notes: 'Hoist component - the menu and its save and revert buttons.'
                }
            ],
            options: railOptions({model}),
            // One outer panel takes the demo region's card styling and holds the demo beside the
            // View State panel, so that panel stays in view while you scroll the demo.
            item: panel({
                width: '100%',
                height: '100%',
                item: hframe(
                    // Shrinks below its content's width, so the demo scrolls sideways instead of
                    // pushing the View State panel out of view.
                    box({
                        flex: 1,
                        minWidth: 0,
                        item: model.viewManagerModel
                            ? demoPanel({
                                  items: [
                                      playgroundSection(),
                                      variantsSection(),
                                      toolbarSection(),
                                      demoSection({
                                          title: 'Persisted Components',
                                          note: 'All bound to the one model. Badges show each one in the current view.',
                                          item: persistedComponents()
                                      })
                                  ]
                              })
                            : panel({
                                  mask: model.rebuildTask,
                                  item: placeholder(Icon.bookmark(), 'No ViewManagerModel')
                              })
                    }),
                    viewStatePanel()
                )
            })
        });
    }
});

//------------------------------------------------------------------
// Rail
//------------------------------------------------------------------
const railOptions = hoistCmp.factory<ViewManagerPanelModel>({
    render({model}) {
        const {isConfigPending, isConfigValid} = model;
        return [
            wrapperOptionGroup({
                label: 'Playground only - props',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Drives the Playground instance. The other instances keep their defaults.',
                items: [
                    wrapperOption({
                        label: 'Save button',
                        propName: 'ViewManagerProps.showSaveButton',
                        control: select({bind: 'showSaveButton', ...BUTTON_MODE_SELECT})
                    }),
                    wrapperOption({
                        label: 'Revert button',
                        propName: 'ViewManagerProps.showRevertButton',
                        control: select({bind: 'showRevertButton', ...BUTTON_MODE_SELECT})
                    }),
                    wrapperOption({
                        label: 'Button side',
                        propName: 'ViewManagerProps.buttonSide',
                        control: select({
                            bind: 'buttonSide',
                            options: ['left', 'right'],
                            enableFilter: false,
                            width: 110
                        })
                    })
                ]
            }),
            wrapperOptionGroup({
                label: 'ViewManagerModel config',
                info: 'Applies to every instance on the page. Takes effect when you rebuild.',
                items: [
                    wrapperOption({
                        label: 'Type',
                        propName: 'ViewManagerConfig.type',
                        info: 'Saved views are stored under this type.',
                        control: textInput({bind: 'type', width: 150})
                    }),
                    wrapperOption({
                        label: 'Instance',
                        propName: 'ViewManagerConfig.instance',
                        info: 'Keeps a separate current view for each instance of a type.',
                        control: textInput({bind: 'instance', width: 150})
                    }),
                    wrapperOption({
                        label: 'Type name',
                        propName: 'ViewManagerConfig.typeDisplayName',
                        control: textInput({bind: 'typeDisplayName', width: 150})
                    }),
                    wrapperOption({
                        label: 'Default name',
                        propName: 'ViewManagerConfig.defaultDisplayName',
                        control: textInput({bind: 'defaultDisplayName', width: 150})
                    }),
                    wrapperOption({
                        label: 'Global name',
                        propName: 'ViewManagerConfig.globalDisplayName',
                        control: textInput({bind: 'globalDisplayName', width: 150})
                    }),
                    wrapperOption({
                        label: 'Initial view',
                        propName: 'ViewManagerConfig.initialViewSpec',
                        info: 'Name of the view to start on, for a user with no last view.',
                        control: textInput({
                            bind: 'initialViewName',
                            enableClear: true,
                            width: 150
                        })
                    }),
                    wrapperOption({
                        label: 'Default view',
                        propName: 'ViewManagerConfig.enableDefault',
                        control: switchInput({bind: 'enableDefault'})
                    }),
                    wrapperOption({
                        label: 'Auto-save',
                        propName: 'ViewManagerConfig.enableAutoSave',
                        control: switchInput({bind: 'enableAutoSave'})
                    }),
                    wrapperOption({
                        label: 'Sharing',
                        propName: 'ViewManagerConfig.enableSharing',
                        control: switchInput({bind: 'enableSharing'})
                    }),
                    wrapperOption({
                        label: 'Global views',
                        propName: 'ViewManagerConfig.enableGlobal',
                        control: switchInput({bind: 'enableGlobal'})
                    }),
                    wrapperOption({
                        label: 'Manage global',
                        propName: 'ViewManagerConfig.manageGlobal',
                        info: 'The server decides who may manage global views. Off restricts it on this model. On defers to the server.',
                        control: switchInput({bind: 'manageGlobal'})
                    }),
                    wrapperOption({
                        label: 'Keep unsaved',
                        propName: 'ViewManagerConfig.preserveUnsavedChanges',
                        info: 'Keeps unsaved changes in session storage across a browser refresh.',
                        control: switchInput({bind: 'preserveUnsavedChanges'})
                    })
                ]
            }),
            wrapperAction({
                testId: 'vm-rebuild',
                icon: isConfigPending ? Icon.warning() : Icon.refresh(),
                text: isConfigPending ? 'Rebuild to apply changes' : 'Rebuild ViewManagerModel',
                intent: 'primary',
                disabled: !isConfigValid,
                title: 'Destroy and recreate the ViewManagerModel and every model bound to it.',
                onClick: () => model.rebuildAsync()
            })
        ];
    }
});

const BUTTON_MODE_SELECT = {
    options: ['whenDirty', 'always', 'never'],
    enableFilter: false,
    width: 110
};

//------------------------------------------------------------------
// Sections
//------------------------------------------------------------------
const playgroundSection = hoistCmp.factory<ViewManagerPanelModel>({
    render({model}) {
        const {viewManagerModel, showSaveButton, showRevertButton, buttonSide} = model;
        return demoSection({
            title: 'Playground',
            intent: 'primary',
            item: demoPlayground({
                instanceWidth: 300,
                caption: 'Open the menu to save, manage, and switch views.',
                config: [
                    modelSnippet(model),
                    fmtDemoConfig<ViewManagerProps>('viewManager', {
                        model: raw('viewManagerModel'),
                        showSaveButton: showSaveButton === 'whenDirty' ? undefined : showSaveButton,
                        showRevertButton:
                            showRevertButton === 'never' ? undefined : showRevertButton,
                        buttonSide: buttonSide === 'right' ? undefined : buttonSide
                    })
                ].join('\n\n'),
                value: model.viewSummary,
                item: box({
                    testId: 'vm-playground',
                    item: viewManager({
                        model: viewManagerModel,
                        showSaveButton,
                        showRevertButton,
                        buttonSide
                    })
                })
            })
        });
    }
});

/** The `createAsync` call that built the live model - framework defaults are left out. */
function modelSnippet(model: ViewManagerPanelModel): string {
    const c = model.appliedConfig,
        initialViewSpec = c.initialViewName
            ? raw(`views => views.find(it => it.name === '${c.initialViewName}')`)
            : !c.enableDefault
              ? raw('views => views[0]')
              : undefined;
    const call = fmtDemoConfig<ViewManagerConfig>('ViewManagerModel.createAsync', {
        type: c.type,
        instance: c.instance || undefined,
        typeDisplayName: c.typeDisplayName || undefined,
        defaultDisplayName: c.defaultDisplayName === 'default' ? undefined : c.defaultDisplayName,
        globalDisplayName: c.globalDisplayName === 'global' ? undefined : c.globalDisplayName,
        initialViewSpec,
        enableDefault: c.enableDefault ? undefined : false,
        enableAutoSave: c.enableAutoSave ? undefined : false,
        enableSharing: c.enableSharing ? undefined : false,
        enableGlobal: c.enableGlobal ? undefined : false,
        manageGlobal: c.manageGlobal ? undefined : false,
        preserveUnsavedChanges: c.preserveUnsavedChanges ? undefined : false
    });
    return `const viewManagerModel = await ${call};`;
}

const variantsSection = hoistCmp.factory<ViewManagerPanelModel>({
    render({model}) {
        const {viewManagerModel} = model;
        return demoSection({
            title: 'Variants',
            note: 'Each sets its own props, on the same model.',
            item: demoGrid({
                columns: 3,
                items: [
                    demoRow({
                        label: 'Styled menu button',
                        info: "menuButtonProps: {intent: 'primary', outlined: true}",
                        item: viewManager({
                            model: viewManagerModel,
                            menuButtonProps: {intent: 'primary', outlined: true}
                        })
                    }),
                    demoRow({
                        label: 'Custom view icons',
                        info: 'defaultViewIcon: Icon.home(), ownedViewIcon: Icon.star()',
                        item: viewManager({
                            model: viewManagerModel,
                            defaultViewIcon: Icon.home(),
                            ownedViewIcon: Icon.star()
                        })
                    }),
                    demoRow({
                        label: 'Extra menu items',
                        info: 'extraMenuItems - added to the end of the menu.',
                        item: viewManager({
                            model: viewManagerModel,
                            extraMenuItems: [
                                {
                                    text: 'Show current view',
                                    icon: Icon.info(),
                                    actionFn: () => {
                                        const {view, isValueDirty} = viewManagerModel;
                                        XH.toast({
                                            message: `${view.name}${isValueDirty ? ' (unsaved changes)' : ''}`,
                                            icon: Icon.bookmark()
                                        });
                                    }
                                }
                            ]
                        })
                    })
                ]
            })
        });
    }
});

const toolbarSection = hoistCmp.factory<ViewManagerPanelModel>({
    render({model}) {
        return demoSection({
            title: 'In a Toolbar',
            note: 'Alongside the controls it usually sits with.',
            items: [
                demoToolbar({items: toolbarItems(model)}),
                demoToolbar({compact: true, items: toolbarItems(model)})
            ]
        });
    }
});

function toolbarItems(model: ViewManagerPanelModel): ReactNode[] {
    return [
        viewManager({model: model.viewManagerModel}),
        toolbarSep(),
        button({icon: Icon.refresh(), text: 'Refresh'}),
        filler(),
        button({icon: Icon.download(), text: 'Export', outlined: true})
    ];
}
