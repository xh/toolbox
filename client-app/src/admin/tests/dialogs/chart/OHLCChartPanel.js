import {hoistCmp, creates} from '@xh/hoist/core';
import {chart} from '@xh/hoist/cmp/chart';

import {OHLCChartModel} from './OHLCChartModel';


export const oHLCChartPanel = hoistCmp.factory({
    model: creates(OHLCChartModel),

    render({model}) {
        return chart();
    }

});
