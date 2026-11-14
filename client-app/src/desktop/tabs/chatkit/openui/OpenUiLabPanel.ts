import type {ChatSuggestion} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {chatClearButton, chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {hframe, placeholder} from '@xh/hoist/cmp/layout';
import type {HoistProps} from '@xh/hoist/core';
import {creates, hoistCmp, uses, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import type {ToolboxLinkProps} from '../../../../core/cmp/ToolboxLink';
import {wrapper, wrapperAction} from '../../../common/Wrapper';
import {chatKitPage} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import {openUiInspector} from './OpenUiInspector';
import './OpenUiLab.scss';
import type {OpenUiLabSource} from './OpenUiLabModel';
import {OpenUiLabModel} from './OpenUiLabModel';
import {OPEN_UI_REPLAY_SUGGESTIONS} from './OpenUiReplay';

/**
 * The live page of the OpenUI Lab: Claude answers in OpenUI Lang, and the kit renders each
 * program with the Hoist components of the lab's catalog. An inspector beside the chat shows the
 * prompt the model received, and each program of the latest reply with what became of it.
 */
export const openUiLivePanel = hoistCmp.factory({
    displayName: 'OpenUiLivePanel',
    model: creates(() => new OpenUiLabModel('live')),
    render: () => openUiLabPage()
});

/**
 * The replay page of the OpenUI Lab: the same chat, catalog, data tools and inspector, fed by
 * scripted replies in place of a model. It needs no role, no API key and no model call.
 */
export const openUiReplayPanel = hoistCmp.factory({
    displayName: 'OpenUiReplayPanel',
    model: creates(() => new OpenUiLabModel('replay')),
    render: () => openUiLabPage()
});

//------------------
// Implementation
//------------------
/** What differs between the lab's pages. */
interface OpenUiLabPageSpec {
    /** Id of the page in the Chat Kit catalog, which supplies the title and icon. */
    pageId: string;
    description: string[];
    emptyState: {icon: null; title: string; text: string};
    suggestions: ChatSuggestion[];
    placeholder: string;
    assistantName: string;
    /** True for a page that calls the server relay, which needs the `TOOLBOX_LLM_USER` role. */
    needsLlmRole: boolean;
}

const openUiLabPage = hoistCmp.factory<HoistProps<OpenUiLabModel>>({
    displayName: 'OpenUiLabPage',
    model: uses(OpenUiLabModel),

    render({model}) {
        const {chatModel, source} = model,
            spec = PAGE_SPECS[source],
            page = chatKitPage(spec.pageId),
            title = page.title,
            icon = page.icon(),
            hasAccess = !spec.needsLlmRole || XH.getUser().hasRole('TOOLBOX_LLM_USER');

        return wrapper({
            title,
            icon,
            description: spec.description,
            links: LINKS,
            options: hasAccess
                ? [
                      wrapperAction({
                          icon: Icon.reset(),
                          text: 'Clear conversation',
                          intent: 'danger',
                          disabled: chatModel.isEmpty,
                          onClick: () => chatModel.clear()
                      })
                  ]
                : null,
            item: hasAccess
                ? hframe({
                      className: 'tb-openui-lab',
                      items: [
                          chatPanel({
                              model: chatModel,
                              className: 'tb-chatkit-demo',
                              testId: `chatkit-${spec.pageId}`,
                              flex: 1,
                              minWidth: 380,
                              title,
                              icon,
                              compactHeader: true,
                              headerItems: [chatClearButton({chatModel})],
                              emptyStateProps: spec.emptyState,
                              suggestions: spec.suggestions,
                              composerProps: {placeholder: spec.placeholder},
                              messageListProps: {assistantName: spec.assistantName}
                          }),
                          openUiInspector()
                      ]
                  })
                : placeholder(Icon.lock(), NO_ACCESS_MSG)
        });
    }
});

const LINKS: ToolboxLinkProps[] = [
    {
        url: '$CK/genui/openui/README.md',
        text: 'OpenUI Lang format',
        notes: 'The format, its prompt and the parts of the language the kit runs.'
    },
    KIT_LINKS.genui,
    KIT_LINKS.genuiCmps,
    tabSourceLink('openui/OpenUiLabCatalog.ts', 'The catalog: one line per component.'),
    tabSourceLink('openui/OpenUiLabTools.ts', 'The data tools.'),
    tabSourceLink('openui/OpenUiLabPanel.ts', 'The pages of the lab.')
];

const NO_ACCESS_MSG =
    'The AI assistant is not enabled for your account. Contact XH to request access.';

const CATALOG_SNIPPET = [
    '```ts',
    'new ChatUiCatalog({',
    '  components: [chatUiStackSpec(), ...],',
    "  textFormats: [openUiLangFormat({root: 'stack', bindings: true, queryTools})],",
    "  modes: ['openui']",
    '})',
    '```'
];

const PAGE_SPECS: Record<OpenUiLabSource, OpenUiLabPageSpec> = {
    live: {
        pageId: 'openUiLive',
        needsLlmRole: true,
        assistantName: 'Claude',
        placeholder: 'Ask for a view of the portfolio...',
        description: [
            'A live model writes UI in **OpenUI Lang**, the streaming UI language of Thesys',
            'OpenUI, and the kit renders each program with Hoist components. The lab has no',
            'OpenUI components: its catalog holds only the layout, text, metrics, grid, chart,',
            'treemap, card and form components of the kit.',
            '',
            ...CATALOG_SNIPPET,
            '',
            'The model gets no UI tools. It writes a program in its reply text, and each statement',
            'renders as soon as it completes. Its data tools read the sample portfolio of Toolbox,',
            'and keep their rows in the browser as artifacts, which a `DataGrid` or `DataChart`',
            'shows by id.',
            '',
            'A program runs with state. An input can bind a `$variable`, an expression can read',
            'it, and a `Query()` can read the data tools again when it changes, with no new reply.',
            'A program cannot change data.',
            '',
            'The inspector shows each program of the latest reply beside what became of it, the',
            'tool calls that programs made, and the prompt the model received.',
            '',
            'Access needs the `TOOLBOX_LLM_USER` role. Each model call counts toward the hourly',
            'limit of the server relay, and a reply that calls tools makes several.'
        ],
        emptyState: {
            icon: null,
            title: 'Ask for a UI',
            text:
                'Claude answers in OpenUI Lang, drawn with Hoist components. It can read the ' +
                'sample portfolio: positions, trades and daily prices. Watch each program in ' +
                'the inspector.'
        },
        suggestions: [
            {
                text: 'Brief me on the portfolio: headline totals, P&L by sector as a chart, and the five worst symbols.',
                icon: Icon.portfolio()
            },
            {
                text: 'Let me explore P&L by region for a sector I pick, with the sector and the sort as inputs.',
                icon: Icon.filter()
            },
            {
                text: 'Compare the funds side by side, with a card per fund and a follow-up action on each.',
                icon: Icon.fund()
            },
            {
                text: 'Chart the last 90 days of closing prices for our most profitable symbol, with its key stats.',
                icon: Icon.chartLine()
            },
            {
                text: 'Which traders lose money in which regions? Show it so I can spot the pattern.',
                icon: Icon.users()
            },
            {
                text: 'Show the 200 most recent Technology trades, and tell me what stands out.',
                icon: Icon.transaction()
            },
            {
                text: 'Give me an order ticket form for a new trade, and book it when I submit.',
                icon: Icon.edit()
            }
        ]
    },
    replay: {
        pageId: 'openUiReplay',
        needsLlmRole: false,
        assistantName: 'Replay',
        placeholder: 'Paste a reply that holds OpenUI Lang, to replay it...',
        description: [
            'The lab with no model. A script streams each reply through the same catalog, text',
            'format, data tools and inspector as the live page. Use it to check a program again',
            'and again, at no cost and with no role.',
            '',
            'Each suggestion runs a scripted reply. Some call the data tools first, as a model',
            'would, so their programs show real rows. Others cover each display component, nested',
            'layouts, edge cases and text that needs escaping. The interactive ones bind inputs to',
            '`$variables`, read data with `Query()`, send a form, and run button actions. The',
            'last makes slips a model can make, and the inspector reports each one.',
            '',
            'Any other message is streamed back as the reply itself. Paste what a live model',
            'wrote, in a fenced `openui-lang` block or as a bare program, to watch it render.'
        ],
        emptyState: {
            icon: null,
            title: 'Replay a program',
            text:
                'Pick a scripted reply, or paste any text that holds OpenUI Lang. It streams as ' +
                'a reply would, and renders with Hoist components.'
        },
        suggestions: OPEN_UI_REPLAY_SUGGESTIONS
    }
};
