import {chip} from '@xh/hoist/cmp/chip';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {spinner} from '@xh/hoist/cmp/spinner';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import {button, buttonGroup} from '@xh/hoist/desktop/cmp/button';
import {textArea} from '@xh/hoist/desktop/cmp/input';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {useEffect} from 'react';
import type {ReactNode} from 'react';
import {blueprintMenu} from '../BlueprintMenu';
import {DocumentBarModel} from './DocumentBarModel';
import type {DocumentStatus} from './documentStatus';
import {plural} from './publishState';

/**
 * The open blueprint's bar. On the left, the document: Library, the quick switcher, its status and,
 * for a writer's draft, undo and redo. On the right, publishing: issues, the live version, Publish,
 * More, Expand and Fill. A publish open offers its restore, the draft and a copy instead, and a
 * reader's version offers a copy. A writer's draft keeps each item in its place in every view.
 */
export const documentBar = hoistCmp.factory({
    displayName: 'DocumentBar',
    model: creates(DocumentBarModel),

    render({model}) {
        const {shell, status} = model,
            {documentModel, blueprintModel, canEdit} = shell,
            doc = documentModel.document,
            shown = !!blueprintModel.blueprint && !shell.openIssues.some(isError),
            stale = documentModel.isStale;
        let items: ReactNode[] = [filler()];
        if (shown && status) {
            if (canEdit) {
                items = [
                    statusChip(),
                    ...(stale ? [] : [toolbarSep(), undoRedo(model)]),
                    filler(),
                    ...(stale
                        ? []
                        : [
                              issuesChip(),
                              liveLine(),
                              publishButton({omit: !documentModel.canPublish})
                          ])
                ];
            } else if (doc.access === 'write') {
                items = [
                    statusChip(),
                    filler(),
                    button({
                        text: `Restore v${doc.version}`,
                        tooltip: 'Bring this version into the draft',
                        icon: Icon.reset(),
                        onClick: () => shell.restoreVersionAsync(doc.version)
                    }),
                    button({
                        text: 'Back to draft',
                        icon: Icon.edit(),
                        intent: 'primary',
                        minimal: false,
                        onClick: () => shell.openVersionAsync('draft')
                    }),
                    copyButton()
                ];
            } else {
                items = [
                    readerChip(),
                    filler(),
                    button({
                        text: 'Back to the blueprint',
                        icon: Icon.chevronLeft(),
                        omit: shell.editorView === 'canvas',
                        onClick: () => (shell.editorView = 'canvas')
                    }),
                    copyButton()
                ];
            }
            items = [...items, blueprintMenu(), toolbarSep(), maximizeButtons()];
        }
        return toolbar({
            className: 'tb-docbar',
            children: [
                button({
                    text: 'Library',
                    icon: Icon.chevronLeft(),
                    minimal: true,
                    onClick: () => shell.showLibraryAsync()
                }),
                toolbarSep(),
                quickSwitcher(),
                ...items
            ]
        });
    }
});

/** The status: the version, with a check when saved, a spinner while saving, or its state in words. */
const statusChip = hoistCmp.factory<DocumentBarModel>({
    model: uses(DocumentBarModel),
    render: ({model}) => {
        const {status, shell} = model;
        return span({
            className: 'tb-docbar__status',
            title: shell.documentModel.isStale
                ? 'Saved elsewhere since you opened it, so your edits here are not saved.'
                : status.tooltip,
            children: chip({
                intent: status.intent,
                size: 'compact',
                round: true,
                minimal: true,
                icon: status.locked ? Icon.lock() : null,
                rightIcon: saveIcon(status.saveState),
                children: status.text
            })
        });
    }
});

/** A reader's version: neutral, as it is only read. */
const readerChip = hoistCmp.factory<DocumentBarModel>({
    model: uses(DocumentBarModel),
    render: ({model}) =>
        span({
            className: 'tb-docbar__status',
            title: 'The published version you read',
            children: chip({
                size: 'compact',
                round: true,
                outlined: true,
                children: `v${model.shell.documentModel.document.version} · published`
            })
        })
});

/** The live version, and how many changes the draft holds since it. A click opens History. */
const liveLine = hoistCmp.factory<DocumentBarModel>({
    model: uses(DocumentBarModel),
    render: ({model}) => {
        const doc = model.shell.documentModel.document,
            count = model.changeCount,
            text = !doc.publishedVersion
                ? 'Not published yet'
                : `v${doc.publishedVersion} live${count ? ` · ${plural(count, 'change')}` : ''}`;
        return div({
            className: 'tb-docbar__live',
            title: 'Show History',
            onClick: () => model.openHistory(),
            children: [
                count ? span({className: 'tb-docbar__live-dot'}) : null,
                span({className: 'tb-docbar__live-text', children: text})
            ]
        });
    }
});

const copyButton = hoistCmp.factory<DocumentBarModel>({
    model: uses(DocumentBarModel),
    render: ({model}) =>
        button({
            text: 'Make a copy',
            icon: Icon.copy(),
            onClick: () => model.shell.copySelectedAsync()
        })
});

/**
 * Expand and Fill, which give the editor more room. Clicking the one on restores. While the editor
 * is maximized, the page's root carries a class that hides the tab's left nav, and Esc restores it
 * when nothing is selected.
 */
