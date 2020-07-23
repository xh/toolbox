import {code, div, filler, hbox, p} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import React from 'react';
import {wrapper} from '../../common';
import './Buttons.scss';

@HoistModel
class ButtonsModel {
    @bindable disableButtons = false;
    @bindable activeButton = 'one';
}

export const buttonsPanel = hoistCmp.factory({
    model: creates(ButtonsModel),
    render() {
        return wrapper({
            description: (
                <div>
                    <p>
                        Hoist Desktop Buttons are implemented using the Blueprint library, and take all
                        props supported by the Blueprint component. In addition to <code>text</code>, <code>icon</code>,
                        and <code>onClick</code>, core props for customizing buttons include:
                    </p>
                    <ul>
                        <li><code>intent: [primary|success|warning|danger]</code></li>
                        <li><code>minimal: true|false</code></li>
                        <li><code>outlined: true|false</code></li>
                    </ul>
                    <p>
                        Buttons are shown below contained within both <code>panel</code> and <code>toolbar</code> components.
                    </p>
                </div>
            ),
            item: div({
                className: 'tbox-buttons',
                item: [
                    buttonPanel({headerItems: [
                        switchInput({
                            label: 'Dark Mode',
                            labelAlign: 'left',
                            bind: 'darkTheme',
                            model: XH
                        }),
                        switchInput({
                            label: 'Disable All',
                            labelAlign: 'left',
                            bind: 'disableButtons'
                        })
                    ]}),
                    buttonPanel({intent: 'primary'}),
                    buttonPanel({intent: 'success'}),
                    buttonPanel({intent: 'warning'}),
                    buttonPanel({intent: 'danger'})
                ]
            })
        });
    }
});

const buttonPanel = hoistCmp.factory(
    ({model, intent, headerItems}) => {
        return panel({
            title: `Intent: ${intent ?? 'undefined'}`,
            className: 'tbox-buttons__panel',
            headerItems,
            items: [
                hbox({
                    className: 'tbox-buttons__panel__row',
                    items: renderButtons(intent, model.disableButtons)
                }),
                hbox({
                    omit: intent,
                    className: 'tbox-buttons__panel__row',
                    items: renderButtonGroupInputs(intent, model.disableButtons)
                })
            ],
            tbar: renderButtons(intent, model.disableButtons),
            bbar: renderButtonGroupInputs(intent, model.disableButtons)
        });
    }
);

function renderButtons(intent, disabled) {
    return [
        button({
            text: 'Default',
            intent,
            disabled
        }),
        button({
            icon: Icon.checkCircle(),
            intent,
            disabled
        }),
        button({
            text: 'Default',
            icon: Icon.checkCircle(),
            intent,
            disabled
        }),
        filler(),
        button({
            text: '!Minimal',
            minimal: false,
            intent,
            disabled
        }),
        button({
            icon: Icon.checkCircle(),
            minimal: false,
            intent,
            disabled
        }),
        button({
            text: '!Minimal',
            icon: Icon.checkCircle(),
            minimal: false,
            intent,
            disabled
        }),
        filler(),
        button({
            text: 'Outlined',
            outlined: true,
            intent,
            disabled
        }),
        button({
            icon: Icon.checkCircle(),
            outlined: true,
            intent,
            disabled
        }),
        button({
            text: 'Outlined',
            icon: Icon.checkCircle(),
            outlined: true,
            intent,
            disabled
        })
    ];
}

function renderButtonGroupInputs(intent, disabled) {
    if (intent) return null;
    return [
        buttonGroupInput({
            bind: 'activeButton',
            minimal: true,
            intent,
            disabled,
            items: [
                button({text: 'Minimal 1', icon: Icon.checkCircle(), value: 'one'}),
                button({text: 'Minimal 2', icon: Icon.xCircle(), value: 'two'})
            ]
        }),
        filler(),
        buttonGroupInput({
            bind: 'activeButton',
            minimal: false,
            intent,
            disabled,
            items: [
                button({text: 'Default 1', icon: Icon.checkCircle(), value: 'one'}),
                button({text: 'Default 2', icon: Icon.xCircle(), value: 'two'})
            ]
        }),
        filler(),
        buttonGroupInput({
            bind: 'activeButton',
            outlined: true,
            intent,
            disabled,
            items: [
                button({text: 'Outlined 1', icon: Icon.checkCircle(), value: 'one'}),
                button({text: 'Outlined 2', icon: Icon.xCircle(), value: 'two'})
            ]
        })
    ];
}