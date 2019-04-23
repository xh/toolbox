/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {RecallsPanelModel} from './RecallsPanelModel';
import './RecallsPanel.scss';
import {grid} from '@xh/hoist/cmp/grid';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {mask} from '@xh/hoist/desktop/cmp/mask';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {filler} from '@xh/hoist/cmp/layout';

@HoistComponent
export class RecallsPanel extends Component {

    model = new RecallsPanelModel();
    
    render() {
        const {model} = this;
        const {gridModel} = model;

        return panel({
            className: 'toolbox-recalls-panel',
            title: 'Recall Browser',
            item: grid({
                model: gridModel

            }),
            mask: mask({
                model: model.loadModel,
                // isDisplayed: true,
                message: 'you\'re looking at the best Mask ever',
                spinner: true,
                onClick: () => XH.toast({message: 'Cheerios mate!'})
                // Without spinner or message, what is the eventListener attached to?!
            }),
            tbar: toolbar(
                filler
            ),
            bbar: toolbar(
                colChooserButton({gridModel}),
                storeFilterField({gridModel})
                // Demon magic!!
            )
        });
    }

}

