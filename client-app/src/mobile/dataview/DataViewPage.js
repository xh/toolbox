import {hoistCmp, creates} from '@xh/hoist/core';

import {page} from '@xh/hoist/mobile/cmp/page';
import {dataView} from '@xh/hoist/cmp/dataview';
import {refreshButton} from '@xh/hoist/mobile/cmp/button';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

import {DataViewPageModel} from './DataViewPageModel';

export const dataViewPage = hoistCmp.factory({
    model: creates(DataViewPageModel),

    render() {
        return page({
            title: 'DataView',
            icon: Icon.addressCard(),
            mask: 'onLoad',
            item: dataView({
                rowCls: 'dataview-item',
                itemHeight: 70
            }),
            bbar: [
                filler(),
                refreshButton({text: 'Load new (random) records'})
            ]
        });
    }
});