import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {ControlsPanel} from './ControlsPanel';
import {ValidationPanel} from './ValidationPanel';


@HoistComponent
export class FormsTab extends Component {

    render() {
        return tabContainer({
            model: {
                route: 'default.forms',
                switcherPosition: 'left',
                tabs: [
                    {id: 'controls', title: 'Controls', content: ControlsPanel},
                    {id: 'validation', title: 'Validation', content: ValidationPanel}
                ]
            },
            className: 'toolbox-tab'
        });
    }
}
