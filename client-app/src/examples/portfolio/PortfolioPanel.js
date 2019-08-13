/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hbox, vframe} from '@xh/hoist/cmp/layout';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {gridPanel} from './GridPanel';
import {detailPanel} from './detail/DetailPanel';
import {mapPanel} from './MapPanel';

import './PortfolioPanel.scss';

@HoistComponent
export class PortfolioPanel extends Component {

    model = new PortfolioPanelModel();

    render() {
        const {model} = this,
            {gridPanelModel, mapPanelModel, detailPanelModel} = model;

        return panel({
            item: vframe(
                hbox({
                    flex: 1,
                    items: [
                        gridPanel({model: gridPanelModel}),
                        mapPanel({model: mapPanelModel})
                    ]
                }),
                detailPanel({model: detailPanelModel})
            ),
            mask: model.loadModel
        });
    }
}

export const portfolioPanel = elemFactory(PortfolioPanel);