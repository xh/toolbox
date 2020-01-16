import {HoistModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
export class ButtonWidgetModel {

    viewModel;
    @bindable value;

    constructor(viewModel) {
        this.viewModel = viewModel;
        this.value = viewModel.viewState ? viewModel.viewState.value : 'Button 1';
        this.addReaction({
            track: () => this.value,
            run: () => {
                this.viewModel.setViewState({
                    value: this.value,
                    title: `Button Group: ${this.value}`,
                    icon: this.getIconForValue()
                });
            }
        });
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