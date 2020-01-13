import {hoistCmp, HoistModel, uses, creates, managed} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {buttonGroupInput, select} from '@xh/hoist/desktop/cmp/input';
import {form, FormModel} from '@xh/hoist/cmp/form';
import {chart} from '@xh/hoist/cmp/chart';

import {LineChartModel} from '../../charts/LineChartModel';

//-----------------
// A collection of sample DashViews
//-----------------

// SimplePanel - A minimal, stateless view component
export const SimplePanel = hoistCmp({
    render() {
        return panel(
            box({
                padding: 10,
                item: 'Just a simple panel'
            })
        );
    }
});

// ButtonGroupPanel - Used to demonstrate saving arbitrary component state
@HoistModel
export class ButtonGroupPanelModel {
    @managed
    formModel = new FormModel({
        fields: [{
            name: 'buttonGroup',
            initialValue: 'button2'
        }]
    })
}

export const buttonGroupPanel = hoistCmp.factory({
    model: uses(ButtonGroupPanelModel),
    render({model}) {
        return panel(
            box({
                padding: 10,
                item: form(
                    formField({
                        field: 'buttonGroup',
                        item: buttonGroupInput(
                            button({
                                icon: Icon.chartLine(),
                                text: 'Button 1',
                                value: 'button1'
                            }),
                            button({
                                icon: Icon.gear(),
                                text: 'Button 2',
                                value: 'button2'
                            }),
                            button({
                                icon: Icon.skull(),
                                text: 'Button 3',
                                value: 'button3'
                            })
                        )
                    })
                )
            })
        );
    }
});

// Minimal chart component, reusing an existing ChartModel
export const SimpleChartPanel = hoistCmp({
    model: creates(LineChartModel),
    render({model}) {
        return panel({
            item: chart(),
            bbar: [
                box('Symbol: '),
                select({
                    bind: 'currentSymbol',
                    options: model.symbols,
                    enableFilter: false
                })
            ]
        });
    }
});