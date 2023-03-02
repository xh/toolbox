import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {fmtTime} from '@xh/hoist/format';
import {isEmpty, shuffle} from 'lodash';

export const dynamicExample = hoistCmp.factory({
    model: creates(() => DynamicExampleModel),

    render({model}) {
        return panel({
            className: 'child-tabcontainer',
            bbar: [
                button({icon: Icon.add(), text: 'Add', onClick: () => model.addDynamic()}),
                button({
                    icon: Icon.transaction(),
                    text: 'Shuffle',
                    onClick: () => model.shuffleDynamic()
                }),
                button({
                    icon: Icon.x(),
                    text: 'Remove First',
                    onClick: () => model.removeDynamic()
                }),
                button({icon: Icon.xCircle(), text: 'Clear', onClick: () => model.clearDynamic()})
            ],
            item: tabContainer({model: model.dynamicModel})
        });
    }
});

class DynamicExampleModel extends HoistModel {
    id = 0;

    @managed
    dynamicModel = new TabContainerModel({
        tabs: [],
        switcher: {
            orientation: 'top',
            enableOverflow: true
        }
    });

    constructor() {
        super();
        this.addDynamic();
    }

    addDynamic() {
        const {dynamicModel} = this,
            icons = [Icon.user(), Icon.home(), Icon.portfolio()],
            id = this.id++,
            message = `Tab ${id}: Brand spanking new at ${fmtTime(new Date(), {
                fmt: 'HH:mm:ss',
                asHtml: true
            })}`;

        dynamicModel.addTab(
            {
                id: id.toString(),
                icon: icons[id % icons.length],
                title: `Tab ${id}`,
                tooltip: message,
                showRemoveAction: true,
                content: () => div(message)
            },
            {activateImmediately: true}
        );
    }

    removeDynamic() {
        const {dynamicModel} = this;
        if (!isEmpty(dynamicModel.tabs)) {
            dynamicModel.removeTab(dynamicModel.tabs[0]);
        }
    }

    clearDynamic() {
        this.dynamicModel.setTabs([]);
    }

    shuffleDynamic() {
        const {dynamicModel} = this;
        dynamicModel.setTabs(shuffle(dynamicModel.tabs));
    }
}
