import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dynamicTabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {filler, span} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {DynamicRoutableTabsModel} from './DynamicRoutableTabsModel';

export const dynamicRoutableTabsPanel = hoistCmp.factory({
    model: creates(DynamicRoutableTabsModel),

    render({model}) {
        const {tabContainerModel} = model;
        return panel({
            tbar: toolbar(
                dynamicTabSwitcher({model: tabContainerModel, flex: 1}),
                filler(),
                span('Open Item:'),
                textInput({
                    bind: 'itemIdInput',
                    model,
                    width: 80,
                    placeholder: 'ID...',
                    commitOnChange: true,
                    onKeyDown: e => {
                        if (e.key === 'Enter') model.onOpenItemClick();
                    }
                }),
                button({
                    text: 'Open Tab',
                    icon: Icon.add(),
                    onClick: () => model.onOpenItemClick()
                })
            ),
            item: tabContainer({model: tabContainerModel, switcher: false})
        });
    }
});