const maximizeButtons = hoistCmp.factory<DocumentBarModel>({
    model: uses(DocumentBarModel),
    render: ({model}) => {
        const {shell} = model,
            {maximize} = shell,
            set = (v: typeof maximize) => (shell.maximize = maximize === v ? 'off' : v);
        useEffect(() => {
            if (maximize === 'off') return;
            const onKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && !e.defaultPrevented && !shell.designModel.selection) {
                    shell.maximize = 'off';
                }
            };
            window.addEventListener('keydown', onKeyDown);
            return () => window.removeEventListener('keydown', onKeyDown);
        }, [maximize, shell]);
        return hbox({
            className: 'tb-docbar__maximize',
            children: [
                button({
                    icon: Icon.arrowsLeftRight(),
                    minimal: true,
                    active: maximize === 'expand',
                    tooltip: maximize === 'expand' ? 'Restore (Esc)' : 'Expand: hide the left nav',
                    onClick: () => set('expand')
                }),
                button({
                    icon: Icon.expand(),
                    minimal: true,
                    active: maximize === 'fill',
                    tooltip:
                        maximize === 'fill'
                            ? 'Restore (Esc)'
                            : 'Fill: also hide the page bar, for the whole area under the app bar',
                    onClick: () => set('fill')
                })
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
            children: button({
                className: 'tb-docbar__name',
                text: model.shell.selected?.name ?? 'No blueprint',
                rightIcon: Icon.chevronDown(),
                minimal: true,
                tooltip: 'Switch blueprint'
            }),
            content: vbox({
                className: 'tb-docbar__switcher',
                children: [
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

// The saved check and the saving spinner take the same slot, so the chip keeps its width.
function saveIcon(state: DocumentStatus['saveState']) {
    switch (state) {
        case 'saved':
            return Icon.check();
        case 'saving':
            return spinner({compact: true});
        default:
            return null;
    }
}

// Undo and Redo, as one pair.
function undoRedo(model: DocumentBarModel) {
    const {blueprintModel, chatModel} = model.shell,
        busy = chatModel?.isBusy,
        canUndo = blueprintModel.canUndo && !busy,
        canRedo = blueprintModel.canRedo && !busy;
    return buttonGroup(
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
    );
}

/** A count of the blueprint's errors, or else its warnings, opening the list. Each selects its target. */
const issuesChip = hoistCmp.factory<DocumentBarModel>({
    model: uses(DocumentBarModel),
    render: ({model}) => {
        const {issues, errorCount} = model;
        if (!issues.length) return div({className: 'tb-docbar__issues'});
        const warnings = issues.length - errorCount,
            text = errorCount ? plural(errorCount, 'error') : plural(warnings, 'warning');
        return popover({
            className: 'tb-docbar__issues',
            position: 'bottom-right',
            children: span({
                title: `${text}: show them`,
                children: chip({
                    intent: errorCount ? 'danger' : 'warning',
                    size: 'compact',
                    round: true,
                    minimal: true,
                    icon: Icon.warning(),
                    onClick: () => {},
                    children: String(errorCount || warnings)
                })
            }),
            content: menu({
                className: 'tb-docbar__issue-list',
                children: issues.map((issue, idx) =>
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
        const {disabled, tooltip} = model.publishState;
        return popover({
            isOpen: model.publishOpen,
            onInteraction: open => {
                if (!open) model.publishOpen = false;
            },
            position: 'bottom-right',
            children: button({
                text: 'Publish',
                icon: Icon.upload(),
                intent: 'primary',
                minimal: false,
                disabled,
                tooltip,
                onClick: () => model.openPublish()
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
            {finish, warning} = model.publishState;
        return vbox({
            className: 'tb-docbar__publish',
            children: [
                div({className: 'tb-docbar__publish-title', children: `Publish v${nextVersion}`}),
                div({
                    className: 'tb-docbar__publish-changes',
                    children: changesText(changes, last)
                }),
                textArea({
                    bind: 'note',
                    placeholder: 'Note for readers (optional)',
                    width: null,
                    height: 56
                }),
                finish
                    ? div({
                          className: 'tb-docbar__publish-warning xh-intent-danger',
                          children: [
                              Icon.warning(),
                              vbox({
                                  children: [
                                      span(finish.text),
                                      ...finish.messages.map((it, idx) =>
                                          span({key: idx, children: it})
                                      )
                                  ]
                              })
                          ]
                      })
                    : warning
                      ? div({
                            className: 'tb-docbar__publish-warning xh-intent-warning',
                            children: [Icon.warning(), span(warning)]
                        })
                      : null,
                div({
                    className: 'tb-docbar__publish-readers',
                    children: shell.selected?.publishedVersion
                        ? 'Readers move to this version when they next open it.'
                        : 'Readers you share with see published versions only.'
                }),
                hbox({
                    className: 'tb-docbar__publish-buttons',
                    children: [
                        filler(),
                        button({text: 'Cancel', onClick: () => (model.publishOpen = false)}),
                        button({
                            text: `Publish v${nextVersion}`,
                            icon: Icon.upload(),
                            intent: 'primary',
                            minimal: false,
                            disabled: !!finish || changes == null || (last > 0 && !changes.length),
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

function isError(issue: {severity: string}): boolean {
    return issue.severity === 'error';
}
