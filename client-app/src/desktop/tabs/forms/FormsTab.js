/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';

import {FormFieldsPanel} from './FormFieldsPanel';

@HoistComponent()
export class FormsTab extends Component {

    localModel = new TabContainerModel({
        route: 'default.forms',
        panes: [
            {id: 'fields',  content: FormFieldsPanel}
        ]
    });
    
    async loadAsync() {
        this.model.requestRefresh()
    }

    render() {
        return tabContainer({model: this.model, switcherPosition: 'left'});
    }
}
