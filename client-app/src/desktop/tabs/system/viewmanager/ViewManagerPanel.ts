import {box, filler, fragment, hframe, placeholder} from '@xh/hoist/cmp/layout';
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

/**
 * ViewManager demo - also a harness for agents and tests that exercise ViewManager.
 *
 * - `window.testViewManagerModel` holds the live model. It is null while a rebuild is in progress.
 * - Read state from the model rather than the DOM where you can. The JSON panes use CodeMirror,
 *   which renders only the visible lines.
 * - testIds: `vm-playground`, `vm-rebuild`, `vm-rebuild-components`, `vm-card-{path}` with its
 *   `-default`, `-dirty` and `-focus` children, and `vm-view-summary-{key}` and `vm-view-dirty` in
 *   the View State panel. ViewManager menus and dialogs render in portals, outside `vm-playground`.
 * - Timing: wait about 300ms after a change before reading badges - providers debounce their
 *   writes by 250ms. Wait more than 1s after a view loads before changing a dashboard, which
 *   ignores changes during its settle time.
 * - Auto-save is a per-user setting, stored on the server. Check `autoSave` first - when it is on,
 *   badges return to Clean about 2s after an edit.
 */
export const viewManagerPanel = hoistCmp.factory({
    displayName: 'ViewManagerPanel',
    model: creates(ViewManagerPanelModel),

    render({model}) {
        return wrapper({
            title: 'ViewManager',
            icon: Icon.bookmark(),
            description: [
                'A **view** is a named bundle of component state. Bind a model to a',
                '`ViewManagerModel` with `persistWith: {viewManagerModel}`, and each view saves its',
                'state.',
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
                },
                {
                    url: '$TB/client-app/src/examples/portfolio/viewManagers.ts',
                    notes: 'How an app creates its models at startup, in the Portfolio example.'
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
                                          note: "Badges show each component's state in the current view.",
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
        const {isConfigPending, isConfigValid, isHarnessPending, isRebuilding} = model;
        return fragment(
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
                label: 'All instances - model config',
                info: 'Takes effect when you rebuild.',
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
                        info: "Off blocks global view management. On defers to the server's roles.",
                        control: switchInput({bind: 'manageGlobal'})
                    }),
                    wrapperOption({
                        label: 'Keep unsaved',
                        propName: 'ViewManagerConfig.preserveUnsavedChanges',
                        info: 'Keeps pending changes in session storage. Rebuilds and reloads restore them - use Revert to clear them.',
                        control: switchInput({bind: 'preserveUnsavedChanges'})
                    })
                ]
            }),
            wrapperAction({
                testId: 'vm-rebuild',
                icon: isConfigPending ? Icon.warning() : Icon.refresh(),
                text: isConfigPending ? 'Rebuild to apply changes' : 'Rebuild ViewManagerModel',
                intent: 'primary',
                disabled: !isConfigValid || isRebuilding,
                title: 'Destroy and recreate the ViewManagerModel and every model bound to it.',
                onClick: () => model.rebuildAsync()
            }),
            wrapperOptionGroup({
                label: 'Test harness',
                info: 'For agents and tests exercising ViewManager.',
                items: [
                    wrapperOption({
                        label: 'Shorthand dash state',
                        propName: 'DashContainerConfig.initialState',
                        info: 'Gives the DashContainer shorthand initial state, which can load the Default view dirty. Takes effect on either rebuild.',
                        control: switchInput({bind: 'shorthandDashState'})
                    })
                ]
            }),
            wrapperAction({
                testId: 'vm-rebuild-components',
                icon: isHarnessPending ? Icon.warning() : Icon.refresh(),
                text: isHarnessPending ? 'Rebuild components to apply' : 'Rebuild components',
                disabled: !model.viewManagerModel || isRebuilding,
                title: 'Destroy and recreate the bound models only, against the same ViewManagerModel.',
                onClick: () => model.rebuildPersistedModels()
            })
        );
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
                instanceWidth: 200,
                // The current view's state shows at the top of the View State panel instead.
                showValue: false,
                caption: 'Open the menu to save, manage, and switch views.',
                config: [
                    model.configSnippet,
                    fmtDemoConfig<ViewManagerProps>('viewManager', {
                        model: raw('viewManagerModel'),
                        showSaveButton: showSaveButton === 'whenDirty' ? undefined : showSaveButton,
                        showRevertButton:
                            showRevertButton === 'never' ? undefined : showRevertButton,
                        buttonSide: buttonSide === 'right' ? undefined : buttonSide
                    })
                ].join('\n\n'),
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
