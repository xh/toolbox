import {creates, hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {ContainersPageModel} from './ContainersPageModel';
import './ContainersPage.scss';

export const containersPage = hoistCmp.factory({
    model: creates(ContainersPageModel),
    render() {
        // Switcher to the top so it never collides with each tab's bottom pull-up sheet.
        return tabContainer({switcher: {orientation: 'top'}});
    }
});
