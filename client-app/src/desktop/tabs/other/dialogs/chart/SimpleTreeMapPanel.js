import {hoistCmp, creates} from '@xh/hoist/core';
import {treeMap} from '@xh/hoist/desktop/cmp/treemap';

import {SimpleTreeMapModel} from './SimpleTreeMapModel';

export const simpleTreeMapPanel = hoistCmp.factory({
    model: creates(SimpleTreeMapModel),

    render() {
        return treeMap({width: '100%', height: '100%'});
    }
});