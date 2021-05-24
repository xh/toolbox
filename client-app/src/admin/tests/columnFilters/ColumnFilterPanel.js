import {creates, hoistCmp} from '@xh/hoist/core';
import {grid} from '@xh/hoist/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hframe} from '@xh/hoist/cmp/layout';
import {jsonInput} from '@xh/hoist/desktop/cmp/input';
import {ColumnFilterPanelModel} from './ColumnFilterPanelModel';
import {Icon} from '@xh/hoist/icon';

export const ColumnFilterPanel = hoistCmp({
    model: creates(ColumnFilterPanelModel),
    render({model}) {
        return hframe({
            items: [
                panel({
                    icon: Icon.filter(),
                    title: 'Column Filter Test Grid',
                    item: grid()
                }),
                panel({
                    model: {
                        side: 'right',
                        defaultSize: 500,
                        collapsible: true
                    },
                    icon: Icon.code(),
                    title: 'Store Filter as JSON',
                    item: jsonInput({
                        flex: 1,
                        width: '100%',
                        bind: 'jsonFilterInput'
                    })
                })
            ]
        });
    }
});
