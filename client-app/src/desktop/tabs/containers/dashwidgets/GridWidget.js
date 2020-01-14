import {hoistCmp} from '@xh/hoist/core';

import {sampleGrid} from '../../../common';

export const GridWidget = hoistCmp({
    render() {
        return sampleGrid({omitGridTools: true});
    }
});