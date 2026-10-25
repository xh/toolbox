import {frame} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {dashCanvas} from '@xh/hoist/desktop/cmp/dash';
import {HomeTabModel} from './HomeTabModel';
import './HomeTab.scss';

export const homeTab = hoistCmp.factory({
    model: creates(HomeTabModel),
    render() {
        return frame({
            className: 'tb-home xh-tiled-bg',
            item: dashCanvas()
        });
    }
});
