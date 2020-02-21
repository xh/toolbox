import React, {useRef} from 'react';

import {table, tbody, td, th, tr, filler, fragment} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dialog, DialogModel} from '@xh/hoist/desktop/cmp/dialog';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {switchInput} from '@xh/hoist/desktop/cmp/input';

import {Icon} from '@xh/hoist/icon';

import {wrapper} from '../../../common';
import {formPanel} from './form/FormPanel';
import {oHLCChartPanel} from './chart/OHLCChartPanel';
import {simpleTreeMapPanel} from './chart/SimpleTreeMapPanel';
import {DialogsPanelModel} from './DialogsPanelModel';

import './DialogsPanel.scss';

export const dialogsPanel = hoistCmp.factory({
    model: creates(DialogsPanelModel),
    render: ({model}) => {
        const {mask, closeOnOutsideClick, closeOnEscape, showCloseButton} = model;
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
            item: panel({
                className: 'tbox-dialogs',
                flex: 'none',
                ref: divRef,
                bbar: [
                    filler(),
                    filler(),
                    switchInput({
                        bind: 'showCloseButton',
                        label: 'show close button in dialog header',
                        alignIndicator: 'right'
                    }),
                    switchInput({
                        bind: 'closeOnOutsideClick',
                        label: 'close on outside click',
                        alignIndicator: 'right'
                    }),
                    switchInput({
                        bind: 'closeOnEscape',
                        label: 'close on escape key',
                        alignIndicator: 'right'
                    }),
                    switchInput({
                        bind: 'mask',
                        label: 'with mask',
                        alignIndicator: 'right'
                    })
                ],
                items: [
                    table(tbody(
                        row(
                            'Forms:',
                            fragment(
                                button({
                                    ...dialogBtn(),
                                    text: 'Plain Dialog',
                                    onClick: () => model.setIsOpen1(true)    
                                }),
                                dialog({
                                    isOpen: model.isOpen1,
                                    icon: Icon.box(),
                                    title: 'Plain Dialog with Form',
                                    showCloseButton,
                                    onClose: () => model.setIsOpen1(false),
                                    mask,
                                    closeOnEscape,
                                    closeOnOutsideClick,
                                    item: formPanel({onCloseClick: () => model.setIsOpen1(false)})
                                })
                            ),
                            fragment(
                                button({
                                    ...dialogBtn(),
                                    text: 'Draggable Dialog',
                                    onClick: () => model.setIsOpen2(true)    
                                }),
                                dialog({
                                    isOpen: model.isOpen2,
                                    icon: Icon.box(),
                                    title: 'Draggable Dialog with Form',
                                    showCloseButton,
                                    model: new DialogModel({draggable: true}),
                                    onClose: () => model.setIsOpen2(false),
                                    mask,
                                    closeOnEscape,
                                    closeOnOutsideClick,
                                    item: formPanel({onCloseClick: () => model.setIsOpen2(false)})
                                })
                            )
                        ),
                        row(
                            'Charts:',
                            fragment(
                                button({
                                    ...dialogBtn(Icon.chartLine()),
                                    text: 'Resizable & Draggable Dialog with OHLC Chart',
                                    onClick: () => model.setIsOpen3(true)    
                                }),
                                dialog({
                                    isOpen: model.isOpen3,
                                    icon: Icon.chartLine(),
                                    title: 'Resizable Dialog with OHLC Chart',
                                    onClose: () => model.setIsOpen3(false),
                                    mask,
                                    closeOnEscape,
                                    closeOnOutsideClick,
                                    showCloseButton,
                                    model: new DialogModel({resizable: true, draggable: true}),
                                    item: oHLCChartPanel(),
                                    width: 600,
                                    height: 400,
                                    x: 100,
                                    y: 100
                                })
                            ),
                            fragment(
                                button({
                                    ...dialogBtn(Icon.chartLine()),
                                    text: 'Resizable & Draggable Dialog with TreeMap Chart',
                                    onClick: () => model.setIsOpen4(true)    
                                }),
                                dialog({
                                    isOpen: model.isOpen4,
                                    icon: Icon.chartLine(),
                                    title: 'Resizable Dialog with TreeMap Chart',
                                    onClose: () => model.setIsOpen4(false),
                                    mask,
                                    closeOnEscape,
                                    closeOnOutsideClick,
                                    showCloseButton,
                                    model: new DialogModel({resizable: true, draggable: true}),
                                    item: simpleTreeMapPanel(),
                                    width: 600,
                                    height: 400
                                })
                            )
                        ),
                        row(
                            'Stateful:',
                            fragment(
                                button({
                                    ...dialogBtn(Icon.arrowsLeftRight()),
                                    text: 'Stateful Draggable & Resizable with OHLC Chart',
                                    onClick: () => model.setIsOpen5(true)   
                                }),
                                dialog({
                                    isOpen: model.isOpen5,
                                    icon: Icon.box(),
                                    title: 'Stateful Draggable & Resizable OHLC',
                                    onClose: () => model.setIsOpen5(false),
                                    mask,
                                    closeOnEscape,
                                    closeOnOutsideClick,
                                    showCloseButton,
                                    model: new DialogModel({
                                        resizable: true, 
                                        draggable: true,
                                        stateModel: 'stateFulDialogOHLCDemo'
                                    }),
                                    item: oHLCChartPanel(),
                                    width: 600,
                                    height: 400
                                })
                            ),
                            fragment(
                                button({
                                    ...dialogBtn(Icon.arrowsLeftRight()),
                                    text: 'Stateful Draggable Only',
                                    onClick: () => model.setIsOpen6(true)   
                                }),
                                dialog({
                                    isOpen: model.isOpen6,
                                    icon: Icon.box(),
                                    title: 'Stateful Draggable Only',
                                    onClose: () => model.setIsOpen6(false),
                                    mask,
                                    closeOnEscape,
                                    closeOnOutsideClick,
                                    showCloseButton,
                                    model: new DialogModel({
                                        draggable: true,
                                        stateModel: 'stateFulDialogFormDemo'
                                    }),
                                    item: formPanel({onCloseClick: () => model.setIsOpen6(false)})
                                })
                            )
                        )
                    ))
                ]
            })
        });
    }
});


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