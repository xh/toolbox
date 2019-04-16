/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {RecallsPanelModel} from './RecallsPanelModel';
import './RecallsPanel.scss';

@HoistComponent
export class RecallsPanel extends Component {

    model = new RecallsPanelModel();
    
    render() {
        const {model} = this;
        return panel({
            className: 'toolbox-recalls-panel',
            title: 'Recall Browser',
            item: 'Hello Recalls'
        });
    }

}
