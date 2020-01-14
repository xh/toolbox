import {hoistCmp, HoistModel, uses, creates, managed} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, vbox, div} from '@xh/hoist/cmp/layout';
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
            initialValue: 'Button 2'
        }]
    });

    get value() {
        return this.formModel.fields.buttonGroup.value;
    }

    getState() {
        const {value} = this,
            title = `Button Group: ${value}`,
            icon = this.getIconForValue();

        return {title, icon, value};
    }

    setState(state) {
        const {value} = state;
        this.formModel.fields.buttonGroup.setValue(value);
    }

    getIconForValue() {
        switch (this.value) {
            case 'Button 1':
                return Icon.chartLine();
            case 'Button 2':
                return Icon.gear();
            case 'Button 3':
                return Icon.skull();
            default:
                return Icon.question();
        }
    }
}

export const ButtonGroupPanel = hoistCmp({
    model: uses(ButtonGroupPanelModel),
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