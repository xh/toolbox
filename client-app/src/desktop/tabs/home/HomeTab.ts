import {creates, hoistCmp} from '@xh/hoist/core';
import {dashContainer} from '@xh/hoist/desktop/cmp/dash';
import {HomeTabModel} from './HomeTabModel';

export const homeTab = hoistCmp.factory({
    model: creates(HomeTabModel),
    render() {
        return dashContainer();
    }
});
