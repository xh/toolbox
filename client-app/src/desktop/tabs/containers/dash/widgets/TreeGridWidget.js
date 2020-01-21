import {hoistCmp} from '@xh/hoist/core';

import {sampleTreeGrid} from '../../../../common';

export const TreeGridWidget = hoistCmp({
    render() {
        return sampleTreeGrid({model: {includeCheckboxes: false}});
    }
});