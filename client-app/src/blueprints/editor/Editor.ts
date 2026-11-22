import {
    blueprintView,
    elementOutline,
    widgetPalette
} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {grid} from '@xh/hoist/cmp/grid';
import {filler, hframe, placeholder, span, vbox, vframe} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import {architectChat, architectHeaderItems} from '../ArchitectPanel';
import {documentBar} from '../documentBar/DocumentBar';
import {EditorModel} from './EditorModel';
import type {DockTab} from './EditorModel';

/**
 * The open blueprint: its bar over the dock's rail, the dock, the blueprint as a canvas or JSON,
 * and in design its Inspector.
 */
export const editor = hoistCmp.factory({
    displayName: 'BlueprintEditor',
    model: creates(EditorModel),

    render({model}) {
        const {shell} = model;
        return vframe(
            documentBar(),
            hframe(
                dockRail(),
                model.dockOpen ? dock() : null,
                shell.editorView === 'json' && model.shown ? jsonView() : blueprintPane(),
                model.isDesigning && model.shown ? inspector() : null
            )
        );
    }
});

const dockRail = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) =>
        vbox({
            className: 'tb-dock__rail',
            items: model.dockTabs.map(tab =>
                button({
                    key: tab.id,
                    className: classNames(
                        'tb-dock__rail-button',
                        model.dockOpen && model.dockTab === tab.id && 'tb-dock__rail-button--on'
                    ),
                    icon: tab.icon,
                    minimal: true,
                    tooltip: tab.title,
                    onClick: () => model.toggleTab(tab.id)
                })
            )
        })
});

const dock = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const {shell, dockTab} = model,
            spec = model.dockTabs.find(it => it.id === dockTab);
        return panel({
            model: model.dockPanelModel,
            className: 'tb-dock',
            title: spec.title,
            icon: spec.icon,
            compactHeader: true,
            headerItems: [
                ...(dockTab === 'architect' ? architectHeaderItems(shell) : []),
                button({
                    icon: Icon.angleDoubleLeft(),
                    minimal: true,
                    tooltip: 'Close',
                    onClick: () => model.dockPanelModel.setCollapsed(true)
                })
            ],
            item: dockContent({tab: dockTab})
        });
    }
});

interface DockContentProps extends HoistProps<EditorModel> {
    tab: DockTab;
}

const dockContent = hoistCmp.factory<DockContentProps>({
    model: uses(EditorModel),
    render: ({model, tab}) => {
        const {designModel} = model.shell;
        switch (tab) {
            case 'structure':
                return elementOutline({designModel});
            case 'add':
                return widgetPalette({designModel});
            case 'history':
                return grid({model: model.historyGridModel});
            case 'values':
                return grid({model: model.valuesGridModel});
            default:
                return architectChat();
        }
    }
});

const blueprintPane = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const {shell} = model;
        return panel({
            item: model.shown
                ? blueprintView({
                      model: shell.blueprintModel,
                      designModel: shell.designModel,
                      onAddWidget: () => model.showTab('add'),
                      onAskArchitect: () => model.showTab('architect')
                  })
                : placeholder(Icon.layout(), emptyText(model))
        });
    }
});

/** The blueprint as JSON, to edit and apply as one edit in design, or a comparison with a publish. */
const jsonView = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        if (model.compareVersion != null) return compareView();
        const {applyError, isJsonDirty, isDesigning} = model;
        return panel({
            className: 'tb-editor__json',
            item: jsonInput({
                bind: 'draft',
                commitOnChange: true,
                readonly: !isDesigning,
                flex: 1,
                width: '100%'
            }),
            bbar: isDesigning
                ? [
                      applyError ? span({className: 'xh-intent-danger', item: applyError}) : null,
                      filler(),
                      button({
                          text: 'Revert',
                          icon: Icon.reset(),
                          disabled: !isJsonDirty,
                          onClick: () => model.revertDraft()
                      }),
                      button({
                          text: 'Apply',
                          icon: Icon.check(),
                          intent: 'primary',
                          minimal: false,
                          disabled: !isJsonDirty,
                          onClick: () => model.applyDraft()
                      })
                  ]
                : null
        });
    }
});

const compareView = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const doc = model.shell.documentModel.document,
            open = doc.kind === 'draft' ? 'this draft' : `v${doc.version}`;
        return panel({
            className: 'tb-editor__compare',
            tbar: [
                span({
                    className: 'tb-editor__compare-title',
                    item: `Changes from v${model.compareVersion} to ${open}`
                }),
                filler(),
                button({
                    text: 'Close',
                    icon: Icon.close(),
                    onClick: () => model.closeCompare()
                })
            ],
            item: grid({model: model.compareGridModel})
        });
    }
});

const inspector = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) =>
        panel({
            model: model.inspectorPanelModel,
            title: 'Inspector',
            icon: Icon.search(),
            compactHeader: true,
            item: tabContainer({
                model: model.inspectorTabsModel,
                switcher: {enableOverflow: true}
            })
        })
});

function emptyText({shell}: EditorModel): string {
    const error = shell.openIssues.find(it => it.severity === 'error');
    if (error) return error.message;
    return shell.selected
        ? 'This blueprint is empty. Ask the Architect to build it.'
        : 'Pick a blueprint, or start a new one.';
}
