import {div} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

export const createContainerModelConfig = (args) => {
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