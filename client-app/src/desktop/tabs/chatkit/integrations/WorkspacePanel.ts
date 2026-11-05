import type {ChatDocumentRequest, ChatSidePanelModel} from '@xh/hoist-chat-kit/core';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import {chatMarkdown} from '@xh/hoist-chat-kit/cmp/markdown';
import {chatScopeChip} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {chatWorkspace, ChatWorkspaceModel} from '@xh/hoist-chat-kit/desktop/cmp/workspace';
import {ChatThreadsModel} from '@xh/hoist-chat-kit/threads';
import {ScriptedChatTransport} from '@xh/hoist-chat-kit/transport';
import {div, frame, li, span, ul} from '@xh/hoist/cmp/layout';
import type {HoistProps, LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {copyToClipboard} from '@xh/hoist/utils/js';
import classNames from 'classnames';
import {useEffect, useRef} from 'react';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {chatKitPage} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import {LocalThreadStore} from './LocalThreadStore';
import {
    ALL_SOURCE_IDS,
    createReply,
    createSeedThreads,
    DOCUMENTS,
    SOURCE_OPTIONS,
    SUGGESTIONS,
    TOOLS
} from './WorkspaceData';
import './WorkspacePanel.scss';

/**
 * A full-page chat over a thread store, with no server: a `ChatWorkspace` over a
 * `ChatThreadsModel`, whose `ChatThreadStore` keeps the threads in local storage and whose chats
 * get scripted replies.
 */
export const workspacePanel = hoistCmp.factory({
    displayName: 'WorkspacePanel',
    model: creates(() => WorkspacePanelModel),

    render({model}) {
        const page = chatKitPage('workspace'),
            {workspaceModel, threadsModel} = model;

        return wrapper({
            title: page.title,
            icon: page.icon(),
            description: [
                'The thread layer turns a chat into a list of conversations that a backend',
                'stores. The app implements a `ChatThreadStore` against its backend: list the',
                'threads, load one, and optionally rename, delete and take feedback. A',
                '`ChatThreadsModel` does the rest.',
                '',
                'It opens one `ChatModel` per open thread. Start the stress test, then switch',
                'chats: the turn runs on in the background, the sidebar shows a spinner, and then',
                'a dot for the new reply. Search runs through the store. Rename and delete show at',
                'once, and roll back with a toast if the store fails. The selected thread sits in',
                'the URL as `?threadId`, so a deep link opens it.',
                '',
                '`ChatWorkspace` lays it out by its own width: the sidebar, the conversation, a',
                'header and notice, and a side panel. A cited document opens there, in the',
                "app's own viewer. Narrow the window, or collapse this rail, to see the sidebar",
                'turn to a rail and back.',
                '',
                'This store keeps its threads in local storage, so they survive a reload.',
                '',
                '**Kit API:** `ChatThreadsModel`, `ChatThreadStore`, `ChatWorkspaceModel`,',
                '`chatWorkspace`, `documentRenderer`, `chatScopeChip`, `onTurnComplete`'
            ],
            links: [
                KIT_LINKS.threads,
                KIT_LINKS.workspace,
                KIT_LINKS.threadList,
                tabSourceLink('integrations/WorkspacePanel.ts'),
                tabSourceLink(
                    'integrations/LocalThreadStore.ts',
                    'The client-side ChatThreadStore.'
                ),
                tabSourceLink(
                    'integrations/WorkspaceData.ts',
                    'The seed threads, the scripted replies and the documents.'
                )
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Workspace - props',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Drives the workspace and its thread list.',
                    items: [
                        wrapperOption({
                            label: 'Show notice',
                            propName: 'ChatWorkspaceProps.notice',
                            info: 'One line of context under the header.',
                            control: switchInput({bind: 'showNotice'})
                        }),
                        wrapperOption({
                            label: 'Group by recency',
                            propName: 'ChatThreadListProps.groupByRecency',
                            info: 'Off for one plain list in the store order.',
                            control: switchInput({bind: 'groupByRecency'})
                        }),
                        wrapperOption({
                            label: 'Show time',
                            propName: 'ChatThreadListProps.showTime',
                            control: switchInput({bind: 'showTime'})
                        }),
                        wrapperOption({
                            label: 'Compact rows',
                            propName: 'ChatThreadListProps.compact',
                            info: 'One line per chat: the title, then a short time.',
                            control: switchInput({bind: 'compactRows'})
                        }),
                        wrapperOption({
                            label: 'New chat button',
                            propName: 'ChatThreadListProps.enableNewChat',
                            info: 'Off hides New Chat in the list, the rail and the header.',
                            control: switchInput({bind: 'enableNewChat'})
                        })
                    ]
                }),
                wrapperAction({
                    icon: Icon.add(),
                    text: 'New chat',
                    intent: 'primary',
                    onClick: () => threadsModel.newThread()
                }),
                wrapperAction({
                    icon: Icon.reset(),
                    text: 'Reset sample threads',
                    intent: 'danger',
                    onClick: () => model.resetAsync()
                })
            ],
            item: frame({
                className: 'tb-chatkit-workspace',
                item: chatWorkspace({
                    model: workspaceModel,
                    testId: 'chatkit-workspace',
                    notice: model.showNotice
                        ? 'Sample data. Replies are scripted in the browser, and chats are saved in local storage.'
                        : null,
                    headerItems: [
                        button({
                            icon: Icon.link(),
                            tooltip: 'Copy a link to this chat',
                            onClick: () => model.copyLinkAsync()
                        }),
                        button({
                            icon: Icon.book(),
                            tooltip: 'Source library',
                            active: workspaceModel.isSidePanelOpen,
                            onClick: () => workspaceModel.toggleSidePanel()
                        })
                    ],
                    sidePanel: () => sourceLibrary(),
                    sidePanelProps: {title: 'Source library', icon: Icon.book()},
                    threadListProps: {
                        threadNoun: 'chat',
                        showTime: model.showTime,
                        groupByRecency: model.groupByRecency,
                        compact: model.compactRows,
                        enableNewChat: model.enableNewChat,
                        enableCopyId: true
                    },
                    chatPanelProps: {
                        emptyStateProps: {
                            title: 'Ask the research assistant',
                            text: 'Each prompt below gets its own scripted reply. Start the stress test, then switch to another chat while it runs.'
                        },
                        suggestions: SUGGESTIONS,
                        citationMarkers: true,
                        messageListProps: {assistantName: 'Research Assistant'},
                        composerProps: {
                            placeholder: 'Ask about the portfolio...',
                            leftItems: chatScopeChip({
                                options: SOURCE_OPTIONS,
                                noun: 'source',
                                icon: Icon.database(),
                                runOption: 'sourceIds'
                            })
                        }
                    }
                })
            })
        });
    }
});

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class WorkspacePanelModel extends HoistModel {
    readonly store = new LocalThreadStore({
        storageKey: 'chatKitWorkspace.threads',
        seed: createSeedThreads
    });

    /** One transport for every chat. Each request carries its own thread and run. */
    readonly transport = new ScriptedChatTransport({delayMs: 20, respond: createReply});

    @managed readonly threadsModel = new ChatThreadsModel({
        store: this.store,
        createChatModel: ({threadId}) => this.createChatModel(threadId),
        route: {name: 'default.chatkit.workspace', param: 'threadId'}
    });

    @managed readonly workspaceModel = new ChatWorkspaceModel({
        threadsModel: this.threadsModel,
        persistWith: {localStorageKey: 'chatKitWorkspace'},
        documentRenderer: (request, panel) =>
            documentViewer({
                key: request.source.metadata?.documentId ?? request.source.id,
                request,
                panel
            })
    });

    @bindable accessor showNotice = true;
    @bindable accessor groupByRecency = true;
    @bindable accessor showTime = true;
    @bindable accessor compactRows = false;
    @bindable accessor enableNewChat = true;

    override async doLoadAsync(loadSpec: LoadSpec) {
        await this.workspaceModel.loadAsync(loadSpec);
    }

    /** Start again from the seed threads, after a confirm. */
    async resetAsync() {
        const confirmed = await XH.confirm({
            title: 'Reset sample threads',
            message: 'Replace every chat on this page with the sample threads?',
            confirmProps: {text: 'Reset', intent: 'danger', outlined: true}
        });
        if (!confirmed) return;

        this.store.reset();
        this.threadsModel.newThread();
        await this.threadsModel.refreshAsync();
    }

    async copyLinkAsync() {
        await copyToClipboard(window.location.href);
        XH.toast({icon: Icon.link(), message: 'Copied a link to this chat.'});
    }

    //------------------
    // Implementation
    //------------------
    private createChatModel(threadId: string): ChatModel {
        // Save the thread as each turn ends or pauses, as a backend would store a run. Read the
        // chat's id then, not now: a new thread's id can change once, on its first run.
        const chatModel = new ChatModel({
            transport: this.transport,
            threadId,
            historyMode: 'server',
            tools: TOOLS,
            runOptions: {sourceIds: ALL_SOURCE_IDS},
            onTurnComplete: message => {
                const failed = message.status === 'error';
                this.store.saveThread({
                    id: chatModel.threadId,
                    messages: chatModel.getMessageSpecs(),
                    lastRunEnd: failed ? 'failed' : 'complete',
                    lastRunReason: failed ? (message.error ?? null) : null
                });
            },
            onTurnPause: () =>
                this.store.saveThread({
                    id: chatModel.threadId,
                    messages: chatModel.getMessageSpecs()
                })
        });
        return chatModel;
    }
}

