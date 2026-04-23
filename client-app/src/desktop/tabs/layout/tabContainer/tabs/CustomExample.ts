import {span} from '@xh/hoist/cmp/layout';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, segmentedControl, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {createContainerModelConfig} from './SimpleExample';

export const customExample = hoistCmp.factory({
    model: creates(() => CustomExampleModel),

    render({model}) {
        const {detachedTabModel} = model,
            tabOptions = detachedTabModel.tabs.map(t => ({
                value: t.id,
                label: t.title as string,
                icon: t.icon
            }));

        return panel({
            className: 'tb-layout-tabs__child',
            tbar: [
                segmentedControl({
                    model: detachedTabModel,
                    bind: 'activeTabId',
                    intent: 'primary',
                    options: tabOptions
                }),
                '-',
                buttonGroupInput({
                    model: detachedTabModel,
                    bind: 'activeTabId',
                    outlined: true,
                    intent: 'primary',
                    items: tabOptions.map(o =>
                        button({value: o.value, icon: o.icon, text: o.label})
                    )
                }),
                '-',
                select({
                    model: detachedTabModel,
                    bind: 'activeTabId',
                    options: tabOptions,
                    width: 140
                })
            ],
            item: tabContainer({model: detachedTabModel, switcher: false}),
            bbar: [
                Icon.infoCircle(),
                span(
                    'The top toolbar demonstrates three possible approaches to custom switchers via bound HoistInputs.'
                )
            ]
        });
    }
});

class CustomExampleModel extends HoistModel {
    @managed
    detachedTabModel = new TabContainerModel(createContainerModelConfig());
}
