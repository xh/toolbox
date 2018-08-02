/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../impl/Wrapper';
import {filler, frame, hframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {comboField, switchField} from '@xh/hoist/desktop/cmp/form';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {usStates} from '../../../data';
import {ToolbarPanelModel} from './ToolbarPanelModel';

@HoistComponent()
export class ToolbarPanel extends Component {
    toolBarModel = new ToolbarPanelModel();

    render() {
        const model = this.toolBarModel;

        return wrapper({
            description: `
                Toolbars (in case you have never seen one) are horizontal or vertical containers 
                with distinct styling and managed spacing between items. Support for top and bottom
                toolbars is built into Panel via its tbar/bbar props, but they can be used on their
                own and can be displayed in a vertical configuration as well. 
            `,
            item: panel({
                title: 'Components > Toolbars',
                height: 400,
                width: 600,
                tbar: toolbar(
                    button({
                        icon: Icon.add(),
                        text: 'New',
                        intent: 'success'
                    }),
                    toolbarSep(),
                    button({
                        icon: Icon.edit(),
                        text: 'Edit',
                        intent: 'primary'
                    }),
                    filler(),
                    'Danger mode',
                    switchField({
                        model,
                        field: 'enableTerminate'
                    }),
                    button({
                        icon: Icon.skull(),
                        text: 'Terminate',
                        intent: 'danger',
                        disabled: !model.enableTerminate
                    })
                ),
                items: [
                    hframe(
                        toolbar({
                            vertical: true,
                            width: 42,
                            items: [
                                filler(),
                                button({icon: Icon.contact()}),
                                button({icon: Icon.comment()}),
                                toolbarSep(),
                                button({icon: Icon.add()}),
                                button({icon: Icon.delete()}),
                                toolbarSep(),
                                button({icon: Icon.gears()}),
                                filler()
                            ]
                        }),
                        frame({
                            padding: 10,
                            item: 'Help, I am surrounded by toolbars!'
                        }),
                        toolbar({
                            vertical: true,
                            width: 42,
                            items: [
                                button({icon: Icon.contact()})
                            ]
                        })
                    )
                ],
                bbar: toolbar(
                    filler(),
                    comboField({
                        options: usStates,
                        model,
                        field: 'state',
                        placeholder: 'Select a State...'
                    }),
                    button({
                        text: 'Show Toast',
                        onClick: this.showToast
                    })
                )
            })
        });
    }

    toggleTermination = () => {

    }

    showToast = () => {
        XH.toast({
            message: `Currently selected State: ${this.toolBarModel.state || 'None'}`
        });
    }
}