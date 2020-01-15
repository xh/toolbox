import {HoistModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
export class ButtonWidgetModel {

    @bindable value;

    constructor(viewState, setViewStateSource) {
        this.value = viewState ? viewState.value : 'Button 1';
        setViewStateSource(() => this.getViewState());
    }

    //----------------------
    // Implementation
    //----------------------
    getViewState() {
        return {
            value: this.value,
            title: `Button Group: ${this.value}`,
            //icon: this.getIconForValue()
        };
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