import {grid} from '@xh/hoist/cmp/grid';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import type {InspectorModel} from './InspectorModel';

interface InspectorPublishesProps extends HoistProps {
    inspector: InspectorModel;
}

/** The open blueprint's publishes, newest first, each openable read-only. */
export const inspectorPublishes = hoistCmp.factory<InspectorPublishesProps>({
    displayName: 'InspectorPublishes',
    model: false,

    render({inspector}) {
        const {panelModel, publishesGridModel} = inspector,
            doc = panelModel.documentModel.document,
            selected = publishesGridModel.selectedRecord?.data.version as number,
            isWriter = doc?.access === 'write';
        return panel({
            tbar: [
                button({
                    text: 'Open',
                    icon: Icon.openExternal(),
                    tooltip: 'Open this publish, read-only',
                    disabled: !isWriter || selected == null,
                    onClick: () => panelModel.openVersionAsync(selected)
                }),
                button({
                    text: 'Back to draft',
                    icon: Icon.edit(),
                    disabled: !isWriter || doc?.kind === 'draft',
                    onClick: () => panelModel.openVersionAsync('draft')
                })
            ],
            item: grid({model: publishesGridModel})
        });
    }
});
