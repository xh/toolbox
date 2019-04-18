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
import {grid} from '@xh/hoist/cmp/grid';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';

@HoistComponent
export class RecallsPanel extends Component {

    model = new RecallsPanelModel();
    
    render() {
        // const {model} = this;
        const {gridModel} = this.model;

        return panel({
            className: 'toolbox-recalls-panel',
            title: 'Recall Browser',
            item: grid({
                model: gridModel

            }),
            bbar: toolbar(
                colChooserButton({gridModel})
            )
        });
    }

}
