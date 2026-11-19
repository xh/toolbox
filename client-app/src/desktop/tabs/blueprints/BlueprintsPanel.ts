import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {filler, hframe, span} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {architectPanel} from './ArchitectPanel';
import {BlueprintsPanelModel, SCENARIOS} from './BlueprintsPanelModel';
import './Blueprints.scss';
import {inspectorPanel} from './InspectorPanel';

/** A blueprint rendered beside its JSON harness, the Architect and its inspector. */
export const blueprintsPanel = hoistCmp.factory({
    displayName: 'BlueprintsPanel',
    model: creates(BlueprintsPanelModel),

    render({model}) {
        const {blueprintModel} = model;
        return hframe(
            sidePanel(),
            panel({
                flex: 1,
                mask: 'onLoad',
                item: blueprintModel ? blueprintView({model: blueprintModel}) : null
            }),
            blueprintModel ? inspectorPanel() : null
        );
    }
});

const sidePanel = hoistCmp.factory<BlueprintsPanelModel>({
    render({model}) {
        return panel({
            modelConfig: {side: 'left', defaultSize: 400},
            item: model.blueprintModel
                ? tabContainer({
                      modelConfig: {
                          tabs: [
                              {id: 'json', title: 'JSON', icon: Icon.json(), content: harnessPanel},
                              {
                                  id: 'architect',
                                  title: 'Architect',
                                  icon: Icon.ai(),
                                  content: architectPanel
                              }
                          ]
                      }
                  })
                : null
        });
    }
});

const harnessPanel = hoistCmp.factory<BlueprintsPanelModel>({
    render({model}) {
        return panel({
            tbar: [
                select({bind: 'scenario', options: SCENARIOS, width: 220}),
                filler(),
                button({
                    text: 'Current',
                    icon: Icon.refresh(),
                    tooltip: 'Show the blueprint as it now stands, after any edits',
                    onClick: () => model.showCurrent()
                }),
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
