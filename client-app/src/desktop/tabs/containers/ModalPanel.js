import { Component } from 'react';

import { XH, HoistComponent } from '@xh/hoist/core/index';
import { filler, frame} from '@xh/hoist/cmp/layout';
import { panel } from '@xh/hoist/desktop/cmp/panel';
import { dialog } from '@xh/hoist/desktop/cmp/dialog';
import { switchInput } from '@xh/hoist/desktop/cmp/input';
import { toolbar } from '@xh/hoist/desktop/cmp/toolbar';
import { button } from '@xh/hoist/desktop/cmp/button';
import { Icon } from '@xh/hoist/icon';

import { wrapper } from '../../common/Wrapper';
import { ModalPanelModel } from './ModalPanelModel';

@HoistComponent
export class ModalPanel extends Component {
    model = new ModalPanelModel();

    render() {
        const {model} = this,
            {dialogModel} = model;

        return wrapper({
            description: `
                Modals....
            `,
            item: panel({
                title: 'Containers > Modal',
                height: 400,
                width: 700,
                tbar: toolbar(
                    button({
                        icon: Icon.comment(),
                        text: 'Dialog',
                        intent: 'success',
                        onClick: () => dialogModel.open()
                    })
                ),
                bbar: toolbar({
                    items: [
                        switchInput({
                            model: model,
                            bind: 'isAnimated',
                            label: 'Animate:',
                            labelAlign: 'left'
                        })
                    ]
                }),
                items: [
                    frame({
                        padding: 10,
                        item: 'Modal demos...'
                    }),
                    dialogModel.isOpen ? dialog({
                        title: 'Demo Dialog',
                        icon: Icon.handshake(),
                        model: dialogModel,
                        buttonBar: [
                            filler(),
                            button({
                                text: 'Cancel',
                                intent: 'primary',
                                onClick: () => this.onCancelClick()
                            }),
                            button({
                                text: 'Save',
                                intent: 'success',
                                onClick: () => this.onSaveClick()
                            })
                        ],
                        item: 'Hello World'
                    }) : null
                ]
            })
        });
    }

    onCloseClick() {
        this.model.dialogModel.close();
    }

    onCancelClick() {
        XH.toast({message: 'Dialog canceled.'}),
        this.model.dialogModel.close();
    }

    onSaveClick() {
        XH.toast({message: 'Dialog saved.'}),
        this.model.dialogModel.close();
    }
}