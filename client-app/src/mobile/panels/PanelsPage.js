import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp} from '@xh/hoist/core';
import {PanelsPageModel} from './PanelsPageModel';

export const panelsPage = hoistCmp.factory({
    model: creates(PanelsPageModel),
    render() {
        return tabContainer();
    }
});
