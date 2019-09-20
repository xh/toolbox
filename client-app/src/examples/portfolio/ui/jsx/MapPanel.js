import React from 'react';
import {hoistCmp, uses} from '@xh/hoist/core';
import {Panel} from '@xh/hoist/desktop/cmp/panel';
import {SplitTreeMap} from '@xh/hoist/desktop/cmp/treemap';

import {MapPanelModel} from '../../MapPanelModel';

export const MapPanel = hoistCmp({
    model: uses(MapPanelModel),

    render({model}) {
        const {panelSizingModel, loadModel} = model;

        return <Panel
            title={panelSizingModel.collapsed ? 'Treemap' : null}
            mask={loadModel}
            model={panelSizingModel}
        >
            <SplitTreeMap/>
        </Panel>;
    }
});

