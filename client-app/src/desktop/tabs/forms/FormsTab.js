import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';

import {ControlsPanel} from './ControlsPanel';
// import {SelectPanel} from './SelectPanel';
import {ValidationPanel} from './ValidationPanel';


@HoistComponent
export class FormsTab extends Component {

    model = new TabContainerModel({
        route: 'default.forms',
        tabs: [
            {id: 'controls', title: 'Controls', content: ControlsPanel},
            // {id: 'selects', title: 'Selects', content: SelectPanel},
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
