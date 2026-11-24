import {
    blueprintInspector,
    blueprintMap,
    blueprintStructure,
    blueprintView,
    presetsEditor,
    widgetPalette
} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {grid} from '@xh/hoist/cmp/grid';
import {tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {
    div,
    filler,
    fragment,
    hbox,
    hframe,
    placeholder,
    span,
    vbox,
    vframe
} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import type {HoistProps, Intent} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {
    jsonInput,
    segmentedControl,
    select,
    textArea,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {dialog} from '@xh/hoist/kit/blueprint';
import classNames from 'classnames';
import {architectChat, architectHeaderItems} from '../ArchitectPanel';
import {arrowPointerIcon, handPointerIcon} from '../../core/Icons';
import {tag} from '../cards';
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
        const stale = model.shell.documentModel.isStale;
        return vframe({
            className: classNames('tb-editor', stale && 'tb-editor--stale'),
            children: [
                documentBar(),
                stale ? staleBand() : null,
                hframe(
                    dockRail(),
                    model.dockOpen ? dock() : null,
                    vframe({
                        className: 'tb-editor__content',
                        children: [viewBar(), mainView()]
                    }),
                    model.isDesigning && model.shown ? inspector() : null
                )
            ]
        });
    }
});

const dockRail = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) =>
        vbox({
            className: 'tb-dock__rail',
            children: model.dockTabs.map(tab =>
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
            children: dockContent({tab: dockTab})
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
                return blueprintStructure({
                    designModel,
                    onAdd: section => model.addToSection(section)
                });
            case 'add':
                return widgetPalette({designModel});
            case 'history':
                return vframe(grid({model: model.historyGridModel}), publishDetailsDialog());
            case 'values':
                return grid({model: model.valuesGridModel});
            default:
                return architectChat();
        }
    }
});

const mainView = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const {shell} = model;
        if (!model.shown) return blueprintPane();
        switch (shell.editorView) {
            case 'json':
                return jsonView();
            case 'map':
                return panel({
                    className: 'tb-editor__map',
                    children: blueprintMap({
                        designModel: shell.designModel,
                        onOpenElement: () => (shell.editorView = 'canvas')
                    })
                });
            default:
                return blueprintPane();
        }
    }
});

const blueprintPane = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const {shell} = model;
        return panel({
            children: model.shown
                ? blueprintView({
                      model: shell.blueprintModel,
                      designModel: shell.designModel,
                      onAddWidget: () => model.showTab('add'),
                      onAskArchitect: () => model.askArchitect()
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
        return panel({
            className: 'tb-editor__json',
            children: jsonInput({
                bind: 'draft',
                commitOnChange: true,
                readonly: !model.isDesigning,
                flex: 1,
                width: '100%'
            })
        });
    }
});

const compareView = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) =>
        panel({
            className: 'tb-editor__compare',
            children: [diffSummary(), grid({model: model.compareGridModel})]
        })
});

const diffSummary = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const {diff, canRevealDiff} = model;
        return div({
            className: 'tb-editor__diff',
            children: diff.length
                ? diff.map((row, idx) => {
                      const revealable =
                          canRevealDiff &&
                          row.id &&
                          row.change !== 'removed' &&
                          row.kind !== 'other';
                      return hbox({
                          key: idx,
                          className: classNames(
                              'tb-editor__diff-row',
                              revealable && 'tb-editor__diff-row--link'
                          ),
                          title: revealable ? `Show ${row.id}` : null,
                          onClick: revealable ? () => model.revealDiff(row) : null,
                          children: [
                              tag(row.change, CHANGE_INTENTS[row.change]),
                              tag(row.kind),
                              span({className: 'tb-mono', children: row.text})
                          ]
                      });
                  })
                : span({className: 'tb-muted', children: 'Nothing differs.'})
        });
    }
});

const CHANGE_INTENTS: Record<string, Intent> = {
    added: 'success',
    removed: 'danger',
    renamed: 'warning',
    changed: 'primary'
};

/** A publish's note, label and pin, to change after the fact. */
const publishDetailsDialog = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const publish = model.editingPublish;
        return dialog({
            isOpen: !!publish,
            onClose: () => model.closePublishEditor(),
            title: publish ? `v${publish.version} details` : null,
            icon: publish ? Icon.edit() : null,
            style: {width: 420},
            children: publish
                ? panel({
                      className: 'tb-editor__publish-details',
                      children: vbox({
                          className: 'tb-editor__publish-fields',
                          children: [
                              span({className: 'tb-registry__label', children: 'Label'}),
                              textInput({
                                  bind: 'publishLabel',
                                  placeholder: 'Shown beside it in History, 50 characters at most',
                                  width: null
                              }),
                              span({className: 'tb-registry__label', children: 'Note'}),
                              textArea({
                                  bind: 'publishNote',
                                  placeholder: 'For readers',
                                  height: 72,
                                  width: null
                              }),
                              span({className: 'tb-registry__label', children: 'In History'}),
                              segmentedControl({
                                  bind: 'publishPinned',
                                  toggleOnClick: true,
                                  intent: 'primary',
                                  options: [
                                      {value: true, label: 'Pinned'},
                                      {value: false, label: 'Not pinned'}
                                  ]
                              })
                          ]
                      }),
                      bbar: [
                          filler(),
                          button({text: 'Cancel', onClick: () => model.closePublishEditor()}),
                          button({
                              text: 'Save',
                              icon: Icon.check(),
                              intent: 'primary',
                              minimal: false,
                              onClick: () => model.savePublishEditAsync()
                          })
                      ]
                  })
                : null
        });
    }
});

