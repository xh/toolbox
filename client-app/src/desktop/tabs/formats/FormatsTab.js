import {hoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {NumberFormatsPanel} from './tabs/NumberFormatsPanel';
import {DateFormatsPanel} from './tabs/DateFormatsPanel';

export const FormatsTab = hoistComponent(
    () => tabContainer({
        model: {
            route: 'default.formats',
            switcherPosition: 'left',
            tabs: [
                {id: 'number', title: 'Number', content: NumberFormatsPanel},
                {id: 'date', title: 'Date', content: DateFormatsPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
