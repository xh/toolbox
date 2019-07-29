import {grid} from '@xh/hoist/cmp/grid';
import {HoistComponent} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {Component} from 'react';
import {WebSocketTestModel} from './WebSocketTestModel';

@HoistComponent
export class WebSocketTestPanel extends Component {

    model = new WebSocketTestModel();

    render() {
        const {model} = this,
            {subscribed, gridModel} = model;

        return panel({
            tbar: [
                button({
                    text: 'Subscribe',
                    icon: Icon.playCircle(),
                    intent: 'success',
                    minimal: false,
                    omit: subscribed,
                    onClick: () => model.subscribeAsync()
                }),
                button({
                    text: 'Unsubscribe',
                    icon: Icon.stopCircle(),
                    intent: 'danger',
                    minimal: false,
                    omit: !subscribed,
                    onClick: () => model.unsubscribeAsync()
                })
            ],
            item: grid({model: gridModel})
        });
    }

}
