import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {div} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

export const simpleExample = hoistCmp.factory(({orientation}) =>
    tabContainer({
        className: 'child-tabcontainer',
        modelConfig: createContainerModelConfig({switcher: {orientation}})
    })
);

export const createContainerModelConfig = args => {
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
        ],
        ...args
    };
};
