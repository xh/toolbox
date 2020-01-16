import {hoistCmp, useLocalModel, HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {vbox, div} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';

export const ButtonWidget = hoistCmp({
    render({viewModel}) {
        const model = useLocalModel(() => new LocalModel(viewModel));
        return panel(
            vbox({
                padding: 10,
                items: [
                    buttonGroupInput({
                        model,
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

@HoistModel
class LocalModel {
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
