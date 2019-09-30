import React from 'react';
import {hoistCmp, creates} from '@xh/hoist/core';
import {Panel} from '@xh/hoist/desktop/cmp/panel';
import {HBox, VFrame} from '@xh/hoist/cmp/layout';

import {PortfolioPanelModel} from '../../PortfolioPanelModel';
import {GridPanel} from './GridPanel';
import {DetailPanel} from './detail/DetailPanel';
import {MapPanel} from './MapPanel';

import '../PortfolioPanel.scss';

export const PortfolioPanel = hoistCmp({
    model: creates(PortfolioPanelModel),

    render({model}) {
        return <Panel mask='onLoad'>
            <VFrame>
                <HBox flex={1}>
                    <GridPanel/>
                    <MapPanel/>
                </HBox>
                <DetailPanel/>
            </VFrame>
        </Panel>;
    }
});
