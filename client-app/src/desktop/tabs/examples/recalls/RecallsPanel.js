/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {grid} from '@xh/hoist/cmp/grid';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {vframe} from '@xh/hoist/cmp/layout';
import {RecallsPanelModel} from './RecallsPanelModel';
import './RecallsPanel.scss';

@HoistComponent
export class RecallsPanel extends Component {

    model = new RecallsPanelModel();
    
    render() {
        const {model} = this,
            {gridModel} = model;


        return vframe(
            panel({
                className: 'toolbox-recalls-panel',
                title: 'Recall Browser',
                item: grid({model: gridModel}),
                mask: model.loadModel,
                bbar: toolbar(
                    colChooserButton({gridModel}),
                    storeFilterField({gridModel})
                    // black magic!!
                )
            }),
            panel({
                title: 'Details',
                item: 'hi from details', // <~ this.model.detailModel(instance of DataViewModel) here
                model: {
                    side: 'bottom',
                    defaultSize: 250,
                    defaultCollapsed: true,
                    prefName: 'recallsPanelConfig'
                }
            })
    );
    }

}

