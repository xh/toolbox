import {hoistCmp, creates} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {ContainersPageModel} from './ContainersPageModel';

export const containersPage = hoistCmp.factory({
    model: creates(ContainersPageModel),
    render() {
        return page(tabContainer());
    }
});
