import {grid} from '@xh/hoist/cmp/grid';
import {hbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
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
            headerItems: [modeToggle(), `Version ${model.panelModel.blueprintModel.version}`],
            modelConfig: {side: 'right', defaultSize: 480},
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
                }),
                panel({
                    title: 'History',
                    compactHeader: true,
                    flex: 1,
                    item: grid({model: model.historyGridModel})
                })
            ]
        });
    }
});

const modeToggle = hoistCmp.factory<InspectorModel>(({model}) => {
    const {panelModel} = model;
    return hbox({
        marginRight: 8,
        item: buttonGroupInput({
            value: panelModel.blueprintModel.mode,
            onChange: mode => panelModel.blueprintModel.setMode(mode),
            minimal: true,
            items: [button({text: 'Design', value: 'design'}), button({text: 'Run', value: 'run'})]
        })
    });
});
