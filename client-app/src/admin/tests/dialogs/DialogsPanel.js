import {useRef} from 'react';

import {table, tbody, td, th, tr, filler, p, fragment} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dialog} from '@xh/hoist/desktop/cmp/dialog';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {switchInput} from '@xh/hoist/desktop/cmp/input';

import {Icon} from '@xh/hoist/icon';

import {formPanel} from './form/FormPanel';
import {oHLCChartPanel} from './chart/OHLCChartPanel';
import {simpleTreeMapPanel} from './chart/SimpleTreeMapPanel';
import {DialogsPanelModel} from './DialogsPanelModel';

import './DialogsPanel.scss';
import {DialogModel} from '../../../../../../hoist-react/desktop/cmp/dialog/DialogModel';

export const dialogsPanel = hoistCmp.factory({
    model: creates(DialogsPanelModel),
    render: ({model}) => {
        const {withMask, closeOnOutsideClick} = model;
        const divRef = useRef(null);
        
        return panel({
            title: 'Dialog Tests',
            className: 'test-dialogs',
            ref: divRef,
            bbar: [
                filler(),
                switchInput({
                    bind: 'closeOnOutsideClick',
                    label: 'close on outside click',
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
                                onClick: () => model.setIsOpen1(true)
                            }),
                            dialog({
                                isOpen: model.isOpen1,
                                onClose: () => model.setIsOpen1(false),
                                mask: withMask,
                                closeOnOutsideClick,
                                item: formPanel({onCloseClick: () => model.setIsOpen1(false)})
                            })
                        ),
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
                                onClose: () => model.setIsOpen4(false),
                                mask: withMask,
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
                                closeOnOutsideClick,
                                showCloseButton: true,
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
                                closeOnOutsideClick,
                                showCloseButton: true,
                                model: new DialogModel({resizable: true}),
                                item: simpleTreeMapPanel(),
                                width: 600,
                                height: 400
                            })
                        )
                    ),
                    row(
                        'Stateful:',
                        button({
                            ...dialogBtn(Icon.arrowsLeftRight()),
                            text: 'Stateful Draggable & Resizable with OHLC Chart',
                            onClick: () => model.statefulDalogWithOHLCChartModel.show()
                        }),
                        button({
                            ...dialogBtn(Icon.arrowsLeftRight()),
                            text: 'Stateful Draggable only',
                            onClick: () => model.statefulDalogWithFormModel.show()
                        })
                    ),
                    row(
                        'Parent/Child Dialogs:',
                        button({
                            ...dialogBtn(Icon.arrowsLeftRight()),
                            text: 'Dialog That Opens a Child Dialog',
                            onClick: () => model.parentDialogModel.show()
                        })
                    ),
                    row(
                        'zIndex:',
                        button({
                            ...dialogBtn(Icon.arrowsLeftRight()),
                            text: 'style.zIndex = 100 (stateful)',
                            onClick: () => model.customZIndexDialogModel.show()
                        }),
                        button({
                            ...dialogBtn(Icon.arrowsLeftRight()),
                            text: 'RnDOptions.style.zIndex = 100 (not stateful)',
                            onClick: () => model.customZIndexRndoDialogModel.show()
                        })
                    ),
                    row(
                        '"style" prop:',
                        button({
                            ...dialogBtn(Icon.arrowsLeftRight()),
                            text: 'Dialog with custom style prop setting',
                            onClick: () => model.customStylePropDialogModel.show()
                        })
                    )
                )),


                dialog({
                    icon: Icon.box(),
                    title: 'Dialogs: Stateful Draggable & Resizable OHLC',
                    mask: withMask,
                    closeOnOutsideClick,
                    model: model.statefulDalogWithOHLCChartModel,
                    item: oHLCChartPanel(),
                    width: 600,
                    height: 400
                }),
                dialog({
                    icon: Icon.box(),
                    title: 'Dialogs: Stateful Draggable Only',
                    mask: withMask,
                    closeOnOutsideClick,
                    model: model.statefulDalogWithFormModel,
                    item: formPanel({onCloseClick: () => model.statefulDalogWithFormModel.hide()})
                }),
                dialog({
                    icon: Icon.box(),
                    title: 'Parent Dialog',
                    mask: withMask,
                    closeOnOutsideClick,
                    model: model.parentDialogModel,
                    item: panel({
                        style: {padding: '10px'},
                        width: 300,
                        items: [
                            p(`The "child" dialog must be defined outside of this dialog if the two 
                          dialogs are to be dragged independently.`),
                            button({
                                ...dialogBtn(Icon.arrowsLeftRight()),
                                text: 'Open a Child Dialog',
                                onClick: () => model.childDalogWithOHLCChartModel.show()
                            })
                        ]
                    })
                }),
                dialog({
                    icon: Icon.box(),
                    title: 'A Child Dialog',
                    mask: withMask,
                    closeOnOutsideClick,
                    model: model.childDalogWithOHLCChartModel,
                    item: oHLCChartPanel(),
                    width: 600,
                    height: 400
                }),
                dialog({
                    icon: Icon.box(),
                    title: 'Dialog with style.zIndex 100',
                    mask: withMask,
                    closeOnOutsideClick,
                    model: model.customZIndexDialogModel,
                    item: oHLCChartPanel(),
                    width: 600,
                    height: 400,
                    style: {
                        zIndex: 100
                    }
                }),
                dialog({
                    icon: Icon.box(),
                    title: 'Dialog with RnDOptions.style.zIndex 100',
                    mask: withMask,
                    closeOnOutsideClick,
                    model: model.customZIndexRndoDialogModel,
                    item: oHLCChartPanel(),
                    width: 600,
                    height: 400,
                    RnDOptions: {
                        style: {
                            zIndex: 100
                        }
                    }
                }),
                dialog({
                    icon: Icon.box(),
                    title: 'Dialog with custom style prop',
                    mask: withMask,
                    closeOnOutsideClick,
                    model: model.customStylePropDialogModel,
                    item: oHLCChartPanel(),
                    width: 600,
                    height: 400,
                    style: {
                        boxShadow: '0px 0px 10px 5px green'
                    }
                })
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