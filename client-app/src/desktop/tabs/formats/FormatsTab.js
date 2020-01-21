import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {numberFormatsPanel} from './tabs/NumberFormatsPanel';
import {dateFormatsPanel} from './tabs/DateFormatsPanel';

export const formatsTab = hoistCmp.factory(
    () => tabContainer({
        model: {
            route: 'default.formats',
            switcherPosition: 'left',
            tabs: [
                {id: 'number', title: 'Number', content: numberFormatsPanel},
                {id: 'date', title: 'Date', content: dateFormatsPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
