import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {createContainerModelConfig} from './SimpleExample';

export const customExample = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
        return panel({
            className: 'child-tabcontainer',
            tbar: model.detachedTabModel.tabs.map(childModel => button({
                intent: childModel.isActive ? 'primary' : null,
                text: childModel.title,
                onClick: () => model.detachedTabModel.setActiveTabId(childModel.id)
            })),
            item: tabContainer({model: model.detachedTabModel})
        });
    }
});

class Model extends HoistModel {
    @managed
    detachedTabModel = new TabContainerModel(createContainerModelConfig({switcher: false}));
}