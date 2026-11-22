import {badge} from '@xh/hoist/cmp/badge';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {segmentedControl, textArea} from '@xh/hoist/desktop/cmp/input';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {blueprintMenu} from '../BlueprintMenu';
import {DocumentBarModel} from './DocumentBarModel';

/**
 * The open blueprint's bar: the way back to the library, the quick switcher, its status, undo and
 * redo, its issues, Design and Run, and Publish or the actions a publish allows.
 */
export const documentBar = hoistCmp.factory({
    displayName: 'DocumentBar',
    model: creates(DocumentBarModel),

    render({model}) {
        const {shell, status} = model,
            {documentModel, blueprintModel, canEdit} = shell,
            doc = documentModel.document,
            shown = !!blueprintModel.blueprint && !shell.openIssues.some(isError),
            isPublish = doc?.kind === 'publish',
            stale = documentModel.isStale;
        return toolbar({
            className: 'tb-docbar',
            items: [
                button({
                    text: 'Library',
                    icon: Icon.chevronLeft(),
                    minimal: true,
                    onClick: () => shell.showLibraryAsync()
                }),
                toolbarSep(),
                quickSwitcher(),
                ...(shown && status
                    ? [
                          span({
                              className: 'tb-docbar__status',
                              title: stale
                                  ? 'Saved elsewhere since you opened it, so your edits here are not saved. Reload to take the saved draft, or Save as new to keep yours.'
                                  : null,
                              item: badge({
                                  intent: status.intent,
                                  icon: status.locked ? Icon.lock() : null,
                                  item: status.text
                              })
                          }),
                          ...(stale ? staleActions(model) : []),
                          ...(canEdit && !stale ? undoRedo(model) : []),
                          issuesChip(),
                          filler(),
                          segmentedControl({
                              value: shell.editorView,
                              onChange: v => (shell.editorView = v),
                              compact: true,
                              options: [
                                  {value: 'canvas', label: 'Canvas', icon: Icon.gridLarge()},
                                  {value: 'json', label: 'JSON', icon: Icon.code()}
                              ]
                          }),
                          toolbarSep({omit: !canEdit}),
                          segmentedControl({
                              omit: !canEdit,
                              value: blueprintModel.mode,
                              onChange: mode => blueprintModel.setMode(mode),
                              compact: true,
                              options: [
                                  {value: 'design', label: 'Design', icon: Icon.edit()},
                                  {value: 'run', label: 'Run', icon: Icon.play()}
                              ]
                          }),
                          publishButton({
                              omit: !canEdit || !documentModel.canPublish || stale
                          }),
                          button({
                              text: 'Back to draft',
                              icon: Icon.edit(),
                              omit: !isPublish || doc.access !== 'write',
                              onClick: () => shell.openVersionAsync('draft')
                          }),
                          button({
                              text: 'Make a copy',
                              icon: Icon.copy(),
                              omit: !isPublish,
                              onClick: () => shell.copySelectedAsync()
                          }),
                          blueprintMenu()
                      ]
                    : [filler()])
            ]
        });
    }
});

/** The document's name, opening a searchable list of recent and all blueprints. */
const quickSwitcher = hoistCmp.factory<DocumentBarModel>({
    model: uses(DocumentBarModel),
    render: ({model}) =>
        popover({
            isOpen: model.switcherOpen,
            onInteraction: open => (model.switcherOpen = open),
            position: 'bottom-left',
            item: button({
                className: 'tb-docbar__name',
                text: model.shell.selected?.name ?? 'No blueprint',
                rightIcon: Icon.chevronDown(),
                minimal: true,
                tooltip: 'Switch blueprint'
            }),
            content: vbox({
                className: 'tb-docbar__switcher',
                items: [
                    storeFilterField({
                        gridModel: model.switcherGridModel,
                        includeFields: ['name', 'owner'],
                        placeholder: 'Switch blueprint...',
                        autoFocus: true,
                        width: null,
                        flex: 'none'
                    }),
                    grid({
                        model: model.switcherGridModel,
                        flex: 1,
                        agOptions: {
                            onCellKeyDown: e => {
                                const {key} = e.event as KeyboardEvent;
                                if (key === 'Enter' && e.data && !e.node.group)
                                    model.switchTo(e.data.id);
                            }
                        }
                    }),
                    button({
                        text: 'Open Library',
                        icon: Icon.layout(),
                        minimal: true,
                        onClick: () => model.openLibrary()
                    })
                ]
            })
        })
});

function staleActions(model: DocumentBarModel) {
    const {shell} = model;
    return [
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
    ];
}

