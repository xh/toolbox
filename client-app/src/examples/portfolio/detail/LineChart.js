import {hoistElemFactory} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {chart} from '@xh/hoist/desktop/cmp/chart';

export const lineChart = hoistElemFactory(
    ({model, ...rest}) => panel({
        item: chart({model: model.chartModel}),
        mask: model.loadModel,
        ...rest
    })
);