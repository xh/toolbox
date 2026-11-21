import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {InspectorModel} from './InspectorModel';

export const inspectorPanel = hoistCmp.factory({
    displayName: 'BlueprintInspectorPanel',
    model: creates(InspectorModel),

    render({model}) {
        const errors = model.panelModel.issues.filter(it => it.severity === 'error').length;
        return panel({
            title: errors ? `Inspector - ${errors} error${errors > 1 ? 's' : ''}` : 'Inspector',
            icon: errors ? Icon.warning({intent: 'danger'}) : Icon.search(),
            compactHeader: true,
            modelConfig: {
                side: 'right',
                defaultSize: 440,
                minSize: 280,
                defaultCollapsed: true,
                persistWith: {localStorageKey: 'blueprintsInspector'}
            },
            item: tabContainer({model: model.tabContainerModel, switcher: {enableOverflow: true}})
        });
    }
});
