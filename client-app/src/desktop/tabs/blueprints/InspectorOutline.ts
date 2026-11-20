import type {BlueprintDesignModel} from '@xh/hoist-chat-kit/blueprint';
import {elementInspector, elementOutline} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {vframe} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';

interface InspectorOutlineProps extends HoistProps {
    designModel: BlueprintDesignModel;
}

/** The blueprint's elements, over the selected one's config. */
export const inspectorOutline = hoistCmp.factory<InspectorOutlineProps>({
    displayName: 'InspectorOutline',
    model: false,

    render({designModel}) {
        return vframe(
            panel({
                modelConfig: {side: 'top', defaultSize: 220, minSize: 100},
                item: elementOutline({designModel})
            }),
            panel({
                title: 'Config',
                compactHeader: true,
                item: elementInspector({designModel})
            })
        );
    }
});
