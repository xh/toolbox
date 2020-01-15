import {hoistCmp, creates} from '@xh/hoist/core';

import {sampleGrid} from '../../../../common';
import {ButtonWidgetModel} from './ButtonWidgetModel';

export const GridWidget = hoistCmp({
    model: creates(({viewState, setViewStateSource}) => new ButtonWidgetModel(viewState, setViewStateSource)),
    render() {
        return sampleGrid({omitGridTools: true});
    }
});