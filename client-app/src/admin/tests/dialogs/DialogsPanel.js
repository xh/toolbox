import {useRef} from 'react';

import {table, tbody, td, th, tr, filler, /* p,*/ fragment} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dialog} from '@xh/hoist/desktop/cmp/dialog';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {label} from '@xh/hoist/cmp/layout';
import {switchInput, numberInput} from '@xh/hoist/desktop/cmp/input';
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
                switchInput({
                    bind: 'controllSizePos',
                    alignIndicator: 'right'
                }),
                label('x:'),
                numberInput({
                    bind: 'x',
                    min: 0,
                    width: 60,
                    commitOnChange: true,
                    disabled: !model.controllSizePos
                }),
                label('y:'),
                numberInput({
                    bind: 'y',
                    min: 0,
                    width: 60,
                    commitOnChange: true,
                    disabled: !model.controllSizePos
                }),
                label('width:'),
                numberInput({
                    bind: 'width',
                    min: 0,
                    width: 60,
                    commitOnChange: true,
                    disabled: !model.controllSizePos
                }),
                label('height:'),
                numberInput({
                    bind: 'height',
                    min: 0,
                    width: 60,
                    commitOnChange: true,
                    disabled: !model.controllSizePos
                }),
                filler(),
                switchInput({
                    bind: 'showCloseButton',
                    label: 'close button in header',
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
                        'These "Header Tests" do not respond to the controls in the toolbar below.',
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
                        null,
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
                                text: 'Resizable Dialog with OHLC Chart (m5)',
                                onClick: () => model.dialogModel5.open() 
                            }),
                            dialog({
                                model: model.dialogModel5,
                                icon: Icon.chartLine(),
                                title: 'Resizable Dialog with OHLC Chart (m5)'
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
                        null,
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'Stateful Draggable Only (m7)',
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
                        null,
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
                        null,
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
                        null,
                        fragment(
                            button({
                                ...dialogBtn(Icon.chartLine()),
                                text: 'custom style prop setting (should show with green shadow) (m13)',
                                onClick: () => model.dialogModel13.open() 
                            }),
                            dialog({
                                model: model.dialogModel13,
                                icon: Icon.chartLine(),
                                title: 'Dialog with custom green shadow (m13)',
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
                        null,
                        button({
                            ...dialogBtn(Icon.addressCard()),
                            text: 'Dialog not in "portal (m14)',
                            onClick: () => model.dialogModel14.open() 
                        }),
                        button({
                            ...dialogBtn(Icon.chartLine()),
                            text: 'Dialog not in "portal (self-centering) (m15)',
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

function row(rowHeader, explanation, col2, col3, col4) {
    return fragment(
        tr(th({className: 'explanation', colSpan: 4, items: explanation})),
        tr(th({className: 'row-header', items: rowHeader}), td(col2), td(col3), td(col4))
    );
}