import {useRef} from 'react';

import {table, tbody, td, th, tr, filler, /* p,*/ fragment} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dialog} from '@xh/hoist/desktop/cmp/dialog';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {switchInput} from '@xh/hoist/desktop/cmp/input';

import {Icon} from '@xh/hoist/icon';

// import {oHLCChartPanel} from './chart/OHLCChartPanel';
// import {simpleTreeMapPanel} from './chart/SimpleTreeMapPanel';
import {DialogsPanelModel} from './DialogsPanelModel';

import './DialogsPanel.scss';

// todo: 
// get rid of scroll bars on maximized state of dialog
// write close tests:  close on escape
export const dialogsPanel = hoistCmp.factory({
    model: creates(DialogsPanelModel),
    render: ({model}) => {
        // const {withMask, closeOnOutsideClick, closeOnEscape, showCloseButton} = model;
        const divRef = useRef(null);
        
        return panel({
            title: 'Dialog Tests',
            className: 'test-dialogs',
            ref: divRef,
            bbar: [
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
                    bind: 'withMask',
                    label: 'with mask',
                    alignIndicator: 'right'
                })
            ],
            items: [
                table(tbody(
                    row(
                        'Header Tests:',
                        fragment(
                            button({
                                ...dialogBtn(Icon.learn()),
                                text: 'Defaults',
                                onClick: () => model.dialogModel1.open()
                            }),
                            dialog({model: model.dialogModel1})
                        )
                        /*
                        fragment(
                            button({
                                ...dialogBtn(Icon.stopCircle()),
                                text: 'No Icon, No Title',
                                onClick: () => model.setIsOpen2(true)    
                            }),
                            dialog({
                                isOpen: model.isOpen2,
                                onClose: () => model.setIsOpen2(false),
                                showCloseButton: true,
                                mask: withMask,
                                closeOnEscape,
                                closeOnOutsideClick,
                                item: formPanel({onCloseClick: () => model.setIsOpen2(false)})
                            })
                        ),
                        fragment(
                            button({
                                ...dialogBtn(Icon.stopCircle()),
                                text: 'No Close Button',
                                onClick: () => model.setIsOpen3(true)    
                            }),
                            dialog({
                                isOpen: model.isOpen3,
                                onClose: () => model.setIsOpen3(false),
                                icon: Icon.box(),
                                title: 'Dialogs: NO Close Button in Header',
                                mask: withMask,
                                closeOnEscape,
                                closeOnOutsideClick,
                                item: formPanel({onCloseClick: () => model.setIsOpen3(false)})
                            })
                        )
                    ),
                    row(
                        'Draggable',
                        fragment(
                            button({
                                ...dialogBtn(Icon.arrowsLeftRight()),
                                text: 'Draggable Dialog',
                                onClick: () => model.setIsOpen4(true)    
                            }),
                            dialog({
                                isOpen: model.isOpen4,
                                icon: Icon.box(),
                                title: 'Draggable Only',
                                showCloseButton,
                                onClose: () => model.setIsOpen4(false),
                                mask: withMask,
                                closeOnEscape,
                                closeOnOutsideClick,
                                model: new DialogModel({draggable: true}),
                                item: formPanel({onCloseClick: () => model.setIsOpen4(false)})
                            })
                        )
                    ),
                    row(
                        'Resizable:',
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'Resizable Dialog with OHLC Chart',
                                onClick: () => model.setIsOpen5(true)    
                            }),
                            dialog({
                                isOpen: model.isOpen5,
                                icon: Icon.chartLine(),
                                title: 'Resizable Dialog with OHLC Chart',
                                onClose: () => model.setIsOpen5(false),
                                mask: withMask,
                                closeOnEscape,
                                closeOnOutsideClick,
                                showCloseButton,
                                model: new DialogModel({resizable: true}),
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
                                text: 'Resizable Dialog with TreeMap Chart',
                                onClick: () => model.setIsOpen6(true)    
                            }),
                            dialog({
                                isOpen: model.isOpen6,
                                icon: Icon.chartLine(),
                                title: 'Resizable Dialog with TreeMap Chart',
                                onClose: () => model.setIsOpen6(false),
                                mask: withMask,
                                closeOnEscape,
                                closeOnOutsideClick,
                                showCloseButton,
                                model: new DialogModel({resizable: true}),
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
                                onClick: () => model.setIsOpen7(true)   
                            }),
                            dialog({
                                isOpen: model.isOpen7,
                                icon: Icon.box(),
                                title: 'Stateful Draggable & Resizable OHLC',
                                onClose: () => model.setIsOpen7(false),
                                mask: withMask,
                                closeOnEscape,
                                closeOnOutsideClick,
                                showCloseButton,
                                model: new DialogModel({
                                    resizable: true, 
                                    draggable: true,
                                    stateModel: 'stateFulDialogOHLC'
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
                                onClick: () => model.setIsOpen8(true)   
                            }),
                            dialog({
                                isOpen: model.isOpen8,
                                icon: Icon.box(),
                                title: 'Stateful Draggable Only',
                                onClose: () => model.setIsOpen8(false),
                                mask: withMask,
                                closeOnEscape,
                                closeOnOutsideClick,
                                showCloseButton,
                                model: new DialogModel({
                                    draggable: true,
                                    stateModel: 'stateFulDialogForm'
                                }),
                                item: formPanel({onCloseClick: () => model.setIsOpen8(false)})
                            })
                        )
                    ),
                    row(
                        'Parent/Child Dialogs:',
                        fragment(
                            button({
                                ...dialogBtn(),
                                text: 'Dialog That Opens a Child Dialog',
                                onClick: () => model.setIsOpen9(true)   
                            }),
                            dialog({
                                isOpen: model.isOpen9,
                                icon: Icon.box(),
                                title: 'Parent Dialog',
                                onClose: () => model.setIsOpen9(false),
                                mask: withMask,
                                closeOnEscape,
                                closeOnOutsideClick,
                                showCloseButton,
                                model: new DialogModel({
                                    draggable: true,
                                    stateModel: 'parentDialog'
                                }),
                                item: panel({
                                    style: {padding: '10px'},
                                    width: 300,
                                    items: [
                                        p(`The "child" dialog must be defined outside of this dialog if the two 
                                  dialogs are to be dragged independently.`),
                                        button({
                                            ...dialogBtn(),
                                            text: 'Open a Child Dialog',
                                            onClick: () => model.setIsOpen10(true)   
                                        })
                                    ]
                                })
                            }),
                            dialog({
                                isOpen: model.isOpen10,
                                onClose: () => model.setIsOpen10(false),
                                icon: Icon.box(),
                                title: 'A Child Dialog',
                                closeOnEscape,
                                closeOnOutsideClick,
                                showCloseButton,
                                mask: withMask,
                                model: new DialogModel({
                                    resizable: true,
                                    draggable: true,
                                    stateModel: 'childDialogOHLC'
                                }),
                                item: oHLCChartPanel(),
                                width: 600,
                                height: 400
                            })
                        )
                    ),
                    row(
                        'zIndex:',
                        fragment(
                            button({
                                ...dialogBtn(Icon.arrowUp()),
                                text: 'style.zIndex = 100 (stateful)',
                                onClick: () => model.setIsOpen11(true)   
                            }),
                            dialog({
                                isOpen: model.isOpen11,
                                onClose: () => model.setIsOpen11(false),
                                icon: Icon.box(),
                                title: 'Dialog with style.zIndex 100',
                                closeOnEscape,
                                closeOnOutsideClick,
                                showCloseButton,
                                mask: withMask,
                                model: new DialogModel({
                                    resizable: true,
                                    draggable: true,
                                    stateModel: 'customZIndexDialog'
                                }),
                                item: oHLCChartPanel(),
                                width: 600,
                                height: 400,
                                style: {
                                    zIndex: 100
                                }
                            })
                        ),
                        fragment(
                            button({
                                ...dialogBtn(Icon.arrowUp()),
                                text: 'rndOptions.style.zIndex = 100 (not stateful) - note issue with datepicker',
                                onClick: () => model.setIsOpen12(true)    
                            }),
                            dialog({
                                isOpen: model.isOpen12,
                                icon: Icon.box(),
                                title: 'Dialog with rndOptions.style.zIndex 100',
                                showCloseButton,
                                onClose: () => model.setIsOpen12(false),
                                mask: withMask,
                                closeOnEscape,
                                closeOnOutsideClick,
                                rndOptions: {
                                    style: {
                                        zIndex: 100
                                    }
                                },
                                model: new DialogModel({draggable: true}),
                                item: formPanel({onCloseClick: () => model.setIsOpen12(false)})
                            })
                        )
                    ),
                    row(
                        '"style" prop:',
                        fragment(
                            button({
                                ...dialogBtn(),
                                text: 'custom style prop setting (should show with green shadow)',
                                onClick: () => model.setIsOpen13(true)    
                            }),
                            dialog({
                                isOpen: model.isOpen13,
                                icon: Icon.box(),
                                title: 'Dialog with custom green shadow',
                                showCloseButton,
                                onClose: () => model.setIsOpen13(false),
                                mask: withMask,
                                closeOnEscape,
                                closeOnOutsideClick,
                                item: oHLCChartPanel(),
                                width: 600,
                                height: 400,
                                style: {
                                    boxShadow: '0px 0px 10px 5px green'
                                }
                            })
                        )
                    */
                    )
                ))
            ]
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

function row(col1, col2, col3, col4) {
    return tr(th(col1), td(col2), td(col3), td(col4));
}