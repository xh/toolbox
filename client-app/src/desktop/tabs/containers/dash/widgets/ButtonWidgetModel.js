import {HoistModel, managed} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {FormModel} from '@xh/hoist/cmp/form';

@HoistModel
export class ButtonWidgetModel {

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

    //----------------------
    // Dash container state
    //----------------------
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

    //----------------------
    // Implementation
    //----------------------
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