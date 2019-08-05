import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {InputsPanel} from './InputsPanel';
import {FormPanel} from './FormPanel';
import {ToolbarFormPanel} from './ToolbarFormPanel';


@HoistComponent
export class FormsTab extends Component {

    render() {
        return tabContainer({
            model: {
                route: 'default.forms',
                switcherPosition: 'left',
                tabs: [
                    {id: 'inputs', title: 'Hoist Inputs', content: InputsPanel},
                    {id: 'form', title: 'FormModel', content: FormPanel},
                    {id: 'toolbarForm', title: 'Toolbar Forms', content: ToolbarFormPanel}
                ]
            },
            className: 'toolbox-tab'
        });
    }
}
