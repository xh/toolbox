import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/mobile/cmp/button';
import {buttonGroupInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {splitTreeMap, treeMap} from '@xh/hoist/cmp/treemap';
import {Icon} from '@xh/hoist/icon';
import {TreeMapPageModel} from './TreeMapPageModel';

export const treeMapPage = hoistCmp.factory({
    model: creates(TreeMapPageModel),
    render({model}) {
        return panel({
            title: 'TreeMap',
            icon: Icon.gridLarge(),
            item: model.type === 'treeMap' ? treeMap() : splitTreeMap(),
            mask: 'onLoad',
            tbar: [
                buttonGroupInput({
                    bind: 'type',
                    items: [
                        button({text: 'Simple', value: 'treeMap'}),
                        button({text: 'Split', value: 'splitTreeMap'})
                    ]
                })
            ]
        });
    }
});
