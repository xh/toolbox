import React from 'react';
import {hoistCmp, uses} from '@xh/hoist/core';
import {AppModel} from './AppModel';

import {app as jsOnlyApp} from './ui/ef/App';
import {App as JSXApp} from './ui/jsx/App';

export const App = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        return model.renderMode === 'jsx' ? <JSXApp/> : jsOnlyApp();
    }
});
