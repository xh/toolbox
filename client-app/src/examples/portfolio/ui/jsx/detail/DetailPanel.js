import React from 'react';
import {hoistCmp, uses} from '@xh/hoist/core';
import {Panel} from '@xh/hoist/desktop/cmp/panel';
import {HBox} from '@xh/hoist/cmp/layout';

import {OrdersPanel} from './OrdersPanel';
import {ChartsPanel} from './ChartsPanel';
import {DetailPanelModel} from '../../../detail/DetailPanelModel';

export const DetailPanel = hoistCmp({
    model: uses(DetailPanelModel),
                          
    render({model}) {
        return <Panel model={model.panelSizingModel} mask={!model.positionId}>
            <HBox flex={1}>
                <OrdersPanel/>
                <ChartsPanel/>
            </HBox>
        </Panel>;
    }
});