import type {BlueprintDesignModel} from '@xh/hoist-chat-kit/blueprint';
import {
    elementInspector,
    elementOutline,
    widgetPalette
} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {vframe} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';

interface InspectorOutlineProps extends HoistProps {
    designModel: BlueprintDesignModel;
    /** True to show the widget palette above the outline. */
    designing: boolean;
}

/** The blueprint's elements, over the selected one's config, under the widget palette in design. */
export const inspectorOutline = hoistCmp.factory<InspectorOutlineProps>({
    displayName: 'InspectorOutline',
    model: false,

    render({designModel, designing}) {
        return vframe(
            panel({
                title: 'Add widget',
                compactHeader: true,
                className: 'tb-inspector__palette',
                omit: !designing,
                modelConfig: {
                    side: 'top',
                    defaultSize: 120,
                    minSize: 60,
                    persistWith: {localStorageKey: 'blueprintsInspectorPalette'}
                },
                item: widgetPalette({designModel})
            }),
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