function undoRedo(model: DocumentBarModel) {
    const {blueprintModel, chatModel} = model.shell,
        busy = chatModel?.isBusy,
        canUndo = blueprintModel.canUndo && !busy,
        canRedo = blueprintModel.canRedo && !busy;
    return [
        button({
            icon: Icon.undo(),
            minimal: true,
            disabled: !canUndo,
            tooltip: busy
                ? 'Undo waits for the Architect to finish'
                : canUndo
                  ? `Undo: ${blueprintModel.undoDescription ?? 'Edit'}`
                  : 'Nothing to undo',
            onClick: () => model.undo()
        }),
        button({
            icon: Icon.redo(),
            minimal: true,
            disabled: !canRedo,
            tooltip: canRedo
                ? `Redo: ${blueprintModel.redoDescription ?? 'Edit'}`
                : 'Nothing to redo',
            onClick: () => model.redo()
        })
    ];
}

/** A count of the blueprint's errors or warnings, opening the list. Each selects its target. */
const issuesChip = hoistCmp.factory<DocumentBarModel>({
    model: uses(DocumentBarModel),
    render: ({model}) => {
        const {issues, errorCount} = model;
        if (!issues.length) return null;
        const warnings = issues.length - errorCount,
            text = errorCount ? plural(errorCount, 'error') : plural(warnings, 'warning');
        return popover({
            position: 'bottom-left',
            item: button({
                className: 'tb-docbar__issues',
                text,
                icon: Icon.warning(),
                intent: errorCount ? 'danger' : 'warning',
                minimal: true,
                tooltip: 'Show issues'
            }),
            content: menu({
                className: 'tb-docbar__issue-list',
                items: issues.map((issue, idx) =>
                    menuItem({
                        key: idx,
                        icon: issue.severity === 'error' ? Icon.error() : Icon.warning(),
                        intent: issue.severity === 'error' ? 'danger' : 'warning',
                        text: issue.message,
                        multiline: true,
                        onClick: () => model.shell.designModel.revealIssue(issue)
                    })
                )
            })
        });
    }
});

/** Publish, opening a popover with what changed since the last publish, a note and warnings. */
const publishButton = hoistCmp.factory<DocumentBarModel>({
    model: uses(DocumentBarModel),
    render: ({model}) => {
        const {errorCount} = model;
        return popover({
            isOpen: model.publishOpen,
            onInteraction: open => {
                if (!open) model.publishOpen = false;
            },
            position: 'bottom-right',
            item: button({
                text: 'Publish',
                icon: Icon.upload(),
                intent: 'primary',
                minimal: false,
                disabled: errorCount > 0,
                tooltip: errorCount ? `Fix ${plural(errorCount, 'error')} to publish` : null,
                onClick: () => model.openPublishAsync()
            }),
            content: publishPanel()
        });
    }
});

const publishPanel = hoistCmp.factory<DocumentBarModel>({
    model: uses(DocumentBarModel),
    render: ({model}) => {
        const {changes, nextVersion, shell} = model,
            last = nextVersion - 1,
            warnings = model.issues.filter(it => it.severity === 'warning');
        return vbox({
            className: 'tb-docbar__publish',
            items: [
                div({className: 'tb-docbar__publish-title', item: `Publish v${nextVersion}`}),
                div({
                    className: 'tb-docbar__publish-changes',
                    item: changesText(changes, last)
                }),
                textArea({
                    bind: 'note',
                    placeholder: 'Note for readers (optional)',
                    width: null,
                    height: 56
                }),
                warnings.length
                    ? div({
                          className: 'tb-docbar__publish-warning xh-intent-warning',
                          items: [
                              Icon.warning(),
                              span(
                                  `${plural(warnings.length, 'warning')}: ${warnings[0].message}${warnings.length > 1 ? ` And ${warnings.length - 1} more.` : ''} Publish anyway, or fix ${warnings.length > 1 ? 'them' : 'it'} first.`
                              )
                          ]
                      })
                    : null,
                div({
                    className: 'tb-docbar__publish-readers',
                    item: shell.selected?.publishedVersion
                        ? 'Readers move to this version when they next open it.'
                        : 'Readers you share with see published versions only.'
                }),
                hbox({
                    className: 'tb-docbar__publish-buttons',
                    items: [
                        filler(),
                        button({text: 'Cancel', onClick: () => (model.publishOpen = false)}),
                        button({
                            text: `Publish v${nextVersion}`,
                            icon: Icon.upload(),
                            intent: 'primary',
                            minimal: false,
                            disabled: changes == null || (last > 0 && !changes.length),
                            tooltip:
                                last > 0 && changes?.length === 0
                                    ? `No changes since v${last}`
                                    : null,
                            onClick: () => model.publishAsync()
                        })
                    ]
                })
            ]
        });
    }
});

function changesText(lines: string[], last: number): string {
    if (lines == null) return 'Reading what changed...';
    const changes = lines.map(it => it[0].toLowerCase() + it.slice(1));
    if (!last) return changes.length ? `First publish: ${changes.join(', ')}.` : 'First publish.';
    return changes.length
        ? `Changes since v${last}: ${changes.join(', ')}.`
        : `No changes since v${last}.`;
}

function plural(n: number, noun: string): string {
    return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

function isError(issue: {severity: string}): boolean {
    return issue.severity === 'error';
}
