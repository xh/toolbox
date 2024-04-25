import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {dataView} from '@xh/hoist/cmp/dataview';
import {refreshButton} from '@xh/hoist/mobile/cmp/button';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {DataViewPageModel} from './DataViewPageModel';

export const dataViewPage = hoistCmp.factory({
    model: creates(DataViewPageModel),

    render() {
        return panel({
            title: 'DataView',
            icon: Icon.addressCard(),
            mask: 'onLoad',
            item: dataView(),
            bbar: [filler(), refreshButton({text: 'Load new (random) records'})]
        });
    }
});
