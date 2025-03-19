import {dataView} from '@xh/hoist/cmp/dataview';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {ListModel} from './ListModel';
import './List.scss';

export const listView = hoistCmp.factory({
    displayName: 'ListView',
    className: 'mc-list',
    model: creates(ListModel),

    render({className}) {
        return panel({
            className,
            item: dataView()
        });
    }
});
