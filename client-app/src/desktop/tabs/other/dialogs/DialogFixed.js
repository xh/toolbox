// import {FocusStyleManager} from '@blueprintjs/core';
import {HoistModel, hoistCmp} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';


import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';

import {dialog} from '@xh/hoist/desktop/cmp/dialog';


export const dialogFixed = hoistCmp.factory({

    render({model}) {

        const onCloseClick = () => {
            model.setIsOpen(false);
        };

        return dialog({
            isOpen: model.isOpen,
            close: onCloseClick,
            canEscapeKeyClose: true,
            item: panel({
                title: 'Fixed Dialog',
                icon: Icon.lock(),
                width: 600,
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
export class DialogFixedModel {
    @bindable isOpen = false;
}