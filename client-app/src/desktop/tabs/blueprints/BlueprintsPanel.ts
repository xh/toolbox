import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {filler, hframe, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {BlueprintsPanelModel, SCENARIOS} from './BlueprintsPanelModel';
import './Blueprints.scss';
import {inspectorPanel} from './InspectorPanel';

/** A blueprint rendered beside its JSON harness and its inspector. */
export const blueprintsPanel = hoistCmp.factory({
    displayName: 'BlueprintsPanel',
    model: creates(BlueprintsPanelModel),

    render({model}) {
        return hframe(
            harnessPanel(),
            panel({flex: 1, item: blueprintView({model: model.blueprintModel})}),
            inspectorPanel()
        );
    }
});

const harnessPanel = hoistCmp.factory<BlueprintsPanelModel>({
    render({model}) {
        return panel({
            title: 'Blueprint JSON',
            icon: Icon.json(),
            compactHeader: true,
            modelConfig: {side: 'left', defaultSize: 400},
            tbar: [
                select({bind: 'scenario', options: SCENARIOS, width: 220}),
                filler(),
                button({
                    text: 'Apply',
                    icon: Icon.check(),
                    intent: 'primary',
                    onClick: () => model.apply()
                })
            ],
            item: jsonInput({bind: 'draft', flex: 1, width: '100%', commitOnChange: true}),
            bbar: [statusText()]
        });
    }
});

const statusText = hoistCmp.factory<BlueprintsPanelModel>(({model}) => {
    const {parseError, applyIssues, hasErrors} = model;
    if (parseError) return errorText(`Not valid JSON: ${parseError}`);
    if (!hasErrors) return 'Applied';
    const count = applyIssues.filter(it => it.severity === 'error').length;
    return errorText(`${count} error(s). Showing the last valid blueprint.`);
});

const errorText = (text: string) => span({className: 'xh-intent-danger', item: text});
