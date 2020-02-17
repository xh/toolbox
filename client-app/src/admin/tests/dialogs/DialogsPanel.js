import {useRef} from 'react';

import {table, tbody, td, th, tr, filler, p} from '@xh/hoist/cmp/layout';
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
                        button({
                            ...dialogBtn(Icon.learn()),
                            text: 'Default',
                            onClick: () => model.dialogDefaultHeaderModel.show()
                        }),
                        button({
                            ...dialogBtn(Icon.stopCircle()),
                            text: 'No Header',
                            onClick: () => model.dialogNoHeaderModel.show()
                        }),
                        button({
                            ...dialogBtn(Icon.stopCircle()),
                            text: 'No Close Button',
                            onClick: () => model.dialogNoCloseButtonModel.show()
                        })
                    ),
                    row(
                        'Forms:',
                        button({
                            ...dialogBtn(Icon.lock()),
                            text: 'Plain Dialog',
                            onClick: () => model.dialogModelThatWillBeFoundFromContextLookup.show()
                        }),
                        button({
                            ...dialogBtn(Icon.arrowsLeftRight()),
                            text: 'Draggable Dialog',
                            onClick: () => model.dialogDraggableModel.show()
                        })
                    ),
                    row(
                        'Charts:',
                        button({
                            ...dialogBtn(Icon.arrowsLeftRight()),
                            text: 'Draggable & Resizable with OHLC Chart',
                            onClick: () => model.dialogWithOHLCChartModel.show()
                        }),
                        button({
                            ...dialogBtn(Icon.arrowsLeftRight()),
                            text: 'Draggable & Resizable with Tree Map',
                            onClick: () => model.dialogWithTreeMapModel.show()
                        })
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
                    model: model.dialogDefaultHeaderModel,
                    mask: withMask,
                    closeOnOutsideClick,
                    item: formPanel({onCloseClick: () => model.dialogDefaultHeaderModel.hide()})
                }),
                dialog({
                    model: model.dialogNoHeaderModel,
                    showCloseButton: false,
                    mask: withMask,
                    closeOnOutsideClick,
                    item: formPanel({onCloseClick: () => model.dialogNoHeaderModel.hide()})
                }),
                dialog({
                    model: model.dialogNoCloseButtonModel,
                    icon: Icon.box(),
                    title: 'Dialogs: NO Close Button in Header',
                    showCloseButton: false,
                    mask: withMask,
                    closeOnOutsideClick,
                    item: formPanel({onCloseClick: () => model.dialogNoCloseButtonModel.hide()})
                }),
                dialog({
                    icon: Icon.box(),
                    title: 'Dialogs: NOT Draggable & NOT Resizable',
                    mask: withMask,
                    closeOnOutsideClick,
                    // model found from context
                    item: formPanel({onCloseClick: () => model.dialogModelThatWillBeFoundFromContextLookup.hide()})
                }),
                dialog({
                    icon: Icon.box(),
                    title: 'Dialogs: Draggable Only',
                    mask: withMask,
                    closeOnOutsideClick,
                    model: model.dialogDraggableModel,
                    item: formPanel({onCloseClick: () => model.dialogDraggableModel.hide()})
                }),
                dialog({
                    icon: Icon.box(),
                    title: 'Dialogs: Draggable & Resizable OHLC',
                    mask: withMask,
                    closeOnOutsideClick,
                    model: model.dialogWithOHLCChartModel,
                    item: oHLCChartPanel(),
                    width: 600,
                    height: 400,
                    x: 100,
                    y: 100
                }),
                dialog({
                    icon: Icon.box(),
                    title: 'Dialogs: Draggable & Resizable TreeMap',
                    mask: withMask,
                    closeOnOutsideClick,
                    model: model.dialogWithTreeMapModel,
                    item: simpleTreeMapPanel(),
                    width: 600,
                    height: 400
                }),
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