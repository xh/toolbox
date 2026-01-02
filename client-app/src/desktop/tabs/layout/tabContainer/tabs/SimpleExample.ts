import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {div} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

export const simpleExample = hoistCmp.factory(({orientation}) =>
    tabContainer({
        className: 'child-tabcontainer',
        switcher: {orientation},
        modelConfig: createContainerModelConfig()
    })
);

export const createContainerModelConfig = () => {
    const tabTxt = title => div(`This is the ${title} tab`);

    return {
        tabs: [
            {
                id: 'people',
                icon: Icon.user(),
                content: () => tabTxt('People')
            },
            {
                id: 'places',
                icon: Icon.home(),
                content: () => tabTxt('Places')
            },
            {
                id: 'things',
                icon: Icon.portfolio(),
                content: () => tabTxt('Things')
            }
        ]
    };
};