//------------------
// View bar
//------------------
/**
 * The view bar, over the content for a writer: the views as tabs, Layout, Map, JSON and, for a
 * draft, Preview, with the tools of the view shown at the right. A reader has none.
 */
const viewBar = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const {shell} = model,
            doc = shell.documentModel.document;
        if (!model.shown || doc?.access !== 'write') return null;
        return toolbar({
            className: classNames(
                'tb-viewbar',
                shell.editorView === 'preview' && 'tb-viewbar--preview'
            ),
            children: [
                tabSwitcher({model: model.viewTabsModel, className: 'xh-no-pad'}),
                filler(),
                viewTools()
            ]
        });
    }
});

/** The tools of the view shown. */
const viewTools = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const {shell, isDesigning} = model;
        switch (shell.editorView) {
            case 'canvas':
                return isDesigning ? interactionControl() : null;
            case 'json':
                return model.compareVersion != null ? compareTools() : jsonTools();
            case 'preview':
                return span({
                    className: 'tb-viewbar__note',
                    children: 'As readers see it: no design chrome, layouts locked as set'
                });
            default:
                return null;
        }
    }
});

/** Edit, where a click on the canvas selects, or Interact, where it reaches the widget. */
const interactionControl = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const {designModel} = model.shell,
            mode = designModel.interaction;
        return span({
            title: 'Edit (E): click to select. Interact (I): click to use the widgets. ` switches between them.',
            children: segmentedControl({
                value: mode,
                fill: false,
                onChange: v => designModel.setInteraction(v),
                options: [
                    {
                        value: 'edit',
                        label: 'Edit',
                        icon: arrowPointerIcon(),
                        intent: mode === 'edit' ? 'primary' : null
                    },
                    {
                        value: 'interact',
                        label: 'Interact',
                        icon: handPointerIcon(),
                        intent: mode === 'interact' ? 'warning' : null
                    }
                ]
            })
        });
    }
});

/** JSON's Revert and Apply, with why the last apply failed. */
const jsonTools = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const {applyError, isJsonDirty, isDesigning} = model;
        if (!isDesigning) return null;
        return fragment(
            applyError ? span({className: 'xh-intent-danger', children: applyError}) : null,
            button({
                text: 'Revert',
                icon: Icon.reset(),
                minimal: true,
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
        );
    }
});

/** A comparison's pickers: from a publish, to a later one or the blueprint open. */
const compareTools = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const doc = model.shell.documentModel.document,
            versions = model.shell.publishes.map(it => it.version),
            from = model.compareVersion,
            to = model.compareTo,
            openLabel = doc.kind === 'draft' ? 'This draft' : `v${doc.version}, open`;
        return fragment(
            span('Compare'),
            select({
                value: from,
                options: versions.map(it => ({value: it, label: `v${it}`})),
                width: 90,
                onChange: v => model.compareAsync(v, to === 'open' || to > v ? to : 'open')
            }),
            span('with'),
            select({
                value: to,
                options: [
                    ...versions.filter(it => it > from).map(it => ({value: it, label: `v${it}`})),
                    {value: 'open', label: openLabel}
                ],
                width: 140,
                onChange: v => model.compareAsync(from, v)
            }),
            button({
                text: 'Close',
                icon: Icon.close(),
                minimal: true,
                onClick: () => model.closeCompare()
            })
        );
    }
});

/** Why a stale draft's edits aren't saved, and the two ways on. */
const staleBand = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) => {
        const {shell} = model;
        return hbox({
            className: 'tb-staleband',
            children: [
                Icon.warning(),
                span(
                    "This draft was saved in another tab since you opened it, so your edits here aren't saved."
                ),
                filler(),
                button({
                    text: 'Reload',
                    icon: Icon.refresh(),
                    tooltip: 'Open the draft as it was saved elsewhere, discarding your edits here',
                    onClick: () => shell.reloadDraftAsync()
                }),
                button({
                    text: 'Save as new',
                    icon: Icon.copy(),
                    intent: 'primary',
                    minimal: false,
                    tooltip: 'Keep your edits here as a new blueprint',
                    onClick: () => shell.saveAsNewSelectedAsync()
                })
            ]
        });
    }
});

const inspector = hoistCmp.factory<EditorModel>({
    model: uses(EditorModel),
    render: ({model}) =>
        panel({
            model: model.inspectorPanelModel,
            className: 'tb-editor__inspector',
            title: 'Inspector',
            icon: Icon.search(),
            compactHeader: true,
            children: [
                blueprintInspector({
                    designModel: model.shell.designModel,
                    documentModel: model.shell.documentModel
                }),
                dialog({
                    isOpen: model.presetsDialogOpen,
                    onClose: () => (model.presetsDialogOpen = false),
                    title: 'Make a preset group',
                    icon: Icon.bookmark(),
                    style: {width: 480, height: 420},
                    children: presetsEditor({designModel: model.shell.designModel})
                })
            ]
        })
});

function emptyText({shell}: EditorModel): string {
    const error = shell.openIssues.find(it => it.severity === 'error');
    if (error) return error.message;
    return shell.selected
        ? 'This blueprint is empty. Ask the Architect to build it.'
        : 'Pick a blueprint, or start a new one.';
}
