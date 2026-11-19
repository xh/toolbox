import {grid} from '@xh/hoist/cmp/grid';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {InspectorModel} from './InspectorModel';

export const inspectorPanel = hoistCmp.factory({
    displayName: 'BlueprintInspectorPanel',
    model: creates(InspectorModel),

    render({model}) {
        return panel({
            title: 'Inspector',
            icon: Icon.search(),
            compactHeader: true,
            headerItems: [`Version ${model.panelModel.blueprintModel.version}`],
            modelConfig: {side: 'right', defaultSize: 600},
            items: [
                panel({
                    title: 'Variables',
                    compactHeader: true,
                    flex: 1,
                    item: grid({model: model.variablesGridModel})
                }),
                panel({
                    title: 'Issues',
                    compactHeader: true,
                    flex: 1,
                    item: grid({model: model.issuesGridModel})
                })
            ]
        });
    }
});
