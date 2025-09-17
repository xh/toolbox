import {placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {dashContainer} from '@xh/hoist/desktop/cmp/dash';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import {DetailModel} from './DetailModel';

export const detailPanel = hoistCmp.factory({
    model: creates(DetailModel),

    render({model}) {
        const {panelModel, positionId} = model;

        return panel({
            model: panelModel,
            collapsedTitle: 'Position Details',
            collapsedIcon: Icon.detail(),
            item: positionId ? dashContainer() : placeholder('Select a position to view details.')
        });
    }
});
