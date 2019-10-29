import {hoistCmp, creates} from '@xh/hoist/core';
import {StoreEditingPanelModel} from './StoreEditingPanelModel';
import {grid} from '@xh/hoist/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {vframe, hframe} from '@xh/hoist/cmp/layout';

export const StoreEditingPanel = hoistCmp({
    model: creates(StoreEditingPanelModel),
    render({model}) {
        const {gridModel, addedGridModel, removedGridModel} = model;
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
                    onClick: () => model.commitAll()
                }),
                button({
                    icon: Icon.undo(),
                    text: 'Revert All',
                    intent: 'primary',
                    onClick: () => model.revert()
                })
            ],
            item: vframe(
                grid({model: gridModel}),
                hframe({
                    items: [
                        panel({
                            border: {
                                right: 'var(--xh-border-solid)'
                            },
                            title: 'Added Records',
                            item: grid({model: addedGridModel})
                        }),
                        panel({
                            title: 'Removed Records',
                            item: grid({model: removedGridModel})
                        })
                    ]
                })
            ),
            mask: 'onLoad'
        });
    }
});