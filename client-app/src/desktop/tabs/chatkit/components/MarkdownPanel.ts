import type {
    ChatMarkdownCitations,
    ChatMarkdownComponents,
    ChatMarkdownProps
} from '@xh/hoist-chat-kit/cmp/markdown';
import {chatMarkdown} from '@xh/hoist-chat-kit/cmp/markdown';
import {CHAT_MARKDOWN_COMPONENTS, chatCodeBlock} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {code, div, span, table, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {switchInput, textArea} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {range} from 'lodash';
import type {MouseEvent, ReactNode} from 'react';
import {
    demoFrame,
    demoGrid,
    demoPanel,
    demoPlayground,
    demoSection,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {chatKitPage} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import {markdown} from '../common/scriptUtils';
import {snippet} from '../common/snippetUtils';
import './MarkdownPanel.scss';

/**
 * The streaming markdown renderer behind every reply: a Playground over an editable document,
 * then code blocks, a long table and citation markers.
 */
export const markdownPanel = hoistCmp.factory({
    displayName: 'MarkdownPanel',
    model: creates(() => MarkdownPanelModel),

    render({model}) {
        const page = chatKitPage('markdown'),
            {isStreaming} = model;

        return wrapper({
            title: page.title,
            icon: page.icon(),
            description: [
                '`ChatMarkdown` renders the markdown a model writes, including while it streams. It',
                'splits the text into top-level blocks and memoizes each one, so only the last block',
                'renders again as text arrives. With `isStreaming` set, it closes half-written syntax',
                'in that block, so a reply never shows a stray `**` or an open code fence.',
                '',
                'Click **Stream it** to replay the document a few characters at a time.',
                '',
                'Raw HTML renders as text, and links open in a new tab. Images do not load by',
                'default: each shows as a link the user can open. Loading an image sends a request to',
                'its URL, so a reply that a prompt injection wrote could leak data in that URL. Allow',
                'only images you trust, such as those from your own server.',
                '',
                'Keep `components` and `markdownPlugins` as module-level constants. The block cache',
                'keys on them, so a new object on each render parses every block again.'
            ],
            links: [
                KIT_LINKS.markdown,
                KIT_LINKS.desktop,
                tabSourceLink('components/MarkdownPanel.ts'),
                {
                    url: '$CK/cmp/markdown/ChatMarkdown.ts',
                    notes: 'Kit component, with the full doc comments.'
                },
                {
                    url: '$CK/desktop/cmp/chat/ChatCodeBlock.ts',
                    notes: 'The code block behind fenced code in a reply.'
                }
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground only - props',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Drives the Playground markdown. The other sections set their own props.',
                    items: [
                        wrapperOption({
                            label: 'Line breaks',
                            propName: 'ChatMarkdownProps.lineBreaks',
                            info: 'Renders a single line break as a break. See the desk notes.',
                            control: switchInput({bind: 'lineBreaks'})
                        }),
                        wrapperOption({
                            label: 'Allow images',
                            propName: 'ChatMarkdownProps.allowImages',
                            info: "Allows images from this app's own /public/ path only. The image from another host stays a link.",
                            control: switchInput({bind: 'allowImages'})
                        }),
                        wrapperOption({
                            label: 'Kit components',
                            propName: 'ChatMarkdownProps.components',
                            info: span(
                                code('CHAT_MARKDOWN_COMPONENTS'),
                                ' - fenced code as a ',
                                code('ChatCodeBlock'),
                                ', as the chat renders it.'
                            ),
                            control: switchInput({bind: 'kitComponents'})
                        }),
                        wrapperOption({
                            label: 'Card tables',
                            propName: 'ChatMarkdownProps.components',
                            info: span(
                                'A ',
                                code('table'),
                                " override of the page's own, which wraps each table in a card."
                            ),
                            control: switchInput({bind: 'cardTables'})
                        }),
                        wrapperOption({
                            label: 'Intercept links',
                            propName: 'ChatMarkdownProps.onLinkClick',
                            info: 'Shows a toast in place of opening the link.',
                            control: switchInput({bind: 'interceptLinks'})
                        })
                    ]
                }),
                wrapperAction({
                    icon: isStreaming ? Icon.stop() : Icon.play(),
                    text: isStreaming ? 'Stop streaming' : 'Stream it',
                    intent: 'primary',
                    onClick: () => (isStreaming ? model.stopStreaming() : model.streamAsync())
                }),
                wrapperAction({
                    icon: Icon.reset(),
                    text: 'Reset document',
                    disabled: isStreaming || model.content === SAMPLE,
                    onClick: () => (model.content = SAMPLE)
                })
            ],
            item: demoPanel({
                className: 'tb-chatkit-markdown',
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 560,
                            caption: 'Edit the markdown below, or stream it from the rail.',
                            config: model.configSnippet,
                            value: {
                                isStreaming,
                                length: model.shownContent.length
                            },
                            item: vbox({
                                className: 'tb-chatkit-markdown__playground',
                                items: [
                                    div({
                                        className: 'tb-chatkit-markdown__output',
                                        item: chatMarkdown({
                                            content: model.shownContent,
                                            isStreaming,
                                            lineBreaks: model.lineBreaks,
                                            allowImages: model.allowImages ? ownImages : false,
                                            components: model.components,
                                            onLinkClick: model.interceptLinks
                                                ? model.onLinkClick
                                                : undefined
                                        })
                                    }),
                                    textArea({
                                        bind: 'content',
                                        disabled: isStreaming,
                                        commitOnChange: true,
                                        height: 180,
                                        width: '100%',
                                        className: 'tb-chatkit-markdown__source'
                                    })
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Code blocks',
                        note: 'chatCodeBlock - the card the chat renders for fenced code.',
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoFrame({
                                    label: 'Short',
                                    info: "language: 'typescript'",
                                    item: chatCodeBlock({
                                        content: SHORT_CODE,
                                        language: 'typescript'
                                    })
                                }),
                                demoFrame({
                                    label: 'No language',
                                    info: "No language prop - the header reads 'text'",
                                    item: chatCodeBlock({content: SHELL_CODE})
                                }),
                                demoFrame({
                                    label: 'Over 20 lines',
                                    info: 'A finished block shows its first 20 lines, with a button for the rest',
                                    item: chatCodeBlock({content: LONG_CODE, language: 'groovy'})
                                }),
                                demoFrame({
                                    label: 'Streaming',
                                    info: 'isStreaming: true - shows in full until the block ends',
                                    item: chatCodeBlock({
                                        content: LONG_CODE,
                                        language: 'groovy',
                                        isStreaming: true
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Long tables',
                        note: 'components: CHAT_MARKDOWN_COMPONENTS',
                        item: demoFrame({
                            label: `A table of ${LONG_TABLE_ROWS} rows`,
                            info: 'Over ChatKit.defaults.markdownTableMaxRows (100), a table renders as a card with Show All.',
                            item: div({
                                className: 'tb-chatkit-markdown__long-table',
                                item: chatMarkdown({
                                    content: LONG_TABLE,
                                    components: CHAT_MARKDOWN_COMPONENTS
                                })
                            })
                        })
                    }),
                    demoSection({
                        title: 'Citations',
                        note: 'citations: {sources} - "[1]" and "[2, 3]" in the text become buttons.',
                        item: demoFrame({
                            label: 'Three sources',
                            info: 'Hover a marker for its source, or click it to open the page. "[4]" cites no source, so it stays as written.',
                            item: div({
                                className: 'tb-chatkit-markdown__cited',
                                item: chatMarkdown({content: CITED_TEXT, citations: CITATIONS})
                            })
                        })
                    })
                ]
            })
        });
    }
});

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class MarkdownPanelModel extends HoistModel {
    @bindable accessor content = SAMPLE;

    // Playground props
    @bindable accessor lineBreaks = true;
    @bindable accessor allowImages = false;
    @bindable accessor kitComponents = true;
    @bindable accessor cardTables = false;
    @bindable accessor interceptLinks = false;

    /** Characters of the content shown so far while it streams, or null when it does not. */
    @bindable accessor streamedLength: number = null;

    private streamRun = 0;

    get isStreaming(): boolean {
        return this.streamedLength != null;
    }

    get shownContent(): string {
        const {content, streamedLength} = this;
        return streamedLength == null ? content : content.slice(0, streamedLength);
    }

    get components(): ChatMarkdownComponents {
        const {kitComponents, cardTables} = this;
        if (kitComponents) return cardTables ? KIT_AND_CARD_COMPONENTS : CHAT_MARKDOWN_COMPONENTS;
        return cardTables ? CARD_COMPONENTS : undefined;
    }

    /** Reveal the content a few characters at a time, as a model streams it. */
    async streamAsync() {
        const run = ++this.streamRun;
        this.streamedLength = 0;
        while (this.streamRun === run && this.streamedLength < this.content.length) {
            await wait(25);
            if (this.streamRun !== run) return;
            this.streamedLength = Math.min(this.streamedLength + 6, this.content.length);
        }
        if (this.streamRun === run) this.streamedLength = null;
    }

    stopStreaming() {
        this.streamRun++;
        this.streamedLength = null;
    }

    /** Stable, so the markdown need not render again when it is set. */
    onLinkClick = (href: string, e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        XH.toast({message: `Link clicked: ${href}`, icon: Icon.link()});
    };

    get configSnippet(): string {
        const {kitComponents, cardTables} = this;
        return fmtDemoConfig<ChatMarkdownProps>('chatMarkdown', {
            content: raw('text'),
            isStreaming: this.isStreaming || undefined,
            components: kitComponents
                ? raw(cardTables ? 'KIT_AND_CARD_COMPONENTS' : 'CHAT_MARKDOWN_COMPONENTS')
                : cardTables
                  ? raw('CARD_COMPONENTS')
                  : undefined,
            lineBreaks: this.lineBreaks ? undefined : false,
            allowImages: this.allowImages ? raw("src => src.startsWith('/public/')") : undefined,
            onLinkClick: this.interceptLinks
                ? snippet(
                      '(href, e) => {\n    e.preventDefault();\n    XH.toast({message: href});\n}'
                  )
                : undefined
        });
    }

    override destroy() {
        this.streamRun++;
        super.destroy();
    }
}

//------------------------------------------------------------------
// Components and content
//------------------------------------------------------------------
/** Code written inline in a template literal, with its indent stripped and its lines kept. */
function dedent(text: string): string {
    const lines = text.replace(/^\n/, '').trimEnd().split('\n'),
        indent = Math.min(...lines.filter(it => it.trim()).map(it => it.match(/^ */)[0].length));
    return lines.map(it => it.slice(indent)).join('\n');
}

function ownImages(src: string): boolean {
    return src.startsWith('/public/');
}

function cardTable({children}: {children?: ReactNode}) {
    return div({
        className: 'tb-chatkit-markdown__table-card',
        items: [
            div({
                className: 'tb-chatkit-markdown__table-card-header',
                items: [Icon.table(), span('Table')]
            }),
            table({items: children})
        ]
    });
}

// Module-level constants, so the markdown blocks see the same object on every render.
const CARD_COMPONENTS: ChatMarkdownComponents = {table: cardTable},
    KIT_AND_CARD_COMPONENTS: ChatMarkdownComponents = {
        ...CHAT_MARKDOWN_COMPONENTS,
        table: cardTable
    };

// The desk notes keep their single line breaks, which the markdown() helper would join.
const DESK_NOTES =
    'Call the risk desk at 10:00.\nCheck the hedge ratio after CPI.\nSend the summary by noon.';

const SAMPLE = `${markdown(`
    ## Morning risk summary

    The **Rates** book is down *$412k* on the day, mostly in the long end. The \`get_book_pnl\`
    tool returned the figures below. See the [Hoist Chat Kit](https://github.com/xh/hoist-chat-kit)
    for how a tool like this is built.

    ### Largest moves

    - **UST 10Y** - lost $301k as yields rose 9bp
    - **UST 2Y** - lost $142k
    - **Bund 10Y** - gained $31k, a partial hedge

    | Book | Day P&L | Limit used |
    |------|--------:|-----------:|
    | Rates | -$412k | 64% |
    | Credit | +$88k | 41% |
    | FX | -$17k | 22% |

    > The book stays inside its daily loss limit. No action is needed before the close.

    \`\`\`typescript
    const pnl = await XH.fetchJson({url: 'api/pnl', params: {book: 'Rates'}});
    console.log(fmtNumber(pnl.total, {ledger: true}));
    \`\`\`

    #### Desk notes
`)}

${DESK_NOTES}

${markdown(`
    ![The Hoist logo, from this app's own server](/public/xh/hoist-logo.png)

    ![A chart from another host](https://charts.example.com/pnl.png?book=Rates)
`)}`;

const SHORT_CODE = dedent(`
    chatMarkdown({
        content: part.text,
        isStreaming: part.state === 'streaming'
    });
`);

const SHELL_CODE = dedent(`
    $ pnpm add @xh/hoist-chat-kit
    Packages: +1
    Done in 2.1s
`);

const LONG_CODE = dedent(`
    class PnlService extends BaseService {

        def tradeService

        private CachedValue<Map> _pnl = createCachedValue(
            name: 'pnl',
            expireTime: 5 * MINUTES
        )

        Map getPnl(String book) {
            def pnl = _pnl.getOrCreate { loadPnl() }
            return pnl[book]
        }

        private Map loadPnl() {
            def trades = tradeService.getTrades()
            return trades
                .groupBy { it.book }
                .collectEntries { book, rows ->
                    [book, rows.sum { it.dayPnl }]
                }
        }

        void clearCaches() {
            _pnl.clear()
            super.clearCaches()
        }
    }
`);

const LONG_TABLE_ROWS = 120;

const LONG_TABLE = (() => {
    const symbols = ['UST 2Y', 'UST 5Y', 'UST 10Y', 'UST 30Y', 'Bund 10Y', 'Gilt 10Y'],
        rows = range(1, LONG_TABLE_ROWS + 1).map(i => {
            const symbol = symbols[i % symbols.length],
                side = i % 3 ? 'Buy' : 'Sell',
                qty = ((i * 37) % 50) + 1,
                price = (98 + ((i * 13) % 400) / 100).toFixed(2);
            return `| T-${1000 + i} | ${symbol} | ${side} | ${qty}m | ${price} |`;
        });
    return [
        "Here are today's trades in the Rates book:",
        '',
        '| Trade | Symbol | Side | Quantity | Price |',
        '|-------|--------|------|---------:|------:|',
        ...rows
    ].join('\n');
})();

const CITATIONS: ChatMarkdownCitations = {
    sources: [
        {
            id: 'cite-cpi',
            type: 'source',
            sourceType: 'url',
            title: 'Consumer Price Index - latest release',
            url: 'https://www.bls.gov/cpi/',
            snippet: 'Core CPI rose 0.4% in the month, above the 0.3% consensus.'
        },
        {
            id: 'cite-treasury',
            type: 'source',
            sourceType: 'url',
            title: 'Daily Treasury par yield curve rates',
            url: 'https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics',
            snippet: 'The 10-year par yield closed 9 basis points higher on the day.'
        },
        {
            id: 'cite-ecb',
            type: 'source',
            sourceType: 'url',
            title: 'Euro area yield curves',
            url: 'https://www.ecb.europa.eu/stats/financial_markets_and_interest_rates/',
            snippet: 'Ten-year euro area yields rose 4 basis points on the day.'
        }
    ]
};

const CITED_TEXT = markdown(`
    Core inflation came in above forecast [1], and long-dated Treasury yields rose in response
    [2, 3]. European yields moved less, so the Bund position offset part of the loss [3]. A
    marker for a source that is not in the list, such as [4], stays as written.
`);
