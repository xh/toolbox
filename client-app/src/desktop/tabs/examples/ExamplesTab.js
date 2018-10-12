/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';

import {NewsPanel} from './NewsPanel';
import {PortfolioPanel} from './PortfolioPanel';

@HoistComponent
export class ExamplesTab extends Component {

    localModel = new TabContainerModel({
        route: 'default.examples',
        tabs: [
            {id: 'news', content: NewsPanel},
            {id: 'positions', content: PortfolioPanel}
        ]
    });

    async loadAsync() {
        this.model.requestRefresh();
    }

    render() {
        return tabContainer({
            model: this.model,
            switcherPosition: 'left',
            className: 'toolbox-tab'
        });
    }
}
