import {creates, hoistCmp, HoistModel, lookup} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {div, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash/DashViewModel';

export const buttonWidget = hoistCmp.factory({
    model: creates(() => ButtonWidgetModel),
    render({model}) {
        return panel({
            item: vbox({
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
        });
    }
});

class ButtonWidgetModel extends HoistModel {
    @bindable value: string;
    @lookup(DashViewModel) viewModel: DashViewModel;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        const {viewModel} = this;
        this.value = viewModel.viewState ? viewModel.viewState.value : 'Button 1';
        this.addReaction({
            track: () => this.value,
            run: value => {
                viewModel.icon = this.getIconForValue(value);
                viewModel.viewState = {value};
            },
            fireImmediately: true
        });
    }

    //----------------------
    // Implementation
    //----------------------
    private getIconForValue(value: string) {
        switch (value) {
            case 'Button 1':
                return Icon.chartLine();
            case 'Button 2':
                return Icon.gear();
            case 'Button 3':
                return Icon.skull();
            default:
                return Icon.stop();
        }
    }
}
