import {hoistCmp, useLocalModel} from '@xh/hoist/core';

import {sampleGrid} from '../../../../common';
import {GridWidgetModel} from './GridWidgetModel';

export const GridWidget = hoistCmp({
    render({viewModel}) {
        const model = useLocalModel(() => new GridWidgetModel(viewModel));
        return sampleGrid({
            model: model.sampleGridModel,
            omitGridTools: true
        });
    }
});