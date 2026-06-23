import {div, hbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {buttonGroupInput, switchInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import classNames from 'classnames';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './ButtonPage.scss';
import {ButtonPageModel} from './ButtonPageModel';

export const buttonPage = hoistCmp.factory({
    model: creates(ButtonPageModel),

    render({model}) {
        return exampleScreen({
            title: 'Buttons',
            icon: Icon.pointerUp(),
            description: [
                'Hoist `button` triggers actions on tap, with intents, minimal / outlined variants,',
                'and `buttonGroupInput` for segmented selection. Toggle the states here to see how each',
                'variant responds.'
            ],
            options: [
                exampleOption({label: 'Disabled', control: switchInput({model, bind: 'disabled'})}),
                exampleOption({label: 'Active', control: switchInput({model, bind: 'active'})}),
                exampleOption({label: 'Toolbar', control: switchInput({model, bind: 'toolbar'})})
            ],
            links: [
                {url: '$TB/client-app/src/mobile/buttons/ButtonPage.ts', notes: 'This example.'},
                {url: '$HR/mobile/cmp/button/Button.ts', text: 'Button source'}
            ],
            item: panel({
                scrollable: true,
                className: 'tb-page tb-button-page xh-tiled-bg',
                items: [
                    buttonPanel(),
                    buttonPanel({intent: 'primary'}),
                    buttonPanel({intent: 'success'}),
                    buttonPanel({intent: 'warning'}),
                    buttonPanel({intent: 'danger'})
                ]
            })
        });
    }
});

const buttonPanel = hoistCmp.factory<ButtonPageModel>(({model, intent}) => {
    const {disabled, active, toolbar} = model;
    return div({
        className: classNames(
            'tb-card tb-button-page__panel',
            toolbar ? 'tb-button-page__panel--toolbar' : null
        ),
        items: [
            div({
                className: 'tb-card__title',
                item: `Intent: ${intent ?? 'none (default)'}`
            }),
            hbox({
                className: 'tb-button-page__row',
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
                className: 'tb-button-page__row',
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
                className: 'tb-button-page__row',
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
                className: 'tb-button-page__row',
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
                className: 'tb-button-page__row',
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
                className: 'tb-button-page__row',
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
