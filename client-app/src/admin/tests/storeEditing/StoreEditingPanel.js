import {creates, hoistCmp} from '@xh/hoist/core';
import {StoreEditingPanelModel} from './StoreEditingPanelModel';
import {grid} from '@xh/hoist/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {hbox, hspacer} from '@xh/hoist/cmp/layout';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';

export const StoreEditingPanel = hoistCmp({
    model: creates(StoreEditingPanelModel),
    render({model}) {
        return panel({
            tbar: [
                button({
                    icon: Icon.add(),
                    text: 'Add',
                    intent: 'success',
                    onClick: () => model.add()
                }),
                button({
                    icon: Icon.add(),
                    text: 'Add 5',
                    intent: 'success',
                    onClick: () => model.addFive(0)
                }),
                button({
                    icon: Icon.check(),
                    text: 'Commit All',
                    intent: 'success',
                    onClick: () => model.commitAll(),
                    disabled: !model.store.isModified
                }),
                button({
                    icon: Icon.undo(),
                    text: 'Revert All',
                    intent: 'primary',
                    onClick: () => model.revert(),
                    disabled: !model.store.isModified
                }),
                toolbarSep(),
                storeDirtyIndicator()
            ],
            item: grid()
        });
    }
});

const storeDirtyIndicator = hoistCmp.factory(
    ({model}) => {
        const {isModified} = model.store;
        return hbox({
            alignItems: 'center',
            style: {
                color: isModified ? 'var(--xh-intent-warning)' : 'var(--xh-intent-success)'
            },
            items: [
                isModified ? Icon.circle() : Icon.checkCircle(),
                hspacer(5),
                'Store ' + (isModified ? 'Dirty' : 'Clean')
            ]
        });
    }
);
