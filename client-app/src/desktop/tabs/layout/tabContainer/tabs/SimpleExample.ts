import {hoistCmp} from '@xh/hoist/core';
import type {TabContainerConfig} from '@xh/hoist/cmp/tab';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {placeholder} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

export const simpleExample = hoistCmp.factory(({orientation}) =>
    tabContainer({
        className: 'tb-layout-tabs__child',
        switcher: {orientation},
        modelConfig: createContainerModelConfig(`${EXAMPLE_ROUTE}.${orientation}`)
    })
);

/** Route of the outer example container - nested examples route beneath it. */
export const EXAMPLE_ROUTE = 'default.layout.tabPanel';

/**
 * @param route - route for the container, with a `people`, `places`, and `things` child route
 *      defined for it in the desktop AppModel.
 */
export const createContainerModelConfig = (route: string): TabContainerConfig => {
    return {
        route,
        tabs: [
            {
                id: 'people',
                icon: Icon.user(),
                content: () => placeholder(Icon.user(), 'People')
            },
            {
                id: 'places',
                icon: Icon.location(),
                content: () => placeholder(Icon.location(), 'Places')
            },
            {
                id: 'things',
                icon: Icon.boxFull(),
                content: () => placeholder(Icon.boxFull(), 'Things')
            }
        ]
    };
};
