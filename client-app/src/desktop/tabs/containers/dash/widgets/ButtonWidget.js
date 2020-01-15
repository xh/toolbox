import {hoistCmp, creates} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {vbox, div} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';

import {ButtonWidgetModel} from './ButtonWidgetModel';

export const ButtonWidget = hoistCmp({
    model: creates(({viewState, setViewStateSource}) => new ButtonWidgetModel(viewState, setViewStateSource)),
    render({model}) {
        return panel(
            vbox({
                padding: 10,
                items: [
                    buttonGroupInput({
                        bind: 'value',
                        items: [
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
                        ]
                    }),
                    div({item: `A stateful ButtonGroupInput. "${model.value}" is selected.`})
                ]
            })
        );
    }
});
