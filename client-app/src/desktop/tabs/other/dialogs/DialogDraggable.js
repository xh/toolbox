// import {FocusStyleManager} from '@blueprintjs/core';
import {HoistModel, hoistCmp} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';


import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';

import {dialog} from '@xh/hoist/desktop/cmp/dialog';


export const dialogDraggable = hoistCmp.factory({

    render({model}) {

        const onCloseClick = () => {
                model.setIsOpen(false);
            },
            width = 600,
            height = 200;

        return dialog({
            isOpen: model.isOpen,
            close: onCloseClick,
            canEscapeKeyClose: true,
            isDraggable: true,
            width,
            height,
            item: panel({
                title: 'Fixed Dialog',
                icon: Icon.lock(),
                width,
                height,
                headerItems: [button({
                    icon: Icon.close(),
                    onClick: onCloseClick
                })],
                bbar: [
                    filler(),
                    button({
                        text: 'Ok',
                        onClick: onCloseClick
                    })
                ]
            })
        });
    }
});

@HoistModel
export class DialogDraggableModel {
    @bindable isOpen = false;
}