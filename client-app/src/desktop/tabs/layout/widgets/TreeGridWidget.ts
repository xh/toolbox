import {hoistCmp} from '@xh/hoist/core';
import {sampleTreeGrid} from '../../../common';

export const treeGridWidget = hoistCmp.factory({
    render() {
        return sampleTreeGrid({modelConfig: {includeCheckboxes: false}});
    }
});
