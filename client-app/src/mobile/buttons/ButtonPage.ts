import {creates, hoistCmp} from '@xh/hoist/core';
import {div, hbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {button} from '@xh/hoist/mobile/cmp/button';
import {buttonGroupInput, label, switchInput} from '@xh/hoist/mobile/cmp/input';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';

import './ButtonPage.scss';
import {ButtonPageModel} from './ButtonPageModel';

export const buttonPage = hoistCmp.factory({
    model: creates(ButtonPageModel),
    render() {
        return panel({
            title: 'Buttons',
            icon: Icon.pointerUp(),
            scrollable: true,
            className: 'tb-page button-page xh-tiled-bg',
            tbar: [
                label('Disable All:'),
                switchInput({bind: 'disabled'}),
                label('All Active:'),
                switchInput({bind: 'active'}),
                label('Toolbar:'),
                switchInput({bind: 'toolbar'})
            ],
            items: [
                buttonPanel(),
                buttonPanel({intent: 'primary'}),
                buttonPanel({intent: 'success'}),
                buttonPanel({intent: 'warning'}),
                buttonPanel({intent: 'danger'})
            ]
        });
    }
});

const buttonPanel = hoistCmp.factory<ButtonPageModel>(({model, intent}) => {
    const {disabled, active, toolbar} = model;
    return div({
        className: classNames(
            'tb-card button-page__panel',
            toolbar ? 'button-page__panel--toolbar' : null
        ),
        items: [
            div({
                className: 'tb-card__title',
                item: `Intent: ${intent ?? 'none (default)'}`
            }),
            hbox({
                className: 'button-page__row',
                items: [
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
                    })
                ]
            }),
            hbox({
                className: 'button-page__row',
                items: [
                    button({
                        text: 'Minimal',
                        minimal: true,
                        intent,
                        disabled,
                        active
                    }),
                    button({
                        icon: Icon.checkCircle(),
                        minimal: true,
                        intent,
                        disabled,
                        active
                    }),
                    button({
                        text: 'Minimal',
                        icon: Icon.checkCircle(),
                        minimal: true,
                        intent,
                        disabled,
                        active
                    })
                ]
            }),
            hbox({
                className: 'button-page__row',
                items: [
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
                ]
            }),
            hbox({
                className: 'button-page__row',
                item: buttonGroupInput({
                    bind: 'activeButton',
                    intent,
                    disabled,
                    items: [
                        button({text: 'v1', icon: Icon.checkCircle(), value: 'v1'}),
                        button({text: 'v2', icon: Icon.xCircle(), value: 'v2'}),
                        button({text: 'v3', icon: Icon.users(), value: 'v3'})
                    ]
                })
            }),
            hbox({
                className: 'button-page__row',
                item: buttonGroupInput({
                    bind: 'activeButton',
                    minimal: true,
                    intent,
                    disabled,
                    items: [
                        button({text: 'v1', icon: Icon.checkCircle(), value: 'v1'}),
                        button({text: 'v2', icon: Icon.xCircle(), value: 'v2'}),
                        button({text: 'v3', icon: Icon.users(), value: 'v3'})
                    ]
                })
            }),
            hbox({
                className: 'button-page__row',
                item: buttonGroupInput({
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
            })
        ]
    });
});
