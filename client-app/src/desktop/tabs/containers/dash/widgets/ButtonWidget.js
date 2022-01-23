import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {div, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';

export const buttonWidget = hoistCmp.factory({
    model: creates(() => new LocalModel()),
    render({model}) {
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
                    div({
                        className: 'xh-pad',
                        item: `A stateful ButtonGroupInput. "${model.value}" is selected.`
                    })
                ]
            })
        );
    }
});

class LocalModel extends HoistModel {
    @bindable value;

    onLinked() {
        makeObservable(this);
        const {viewModel} = this.componentProps;
        this.value = viewModel.viewState ? viewModel.viewState.value : 'Button 1';
        this.addReaction({
            track: () => this.value,
            run: (value) => {
                viewModel.setIcon(this.getIconForValue(value));
                viewModel.setViewState({value});
            }
        });
    }

    //----------------------
    // Implementation
    //----------------------
    getIconForValue(value) {
        switch (value) {
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
