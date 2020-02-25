import {useRef} from 'react';

import {table, tbody, td, th, tr, filler, /* p,*/ fragment} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dialog} from '@xh/hoist/desktop/cmp/dialog';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';

import {DialogsPanelModel} from './DialogsPanelModel';

import './DialogsPanel.scss';

// todo: 
// get rid of scroll bars on maximized state of dialog
// write close tests:  close on escape
export const dialogsPanel = hoistCmp.factory({
    model: creates(DialogsPanelModel),
    render: ({model}) => {
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
                    bind: 'showBackgroundMask',
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
                        ),
                        fragment(
                            button({
                                ...dialogBtn(Icon.stopCircle()),
                                text: 'No Icon, No Title, No Close Button',
                                onClick: () => model.dialogModel2.open() 
                            }),
                            dialog({model: model.dialogModel2})
                        ),
                        fragment(
                            button({
                                ...dialogBtn(Icon.stopCircle()),
                                text: 'Icon, Title, and Close Button',
                                onClick: () => model.dialogModel3.open() 
                            }),
                            dialog({
                                model: model.dialogModel3,
                                icon: Icon.box(),
                                title: 'Icon, Title and Close Btn in Header'
                            })
                        )
                    ),
                    row(
                        'RnD:',
                        fragment(
                            button({
                                ...dialogBtn(Icon.arrowsLeftRight()),
                                text: 'Draggable Dialog',
                                onClick: () => model.dialogModel4.open() 
                            }),
                            dialog({
                                model: model.dialogModel4,
                                icon: Icon.arrowsLeftRight(),
                                title: 'Draggable Only'
                            })
                        ),
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'Resizable Dialog with OHLC Chart',
                                onClick: () => model.dialogModel5.open() 
                            }),
                            dialog({
                                model: model.dialogModel5,
                                icon: Icon.chartLine(),
                                title: 'Resizable Dialog with OHLC Chart'
                            })
                        ),
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'Resizable & Draggable Dialog with Tree Map',
                                onClick: () => model.dialogModel6.open() 
                            }),
                            dialog({
                                model: model.dialogModel6,
                                icon: Icon.chartLine(),
                                title: 'Resizable & Draggable Dialog with Tree Map'
                            })
                        )
                    ),
                    row(
                        'Stateful:',
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'Stateful Draggable Only',
                                onClick: () => model.dialogModel7.open() 
                            }),
                            dialog({
                                model: model.dialogModel7,
                                icon: Icon.chartLine(),
                                title: 'Stateful Draggable Only'
                            })
                        ),
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'Stateful Resizable Only',
                                onClick: () => model.dialogModel8.open() 
                            }),
                            dialog({
                                model: model.dialogModel8,
                                icon: Icon.chartLine(),
                                title: 'Stateful Resizable Only'
                            })
                        ),
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'Stateful Resizable & Draggable',
                                onClick: () => model.dialogModel9.open() 
                            }),
                            dialog({
                                model: model.dialogModel9,
                                icon: Icon.chartLine(),
                                title: 'Stateful Resizable & Draggable'
                            })
                        )
                    ),
                    row(
                        'Parent/Child Dialogs:',
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'Dialog That Opens a Child Dialog',
                                onClick: () => model.dialogModel10.open() 
                            }),
                            dialog({
                                model: model.dialogModel10,
                                icon: Icon.box(),
                                title: 'Parent Dialog'
                            }),
                            dialog({
                                model: model.dialogModel11,
                                icon: Icon.box(),
                                title: 'A Child Dialog'
                            })
                        )
                    ),
                    row(
                        'zIndex:',
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'style.zIndex = 100 (stateful)',
                                onClick: () => model.dialogModel12.open() 
                            }),
                            dialog({
                                model: model.dialogModel12,
                                icon: Icon.chartLine(),
                                title: 'Dialog with style.zIndex 100',
                                rndOptions: {
                                    style: {
                                        zIndex: 100
                                    }
                                }
                            })
                        )
                    ),
                    row(
                        '"style" prop:',
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'custom style prop setting (should show with green shadow)',
                                onClick: () => model.dialogModel13.open() 
                            }),
                            dialog({
                                model: model.dialogModel13,
                                icon: Icon.chartLine(),
                                title: 'Dialog with custom green shadow',
                                rndOptions: {
                                    style: {
                                        boxShadow: '0px 0px 10px 5px green'
                                    }
                                }
                            })
                        )
                    ),
                    row(
                        'Container',
                        button({
                            ...dialogBtn(Icon.addressCard()),
                            text: 'Dialog not in "portal',
                            onClick: () => model.dialogModel14.open() 
                        }),
                        button({
                            ...dialogBtn(Icon.chartLine()),
                            text: 'Dialog not in "portal (self-centering)',
                            onClick: () => model.dialogModel15.open() 
                        })
                    )
                )),               
                dialog({
                    model: model.dialogModel14,
                    icon: Icon.addressCard(),
                    title: 'Dialog not in "portal'
                }),
                dialog({
                    model: model.dialogModel15,
                    icon: Icon.chartLine(),
                    title: 'Dialog not in "portal (self-centering)'
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