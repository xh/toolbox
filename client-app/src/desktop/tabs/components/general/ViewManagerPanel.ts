import {creates, hoistCmp} from '@xh/hoist/core';
import {dashCanvas} from '@xh/hoist/desktop/cmp/dash';
import {select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {demoFrame, demoPanel, demoPlayground, demoSection} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {ViewManagerPanelModel} from './ViewManagerPanelModel';

export const viewManagerPanel = hoistCmp.factory({
    model: creates(ViewManagerPanelModel),

    render({model}) {
        const {
            viewManagerModel,
            dashCanvasModel,
            rebuildTask,
            buttonTextMode,
            showSaveButton,
            showRevertButton,
            buttonSide
        } = model;
        return wrapper({
            title: 'ViewManager',
            icon: Icon.bookmark(),
            description: [
                '`ViewManager` lets users save, share and switch between named views of a',
                'component or page. Its `ViewManagerModel` acts as a persistence provider -',
                'here the dashboard below persists its layout and widget state through it.',
                '',
                'Rearrange or resize the widgets, change an option or a grid column, then use',
                'the menu to save the result as a new layout. Group layouts into folders by',
                'giving them a slash-delimited group, e.g. `Reports/Monthly`.'
            ],
            options: [
                wrapperOptionGroup({
                    label: 'ViewManager',
                    children: [
                        wrapperOption({
                            label: 'Button Text',
                            propName: 'ViewManagerProps.buttonTextMode',
                            control: select({
                                model,
                                bind: 'buttonTextMode',
                                width: 130,
                                enableFilter: false,
                                options: [
                                    {label: 'Name', value: 'name'},
                                    {label: 'Full Path', value: 'fullPath'},
                                    {label: 'Type', value: 'type'},
                                    {label: 'Icon Only', value: 'none'}
                                ]
                            }),
                            info: 'Text for the menu button. Icon Only passes null.'
                        }),
                        wrapperOption({
                            label: 'Save Button',
                            propName: 'ViewManagerProps.showSaveButton',
                            control: stateButtonSelect(model, 'showSaveButton')
                        }),
                        wrapperOption({
                            label: 'Revert Button',
                            propName: 'ViewManagerProps.showRevertButton',
                            control: stateButtonSelect(model, 'showRevertButton')
                        }),
                        wrapperOption({
                            label: 'Button Side',
                            propName: 'ViewManagerProps.buttonSide',
                            control: select({
                                model,
                                bind: 'buttonSide',
                                width: 130,
                                enableFilter: false,
                                options: [
                                    {label: 'Left', value: 'left'},
                                    {label: 'Right', value: 'right'}
                                ]
                            })
                        })
                    ]
                }),
                wrapperOptionGroup({
                    label: 'ViewManagerModel',
                    info: 'Set when the model is created - a change rebuilds it.',
                    children: [
                        wrapperOption({
                            label: 'Type Name',
                            propName: 'ViewManagerConfig.typeDisplayName',
                            control: textInput({model, bind: 'typeDisplayName', width: 130})
                        }),
                        wrapperOption({
                            label: 'Global Name',
                            propName: 'ViewManagerConfig.globalDisplayName',
                            control: textInput({model, bind: 'globalDisplayName', width: 130})
                        }),
                        wrapperOption({
                            label: 'Enable Default',
                            propName: 'ViewManagerConfig.enableDefault',
                            control: switchInput({model, bind: 'enableDefault'}),
                            info: 'Offer the in-code default layout in the menu.'
                        }),
                        wrapperOption({
                            label: 'Enable Auto Save',
                            propName: 'ViewManagerConfig.enableAutoSave',
                            control: switchInput({model, bind: 'enableAutoSave'}),
                            info: 'Let users opt in to saving changes as they go.'
                        })
                    ]
                })
            ],
            children: demoPanel({
                children: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        note: 'Driven by the options rail.',
                        children: demoPlayground({
                            showValue: false,
                            caption: 'The menu saves and loads layouts of the dashboard below.',
                            config: model.configText,
                            children: viewManager({
                                omit: !viewManagerModel,
                                key: viewManagerModel?.xhId,
                                model: viewManagerModel,
                                buttonTextMode: buttonTextMode === 'none' ? null : buttonTextMode,
                                showSaveButton,
                                showRevertButton,
                                buttonSide
                            })
                        })
                    }),
                    demoSection({
                        title: 'Dashboard',
                        note: 'Persists its layout and widget state through the ViewManagerModel.',
                        children: demoFrame({
                            children: panel({
                                height: 520,
                                mask: rebuildTask,
                                children: dashCanvas({
                                    omit: !dashCanvasModel,
                                    key: dashCanvasModel?.xhId,
                                    model: dashCanvasModel
                                })
                            })
                        })
                    })
                ]
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/ViewManagerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/viewmanager/README.md',
                    text: 'ViewManager docs',
                    notes: 'Saved views, sharing and persistence.'
                },
                {
                    url: '$HR/desktop/cmp/viewmanager/ViewManager.ts',
                    notes: 'Hoist component - the menu button and its save/revert buttons.'
                },
                {
                    url: '$HR/cmp/viewmanager/ViewManagerModel.ts',
                    notes: 'Hoist model - primary API and persistence provider.'
                }
            ]
        });
    }
});

function stateButtonSelect(model: ViewManagerPanelModel, bind: string) {
    return select({
        model,
        bind,
        width: 130,
        enableFilter: false,
        options: [
            {label: 'When Dirty', value: 'whenDirty'},
            {label: 'Always', value: 'always'},
            {label: 'Never', value: 'never'}
        ]
    });
}
