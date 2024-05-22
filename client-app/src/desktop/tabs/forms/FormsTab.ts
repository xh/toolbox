import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {inputsPanel} from './InputsPanel';
import {formPanel} from './FormPanel';
import {toolbarFormPanel} from './ToolbarFormPanel';

export const formsTab = hoistCmp.factory(() =>
    tabContainer({
        modelConfig: {
            route: 'default.forms',
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'form', title: 'FormModel', content: formPanel},
                {id: 'inputs', title: 'Hoist Inputs', content: inputsPanel},
                {id: 'toolbarForm', title: 'Toolbar Forms', content: toolbarFormPanel}
            ]
        },
        className: 'tb-tab'
    })
);
