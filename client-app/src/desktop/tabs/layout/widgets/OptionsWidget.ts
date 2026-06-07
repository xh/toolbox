import {creates, hoistCmp, HoistModel, lookup} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {div, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash/DashViewModel';

export const optionsWidget = hoistCmp.factory({
    model: creates(() => OptionsWidgetModel),
    render({model}) {
        return panel({
            item: vbox({
                padding: 10,
                items: [
                    segmentedControl({
                        model,
                        bind: 'value',
                        outlined: true,
                        options: [
                            {value: 'Option 1', label: 'Option 1', icon: Icon.chartLine()},
                            {value: 'Option 2', label: 'Option 2', icon: Icon.gear()},
                            {value: 'Option 3', label: 'Option 3', icon: Icon.skull()}
                        ]
                    }),
                    div({
                        className: 'xh-pad',
                        item: `A stateful, outlined SegmentedControl. "${model.value}" is selected.`
                    })
                ]
            })
        });
    }
});

class OptionsWidgetModel extends HoistModel {
    @bindable value: string;
    @lookup(DashViewModel) viewModel: DashViewModel;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        const {viewModel} = this;
        this.value = viewModel.viewState ? viewModel.viewState.value : 'Option 1';
        this.addReaction({
            track: () => this.value,
            run: value => (viewModel.viewState = {value}),
            fireImmediately: true
        });
    }
}
