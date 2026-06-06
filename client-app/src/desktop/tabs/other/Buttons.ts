import {div, filler, hbox, li, p, ul} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, Intent, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {wrapper} from '../../common';
import './Buttons.scss';

class ButtonsModel extends HoistModel {
    @bindable disableButtons = false;
    @bindable activeButtons = false;
    @bindable activeButton: 'v1' | 'v2' | 'v3' = 'v1';

    constructor() {
        super();
        makeObservable(this);
    }
}

export const buttonsPanel = hoistCmp.factory({
    model: creates(ButtonsModel),
    render() {
        return wrapper({
            title: 'Buttons',
            icon: Icon.checkCircle(),
            description: div(
                p(
                    'Hoist desktop Buttons are built on the Blueprint library and accept all props supported by the underlying Blueprint button. Beyond text, icon, and onClick, the most common props for customizing their appearance are:'
                ),
                ul(
                    li('intent: [primary|success|warning|danger]'),
                    li('minimal: true|false'),
                    li('outlined: true|false')
                ),
                p('Each intent is shown below, within both panel and toolbar containers.')
            ),
            links: [
                {url: '$TB/client-app/src/desktop/tabs/other/Buttons.ts', notes: 'This example.'},
                {url: '$HR/desktop/cmp/button/Button.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/desktop/cmp/input/ButtonGroupInput.ts',
                    notes: 'Bindable input that groups buttons into a single-select control.'
                },
                {
                    url: 'https://blueprintjs.com/docs/',
                    text: 'Blueprint Docs',
                    notes: 'The underlying component library; buttons accept all Blueprint button props.'
                }
            ],
            item: div({
                className: 'tbox-buttons',
                item: [
                    buttonPanel({
                        headerItems: [
                            switchInput({
                                label: 'Dark Mode',
                                labelSide: 'left',
                                bind: 'darkTheme',
                                model: XH.appContainerModel.themeModel
                            }),
                            switchInput({
                                label: 'Disable All',
                                labelSide: 'left',
                                bind: 'disableButtons'
                            }),
                            switchInput({
                                label: 'All Active',
                                labelSide: 'left',
                                bind: 'activeButtons'
                            })
                        ]
                    }),
                    buttonPanel({intent: 'primary'}),
                    buttonPanel({intent: 'success'}),
                    buttonPanel({intent: 'warning'}),
                    buttonPanel({intent: 'danger'})
                ]
            })
        });
    }
});

const buttonPanel = hoistCmp.factory<ButtonsModel>(({model, intent, headerItems}) => {
    return panel({
        title: `Intent: ${intent ?? 'none (default)'}`,
        className: 'tbox-buttons__panel',
        headerItems,
        items: [
            hbox({
                className: 'tbox-buttons__panel__row',
                items: renderButtons(intent, model.disableButtons, model.activeButtons)
            }),
            hbox({
                className: 'tbox-buttons__panel__row',
                items: renderButtonGroupInputs(intent, model.disableButtons)
            })
        ],
        tbar: renderButtons(intent, model.disableButtons, model.activeButtons),
        bbar: renderButtonGroupInputs(intent, model.disableButtons)
    });
});

function renderButtons(intent: Intent, disabled: boolean, active: boolean) {
    return [
        button({
            text: 'Default',
            intent,
            disabled,
            active
        }),
        button({
            icon: Icon.checkCircle(),
            intent,
            disabled,
            active
        }),
        button({
            text: 'Default',
            icon: Icon.checkCircle(),
            intent,
            disabled,
            active
        }),
        filler(),
        button({
            text: '!Minimal',
            minimal: false,
            intent,
            disabled,
            active
        }),
        button({
            icon: Icon.checkCircle(),
            minimal: false,
            intent,
            disabled,
            active
        }),
        button({
            text: '!Minimal',
            icon: Icon.checkCircle(),
            minimal: false,
            intent,
            disabled,
            active
        }),
        filler(),
        button({
            text: 'Outlined',
            outlined: true,
            intent,
            disabled,
            active
        }),
        button({
            icon: Icon.checkCircle(),
            outlined: true,
            intent,
            disabled,
            active
        }),
        button({
            text: 'Outlined',
            icon: Icon.checkCircle(),
            outlined: true,
            intent,
            disabled,
            active
        })
    ];
}

function renderButtonGroupInputs(intent: Intent, disabled: boolean) {
    return [
        buttonGroupInput({
            bind: 'activeButton',
            minimal: true,
            intent,
            disabled,
            items: [
                button({text: 'v1', icon: Icon.checkCircle(), value: 'v1'}),
                button({text: 'v2', icon: Icon.xCircle(), value: 'v2'}),
                button({text: 'v3', icon: Icon.users(), value: 'v3'})
            ]
        }),
        filler(),
        buttonGroupInput({
            bind: 'activeButton',
            minimal: false,
            intent,
            disabled,
            items: [
                button({text: 'v1', icon: Icon.checkCircle(), value: 'v1'}),
                button({text: 'v2', icon: Icon.xCircle(), value: 'v2'}),
                button({text: 'v3', icon: Icon.users(), value: 'v3'})
            ]
        }),
        filler(),
        buttonGroupInput({
            bind: 'activeButton',
            outlined: true,
            intent,
            disabled,
            items: [
                button({text: 'v1', icon: Icon.checkCircle(), value: 'v1'}),
                button({text: 'v2', icon: Icon.xCircle(), value: 'v2'}),
                button({text: 'v3', icon: Icon.users(), value: 'v3'})
            ]
        })
    ];
}
