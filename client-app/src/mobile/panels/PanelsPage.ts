import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp} from '@xh/hoist/core';
import {PanelsPageModel} from './PanelsPageModel';

export const panelsPage = hoistCmp.factory({
    model: creates(PanelsPageModel),
    render() {
        // Switcher to the top so it never collides with each tab's bottom pull-up sheet.
        return tabContainer({switcher: {orientation: 'top'}});
    }
});
