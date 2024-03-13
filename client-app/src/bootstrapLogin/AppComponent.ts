import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {AppModel} from './AppModel';
import {br, placeholder, span} from '@xh/hoist/cmp/layout';

export const AppComponent = hoistCmp({
    displayName: 'Bootstrap Login',
    model: uses(AppModel),

    render({model}) {
        return placeholder({
            items: [
                span(`Logged in successfully as ${XH.getUser().displayName}`),
                br(),
                span('Redirecting to app...')
            ]
        });
    }
});
