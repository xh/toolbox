import {creates, hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {ContainersPageModel} from './ContainersPageModel';

export const containersPage = hoistCmp.factory({
    model: creates(ContainersPageModel),
    render() {
        return tabContainer();
    }
});
