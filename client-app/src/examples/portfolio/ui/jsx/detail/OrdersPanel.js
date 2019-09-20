import React from 'react';
import {uses} from '@xh/hoist/core';
import {Grid, GridCountLabel} from '@xh/hoist/cmp/grid';
import {Filler} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core/index';
import {ColChooserButton} from '@xh/hoist/desktop/cmp/button';
import {Panel} from '@xh/hoist/desktop/cmp/panel';
import {StoreFilterField} from '@xh/hoist/desktop/cmp/store';
import {Icon} from '@xh/hoist/icon';

import {OrdersPanelModel} from '../../../detail/OrdersPanelModel';

export const OrdersPanel = hoistCmp({
    model: uses(OrdersPanelModel),

    render({model}) {
        const {positionId} = model;

        return <Panel
            title={`Orders: ${formatPositionId(positionId)}`}
            icon={Icon.edit()}
            mask={positionId == null}
            bbar={[
                <Filler/>,
                <GridCountLabel unit='orders'/>,
                <StoreFilterField/>,
                <ColChooserButton/>
            ]}
        >
            <Grid/>
        </Panel>;
    }
});

//------------------
// Implementation
//------------------
function formatPositionId(positionId) {
    if (!positionId) return '';

    const dimValPairs = positionId.split('>>').splice(1);
    const dimVals = dimValPairs.map((str) => str.split(':')[1]);
    return dimVals.join(' > ');
}