import {hoistCmp} from '@xh/hoist/core';
import {tabContainer, TabContainerConfig} from '@xh/hoist/cmp/tab';
import {placeholder} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

export const simpleExample = hoistCmp.factory(({orientation}) =>
    tabContainer({
        className: 'tb-layout-tabs__child',
        switcher: {orientation},
        modelConfig: createContainerModelConfig()
    })
);

export const createContainerModelConfig = (): TabContainerConfig => {
    return {
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