//------------------------------------------------------------------
// Document viewer - the workspace's documentRenderer
//------------------------------------------------------------------
interface DocumentViewerProps extends HoistProps {
    request: ChatDocumentRequest;
    panel: ChatSidePanelModel;
}

/**
 * A tiny document viewer for the side panel: it "opens" a sample document, finds the cited
 * passage and highlights it, and reports each step with `panel.setDocumentStatus()`. Keyed by
 * document, so a new citation in the same document finds its passage without opening it again.
 */
const documentViewer = hoistCmp.factory<DocumentViewerProps>({
    displayName: 'WorkspaceDocumentViewer',
    model: false,

    render({request, panel}) {
        const doc = DOCUMENTS[request.source.metadata?.documentId],
            passage = request.passage,
            isOpen = useRef(false);

        useEffect(() => {
            if (!doc) {
                panel.setDocumentStatus({
                    state: 'error',
                    error: {httpStatus: 404, message: 'This demo has no copy of that document.'}
                });
                return;
            }

            const {page, pageCount} = doc,
                found = !!passage && doc.paragraphs.includes(passage),
                timers: number[] = [];
            const after = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

            if (!isOpen.current) {
                panel.setDocumentStatus({state: 'opening'});
                after(600, () => panel.setDocumentStatus({state: 'locating', page, pageCount}));
            } else {
                panel.setDocumentStatus({state: 'locating', page, pageCount});
            }
            after(isOpen.current ? 300 : 1_000, () => {
                isOpen.current = true;
                panel.setDocumentStatus(
                    found ? {state: 'located', page, pageCount} : {state: 'notLocated'}
                );
            });
            return () => timers.forEach(it => window.clearTimeout(it));
        }, [doc, passage, panel]);

        if (!doc) return null;
        return div({
            className: 'tb-chatkit-workspace__doc',
            items: [
                div({
                    className: 'tb-chatkit-workspace__doc-meta',
                    item: `${doc.fileName} - page ${doc.page} of ${doc.pageCount}`
                }),
                ...doc.paragraphs.map((text, idx) =>
                    div({
                        key: idx,
                        className: classNames(
                            'tb-chatkit-workspace__doc-para',
                            text === passage && 'tb-chatkit-workspace__doc-para--cited'
                        ),
                        item: chatMarkdown({content: text})
                    })
                )
            ]
        });
    }
});

//------------------------------------------------------------------
// Side panel content of the app's own
//------------------------------------------------------------------
/** The app's own side panel content: the sources a question can search. */
const sourceLibrary = hoistCmp.factory({
    displayName: 'WorkspaceSourceLibrary',
    model: false,

    render() {
        return div({
            className: 'tb-chatkit-workspace__library',
            items: [
                div(
                    'The sources the assistant can search. Pick some for the next question with the Sources chip in the composer.'
                ),
                ul(
                    SOURCE_OPTIONS.map(({id, name, icon}) =>
                        li({key: id, items: [icon, span(name)]})
                    )
                )
            ]
        });
    }
});
