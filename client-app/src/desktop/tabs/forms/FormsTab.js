/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';

import {ControlsPanel} from './ControlsPanel';
import {ValidationPanel} from './ValidationPanel';


@HoistComponent()
export class FormsTab extends Component {

    localModel = new TabContainerModel({
        route: 'default.forms',
        tabs: [
            {id: 'controls', title: 'Controls', content: ControlsPanel},
            {id: 'validation', title: 'Validation', content: ValidationPanel}
        ]
    });

    render() {
        return tabContainer({
            model: this.model,
            switcherPosition: 'left',
            className: 'toolbox-tab'
        });
    }
}
