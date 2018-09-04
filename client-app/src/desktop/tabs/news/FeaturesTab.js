/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';

import {NewsTab} from './NewsTab';

@HoistComponent()
export class FeaturesTab extends Component {

    localModel = new TabContainerModel({
        route: 'default.features',
        tabs: [
            {id: 'news', content: NewsTab}
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
