import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {InputsPanel} from './InputsPanel';
import {FormPanelWrapper} from './FormPanelWrapper';
import {ToolbarFormPanel} from './ToolbarFormPanel';

export const FormsTab = hoistCmp(
    () => tabContainer({
        model: {
            route: 'default.forms',
            switcherPosition: 'left',
            tabs: [
                {id: 'form', title: 'FormModel', content: FormPanelWrapper},
                {id: 'inputs', title: 'Hoist Inputs', content: InputsPanel},
                {id: 'toolbarForm', title: 'Toolbar Forms', content: ToolbarFormPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
