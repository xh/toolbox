import {box, div, p, table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';

import {Icon} from '@xh/hoist/icon';
import React, {useRef} from 'react';

import {wrapper} from '../../../common';
import {dialogFixed} from './DialogFixed';
import {dialogDraggable} from './DialogDraggable';

import './DialogsPanel.scss';

export const DialogsPanel = hoistCmp(
    () => {
        const divRef = useRef(null);
        
        return wrapper({
            description: (
                <div>
                    <p>Dialogs are the base component for our popups and also support more complex forms.</p>
                    <p>
                        Dialogs can be fixed modals or draggable.
                    </p>
                </div>
            ),
            item: box({
                className: 'tbox-dialogs',
                ref: divRef,
                items: [
                    table(tbody(
                        row(
                            button({
                                ...dialogBtn(Icon.lock()),
                                text: 'Fixed Modal',
                                onClick: () => openDialogFixed()
                            }),
                            button({
                                ...dialogBtn(Icon.arrowsLeftRight()),
                                text: 'Draggable',
                                onClick: () => openDialogDraggable()
                            })
                        )
                    )),
                    dialogFixed({model: XH.appModel.dialogFixedModel}),
                    dialogDraggable({model: XH.appModel.dialogDraggableModel})
                ]
            })
        });
    }
);


function dialogBtn(icon) {
    return ({
        className: 'tbox-dialogs__button',
        icon: icon,
        minimal: false
    });
}

function row(col1, col2, col3) {
    return tr(th(col1), td(col2), td(col3));
}

function openDialogFixed() {
    XH.appModel.dialogFixedModel.setIsOpen(true);
}

function openDialogDraggable() {
    XH.appModel.dialogDraggableModel.setIsOpen(true);
}
