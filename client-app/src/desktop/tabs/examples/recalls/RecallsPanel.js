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
import {storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {vframe, filler} from '@xh/hoist/cmp/layout';
import {textInput} from '@xh/hoist/desktop/cmp/input';

import {RecallsPanelModel} from './RecallsPanelModel';
import './RecallsPanel.scss';
import {detailsPanel} from './DetailsPanel';

@HoistComponent
export class RecallsPanel extends Component {

    model = new RecallsPanelModel();
    
    render() {
        const {model} = this,
            {gridModel, detailsPanelModel} = model;

        return vframe(
            panel({
                title: 'FDA Drug Recalls',
                item: grid({model: gridModel}),
                mask: model.loadModel,
                tbar: toolbar(
                    textInput({model, bind: 'searchQuery', placeholder: 'Keyword Search', commitOnChange: true}),
                    filler(),
                    storeCountLabel({gridModel}),
                    colChooserButton({gridModel})
                )
            }),
            panel({
                title: 'Details',
                item: detailsPanel({model: detailsPanelModel}),
                className: 'toolbox-recalls-detail-panel',
                model: {
                    side: 'bottom',
                    defaultSize: 325,
                    prefName: 'recallsPanelConfig'
                }
            })
        );
    }

}

