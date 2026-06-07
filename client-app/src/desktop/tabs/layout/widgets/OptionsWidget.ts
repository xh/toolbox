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
                            {value: 'Live', label: 'Live', icon: Icon.bolt()},
                            {value: 'Hourly', label: 'Hourly', icon: Icon.clock()},
                            {value: 'Daily', label: 'Daily', icon: Icon.calendar()}
                        ]
                    }),
                    div({
                        className: 'xh-pad',
                        item: `A stateful SegmentedControl. "${model.value}" is selected.`
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
        this.value = viewModel.viewState ? viewModel.viewState.value : 'Live';
        this.addReaction({
            track: () => this.value,
            run: value => (viewModel.viewState = {value}),
            fireImmediately: true
        });
    }
}
