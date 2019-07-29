/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core/index';
import {hbox, vframe} from '@xh/hoist/cmp/layout';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {positionsPanel} from './PositionsPanel';
import {splitTreeMap} from '@xh/hoist/desktop/cmp/treemap';
import {positionInfoPanel} from './PositionInfoPanel';

import './PortfolioPanel.scss';

@HoistComponent
export class PortfolioPanel extends Component {

    model = new PortfolioPanelModel();

    render() {
        const {model} = this,
            {positionsPanelModel, splitTreeMapModel, positionInfoPanelModel} = model;

        return vframe(
            hbox({
                flex: 1,
                items: [
                    positionsPanel({
                        model: positionsPanelModel
                    }),
                    splitTreeMap({
                        model: splitTreeMapModel
                    })
                ]
            }),
            positionInfoPanel({
                model: positionInfoPanelModel
            })
        );
    }
}

export const portfolioPanel = elemFactory(PortfolioPanel);