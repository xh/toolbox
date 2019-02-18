import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {tabContainer} from '@xh/hoist/desktop/cmp/tab';

import {ControlsPanel} from './ControlsPanel';
// import {SelectPanel} from './SelectPanel';
import {ValidationPanel} from './ValidationPanel';


@HoistComponent
export class FormsTab extends Component {

    model = new TabContainerModel({
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
