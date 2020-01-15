import {hoistCmp, uses} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {vbox, div} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {form} from '@xh/hoist/cmp/form';

import {ButtonWidgetModel} from './ButtonWidgetModel';

export const ButtonWidget = hoistCmp({
    model: uses(ButtonWidgetModel),
    render({model}) {
        const {value} = model;
        return panel(
            vbox({
                padding: 10,
                items: [
                    form(
                        formField({
                            label: null,
                            field: 'buttonGroup',
                            item: buttonGroupInput(
                                button({
                                    icon: Icon.chartLine(),
                                    text: 'Button 1',
                                    value: 'Button 1'
                                }),
                                button({
                                    icon: Icon.gear(),
                                    text: 'Button 2',
                                    value: 'Button 2'
                                }),
                                button({
                                    icon: Icon.skull(),
                                    text: 'Button 3',
                                    value: 'Button 3'
                                })
                            )
                        })
                    ),
                    div({
                        item: `A stateful ButtonGroupInput. "${value}" is selected.`
                    })
                ]
            })
        );
    }
});
