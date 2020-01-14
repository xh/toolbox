import React, {useRef} from 'react';

import {box, div, p, table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dialog} from '@xh/hoist/desktop/cmp/dialog';
import {Icon} from '@xh/hoist/icon';

import {wrapper} from '../../../common';
import {formPanel} from './form/FormPanel';
import {oHLCChartPanel} from './chart/OHLCChartPanel';
import {simpleTreeMapPanel} from './chart/SimpleTreeMapPanel';

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
                            'Forms:',
                            button({
                                ...dialogBtn(Icon.lock()),
                                text: 'Plain Dialog',
                                onClick: () => XH.appModel.dialogNotDraggableModel.show()
                            }),
                            button({
                                ...dialogBtn(Icon.arrowsLeftRight()),
                                text: 'Draggable Dialog',
                                onClick: () => XH.appModel.dialogDraggableModel.show()
                            })
                        ),
                        row(
                            'Charts:',
                            button({
                                ...dialogBtn(Icon.arrowsLeftRight()),
                                text: 'Draggable & Resizable Dialog with OHLC Chart',
                                onClick: () => XH.appModel.dialogWithOHLCChartModel.show()
                            }),
                            button({
                                ...dialogBtn(Icon.arrowsLeftRight()),
                                text: 'Draggable & Resizable Dialog with OHLC Chart',
                                onClick: () => XH.appModel.dialogWithTreeMapModel.show()
                            })
                        )
                    )),
                    dialog({
                        icon: Icon.box(),
                        title: 'Dialogs: NOT Draggable & NOT Resizable',
                        // model found from context
                        item: formPanel()
                    }),
                    dialog({
                        icon: Icon.box(),
                        title: 'Dialogs: Draggable Only',
                        model: XH.appModel.dialogDraggableModel,
                        item: formPanel({onCloseClick: () => XH.appModel.dialogDraggableModel.hide()})
                    }),
                    dialog({
                        icon: Icon.box(),
                        title: 'Dialogs: Draggable & Resizable OHLC',
                        model: XH.appModel.dialogWithOHLCChartModel,
                        item: oHLCChartPanel(),
                        width: 600,
                        height: 400
                    }),
                    dialog({
                        icon: Icon.box(),
                        title: 'Dialogs: Draggable & Resizable TreeMap',
                        model: XH.appModel.dialogWithTreeMapModel,
                        item: simpleTreeMapPanel(),
                        width: 600,
                        height: 400
                    })
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