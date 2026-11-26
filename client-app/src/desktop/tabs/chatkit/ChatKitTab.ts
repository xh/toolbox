import type {TabConfig, TabContainerConfig, TabSwitcherConfig} from '@xh/hoist/cmp/tab';
import type {ElementFactory, HoistRoute} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {CHAT_KIT_GROUPS, CHAT_KIT_PAGES} from './ChatKitCatalog';
import './ChatKitTab.scss';
import {chatPanelPanel} from './components/ChatPanelPanel';
import {composerPanel} from './components/ComposerPanel';
import {emptyStatePanel} from './components/EmptyStatePanel';
import {feedbackPanel} from './components/FeedbackPanel';
import {markdownPanel} from './components/MarkdownPanel';
import {messageListPanel} from './components/MessageListPanel';
import {sourcesPanel} from './components/SourcesPanel';
import {statusPanel} from './components/StatusPanel';
import {themingPanel} from './components/ThemingPanel';
import {approvalPanel} from './conversations/approvalDemo';
import {attachmentsPanel} from './conversations/attachmentsDemo';
import {errorsPanel} from './conversations/errorsDemo';
import {genUiPanel} from './conversations/genUiDemo';
import {interruptsPanel} from './conversations/interruptsDemo';
import {reasoningPanel} from './conversations/reasoningDemo';
import {richContentPanel} from './conversations/richContentDemo';
import {timelinePanel} from './conversations/timelineDemo';
import {liveModelPanel} from './integrations/LiveModelPanel';
import {workspacePanel} from './integrations/WorkspacePanel';
import {overviewPanel} from './OverviewPanel';

/** The page components, by catalog id. Every catalog page needs an entry here. */
const PAGE_CONTENT: Record<string, ElementFactory> = {
    overview: overviewPanel,
    chatPanel: chatPanelPanel,
    composer: composerPanel,
    messageList: messageListPanel,
    markdown: markdownPanel,
    sources: sourcesPanel,
    emptyState: emptyStatePanel,
    feedback: feedbackPanel,
    status: statusPanel,
    theming: themingPanel,
    richContent: richContentPanel,
    reasoning: reasoningPanel,
    timeline: timelinePanel,
    approval: approvalPanel,
    interrupts: interruptsPanel,
    attachments: attachmentsPanel,
    errors: errorsPanel,
    genUi: genUiPanel,
    workspace: workspacePanel,
    liveModel: liveModelPanel
};

/** The top-level Chat Kit tab for the desktop app, with one page per catalog entry. */
export function chatKitTab(switcher: TabSwitcherConfig): TabConfig {
    const content: TabContainerConfig = {
        switcher: {
            ...switcher,
            groups: CHAT_KIT_GROUPS.map(({key, title}) => ({key, title}))
        },
        tabs: CHAT_KIT_PAGES.map(page => {
            const content = PAGE_CONTENT[page.id];
            if (!content) throw new Error(`No content for Chat Kit page ${page.id}`);
            return {id: page.id, title: page.title, group: page.group, content};
        })
    };
    return {id: 'chatkit', title: 'Chat Kit', icon: Icon.ai(), content};
}

/** The routes of the Chat Kit tab's pages. The workspace page holds its thread in a param. */
export function chatKitRoutes(): HoistRoute {
    return {
        name: 'chatkit',
        path: '/chatkit',
        children: CHAT_KIT_PAGES.map(({id}) => ({
            name: id,
            path: id === 'workspace' ? '/workspace?threadId' : `/${id}`
        }))
    };
}
