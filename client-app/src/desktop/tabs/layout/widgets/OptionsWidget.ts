import {creates, hoistCmp, HoistModel, lookup} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {div, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash/DashViewModel';

const OPTIONS = [
    {value: 'Live', label: 'Live', icon: Icon.bolt()},
    {value: 'Hourly', label: 'Hourly', icon: Icon.clock()},
    {value: 'Daily', label: 'Daily', icon: Icon.calendar()}
];
const DEFAULT_VALUE = OPTIONS[0].value;

export const optionsWidget = hoistCmp.factory({
    model: creates(() => OptionsWidgetModel),
    render({model}) {
        return panel({
            item: vbox({
                padding: 10,
                items: [
                    segmentedControl({model, bind: 'value', outlined: true, options: OPTIONS}),
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
    @bindable value: string = DEFAULT_VALUE;
    @lookup(DashViewModel) viewModel: DashViewModel;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        const {viewModel} = this;

        // Sync the selection FROM the hosting view's state - on initial load and whenever it is
        // reloaded (e.g. the dashboard's "Reset State" action reuses this view and resets its
        // state). Guard against stale / obsolete persisted values by falling back to the default.
        this.addReaction({
            track: () => viewModel.viewState?.value,
            run: value =>
                this.setBindable(
                    'value',
                    OPTIONS.some(o => o.value === value) ? value : DEFAULT_VALUE
                ),
            fireImmediately: true
        });

        // Publish the selection back TO the view's state so it persists. Use the framework's
        // `setViewState` action, which pushes the new state to the view's registered providers.
        this.addReaction({
            track: () => this.value,
            run: value => viewModel.setViewState({value})
        });
    }
}
