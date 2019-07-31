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
import {positionInfoPanel} from './PositionInfoPanel';
import {splitTreeMapPanel} from './SplitTreeMapPanel';

import './PortfolioPanel.scss';

@HoistComponent
export class PortfolioPanel extends Component {

    model = new PortfolioPanelModel();

    render() {
        const {model} = this,
            {positionsPanelModel, splitTreeMapPanelModel, positionInfoPanelModel} = model;

        return vframe(
            hbox({
                flex: 1,
                items: [
                    positionsPanel({
                        model: positionsPanelModel
                    }),
                    splitTreeMapPanel({
                        // omit: model.isResizing,
                        model: splitTreeMapPanelModel
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