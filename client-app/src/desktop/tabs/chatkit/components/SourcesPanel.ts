import type {ChatSourcePart} from '@xh/hoist-chat-kit/core';
import {ChatMessage} from '@xh/hoist-chat-kit/core';
import type {ChatMarkdownCitations} from '@xh/hoist-chat-kit/cmp/markdown';
import {chatMarkdown} from '@xh/hoist-chat-kit/cmp/markdown';
import type {ChatSourcesProps} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {chatMessageList, chatSources} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {box} from '@xh/hoist/cmp/layout';
import type {PlainObject} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable, bindableRef, observableRef} from '@xh/hoist/mobx';
import type {DemoConfigValue} from '../../../common/Demo';
import {
    demoFrame,
    demoPanel,
    demoPlayground,
    demoSection,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {chatKitPage} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import {createSampleConversation} from '../common/sampleConversation';
import {markdown} from '../common/scriptUtils';

export const sourcesPanel = hoistCmp.factory({
    displayName: 'SourcesPanel',
    model: creates(() => SourcesPanelModel),

    render({model}) {
        const page = chatKitPage('sources'),
            {
                compact,
                startCollapsed,
                visibleRows,
                showNumbers,
                showExternalIcon,
                title,
                clickMode
            } = model;

        return wrapper({
            title: page.title,
            icon: page.icon(),
            description: [
                '`ChatSources` lists the sources under a reply, in the order of their numbers.',
                'It never renumbers them: the samples here skip 4, and the rows, the markers and',
                'the text still agree.',
                '',
                "A source's `sourceType` sets its icon, its meta line and what a click on its title",
                'does. A `document` shows its file-type icon, then `metadata.fileName` and',
                '`metadata.page`. It opens in the side panel when one is in reach, else through',
                '`onSourceClick`. A `url` shows a globe and its host, and opens a new tab.',
                '`metadata.meta` replaces either meta line.',
                '',
                'With `citationMarkers` on, `[1]` and `[2, 3]` in the text render as markers for',
                'the sources they cite. Hover one for its card, or click it to open the source.',
                '',
                '**Kit API:** `chatSources`, `ChatSourcePart`, `chatMarkdown` `citations`,',
                '`ChatMessageList.citationMarkers`, `ChatSources.defaults`'
            ],
            links: [
                {
                    url: '$CK/desktop/cmp/chat/README.md#sources-list',
                    text: 'Sources list',
                    notes: 'Layouts, the source types and the defaults.'
                },
                {
                    url: '$CK/desktop/cmp/chat/README.md#citations',
                    text: 'Citations',
                    notes: 'Chips, inline markers and their cards.'
                },
                {
                    url: '$CK/cmp/markdown/README.md#citation-markers',
                    text: 'Citation markers',
                    notes: 'How `[n]` in the text matches a source.'
                },
                KIT_LINKS.desktop,
                tabSourceLink('components/SourcesPanel.ts')
            ],
            options: wrapperOptionGroup({
                label: 'Playground only - props',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Drives the Playground list. The other sections use the defaults.',
                items: [
                    wrapperOption({
                        label: 'Compact',
                        propName: 'ChatSourcesProps.compact',
                        info: 'Off for the roomier list in a frame, with the meta line under the title.',
                        control: switchInput({bind: 'compact'})
                    }),
                    wrapperOption({
                        label: 'Start collapsed',
                        propName: 'ChatSourcesProps.startCollapsed',
                        info: 'Applies until the user opens or closes the list.',
                        control: switchInput({bind: 'startCollapsed'})
                    }),
                    wrapperOption({
                        label: 'Visible rows',
                        propName: 'ChatSourcesProps.visibleRows',
                        info: 'Rows before "Show N More". Clear it for null, to show every row.',
                        control: numberInput({
                            bind: 'visibleRows',
                            min: 1,
                            max: 7,
                            width: 70,
                            placeholder: 'All'
                        })
                    }),
                    wrapperOption({
                        label: 'Show numbers',
                        propName: 'ChatSourcesProps.showNumbers',
                        control: switchInput({bind: 'showNumbers'})
                    }),
                    wrapperOption({
                        label: 'External icon',
                        propName: 'ChatSourcesProps.showExternalIcon',
                        info: 'Marks rows that open a new tab. A row that onSourceClick takes opens no tab, so it shows under "Documents only" or "Off".',
                        control: switchInput({bind: 'showExternalIcon'})
                    }),
                    wrapperOption({
                        label: 'Title',
                        propName: 'ChatSourcesProps.title',
                        control: textInput({
                            bind: 'title',
                            width: 130,
                            placeholder: 'Sources',
                            commitOnChange: true
                        })
                    }),
                    wrapperOption({
                        label: 'Handle clicks',
                        propName: 'ChatSourcesProps.onSourceClick',
                        info: 'A function takes every source. An object keyed by sourceType takes only its types, and the rest keep the default: a link opens a new tab. Off, a document with no URL says it cannot open here.',
                        control: select({
                            bind: 'clickMode',
                            options: CLICK_MODE_OPTIONS,
                            enableFilter: false,
                            width: 150
                        })
                    })
                ]
            }),
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 460,
                            caption:
                                'Click a title to open it, or elsewhere on a row for its excerpt.',
                            config: fmtDemoConfig<ChatSourcesProps>('chatSources', {
                                sources: raw('sources'),
                                title: title || undefined,
                                compact: compact ? undefined : false,
                                startCollapsed: startCollapsed || undefined,
                                visibleRows: visibleRows === 3 ? undefined : visibleRows,
                                showNumbers: showNumbers ? undefined : false,
                                showExternalIcon: showExternalIcon ? undefined : false,
                                onSourceClick: CLICK_MODE_SNIPPETS[clickMode]
                            }),
                            value: model.lastOpened,
                            item: chatSources({
                                // Remount on a flip: a list the user opened or closed keeps its state.
                                key: `sources-${startCollapsed}`,
                                sources: SOURCES,
                                title: title || undefined,
                                compact,
                                startCollapsed,
                                visibleRows,
                                showNumbers,
                                showExternalIcon,
                                onSourceClick: model.sourceClick
                            })
                        })
                    }),
                    demoSection({
                        title: 'Citation markers in text',
                        note: 'chatMarkdown with citations - the same seven sources.',
                        item: demoFrame({
                            label: 'citations: {sources, onClick}',
                            info: 'Four or more numbers collapse to one marker. [4] cites no source, so it stays as written.',
                            item: chatMarkdown({
                                content: CITED_TEXT,
                                citations: model.citations
                            })
                        })
                    }),
                    demoSection({
                        title: 'In a reply',
                        note: 'chatMessageList over a transcript, with citationMarkers: true.',
                        item: demoFrame({
                            label: 'The markers and the sources list share numbers',
                            info: 'Hover a marker for its card. Hover a row to light up its markers.',
                            item: box({
                                height: 440,
                                item: chatMessageList({
                                    host: model.transcript,
                                    assistantName: 'Research Assistant',
                                    citationMarkers: true,
                                    onSourceClick: model.openSource,
                                    flex: 1
                                })
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
type ClickMode = 'all' | 'documents' | 'none';

const CLICK_MODE_OPTIONS: Array<{value: ClickMode; label: string}> = [
    {value: 'all', label: 'Every source'},
    {value: 'documents', label: 'Documents only'},
    {value: 'none', label: 'Off'}
];

/** The `onSourceClick` entry of the snippet, by click mode. */
const CLICK_MODE_SNIPPETS: Record<ClickMode, DemoConfigValue> = {
    all: raw('this.openSource'),
    documents: raw('{document: this.openSource}'),
    none: undefined
};

class SourcesPanelModel extends HoistModel {
    @bindable accessor compact = true;
    @bindable accessor startCollapsed = false;
    @bindable accessor visibleRows: number = 3;
    @bindable accessor showNumbers = true;
    @bindable accessor showExternalIcon = true;
    @bindable accessor title = '';
    @bindable accessor clickMode: ClickMode = 'all';

    /** The source the Playground last opened, for its value readout. */
    @bindableRef accessor lastOpened: PlainObject = null;

    /** The last reply of the sample conversation, with the question before it. */
    readonly transcript = new SourcesTranscript();

    /** Stable, so the markdown parses once. */
    readonly citations: ChatMarkdownCitations = {
        sources: SOURCES,
        onClick: source => this.openSource(source)
    };

    /** Handlers by source type - a stable object, as the prop must be. */
    readonly documentClick: ChatSourcesProps['onSourceClick'] = {
        document: source => this.openSource(source)
    };

    /** The `onSourceClick` prop for the Playground, by the rail's choice. */
    get sourceClick(): ChatSourcesProps['onSourceClick'] {
        switch (this.clickMode) {
            case 'all':
                return this.openSource;
            case 'documents':
                return this.documentClick;
            default:
                return undefined;
        }
    }

    // An arrow function field, so that the prop stays the same function across renders.
    openSource = (source: ChatSourcePart) => {
        const {title, url, sourceType, metadata} = source;
        this.lastOpened = {title, sourceType, page: metadata?.page ?? null};

        if (sourceType === 'document') {
            const where = metadata?.page ? `, page ${metadata.page}` : '';
            XH.toast({
                icon: Icon.fileText(),
                message: `The app would open ${metadata?.fileName ?? title}${where}.`
            });
        } else {
            XH.toast({icon: Icon.globe(), message: `The app would open ${url}.`});
        }
    };
}

/** A read-only conversation: the sample's last question and its cited reply. */
class SourcesTranscript extends HoistModel {
    @observableRef accessor messages: ChatMessage[] = createSampleConversation()
        .slice(-2)
        .map(it => new ChatMessage(it));
}

//------------------------------------------------------------------
// Sample data
//------------------------------------------------------------------
/**
 * Seven sources, numbered 1 to 8 with no 4 - as a backend numbers the passages it found and drops
 * one. Documents carry a file name and page, links a URL, and each an excerpt.
 */
const SOURCES: ChatSourcePart[] = [
    {
        id: 's1',
        type: 'source',
        sourceType: 'document',
        marker: 1,
        title: 'Fixed Income Policy 2026',
        snippet:
            'Duration of the core sleeve must stay between 4.0 and 7.0 years, measured at each month end.',
        metadata: {fileName: 'Fixed Income Policy 2026.pdf', page: 12}
    },
    {
        id: 's2',
        type: 'source',
        sourceType: 'url',
        marker: 2,
        title: 'Rates outlook: an extended hold',
        url: 'https://www.example.com/research/rates-outlook',
        snippet:
            'Most forecasters now expect the policy rate to stay on hold through the first half of next year.'
    },
    {
        id: 's3',
        type: 'source',
        sourceType: 'document',
        marker: 3,
        title: 'Q3 Portfolio Review',
        snippet:
            'September purchases of 10-year paper lifted the duration of the book from 5.8 to 6.4 years.',
        metadata: {fileName: 'Q3 Portfolio Review.docx', page: 4}
    },
    {
        id: 's5',
        type: 'source',
        sourceType: 'url',
        marker: 5,
        title: 'Bond duration',
        url: 'https://en.wikipedia.org/wiki/Bond_duration',
        snippet:
            'Modified duration gives the percentage change in price for a one-point change in yield.'
    },
    {
        id: 's6',
        type: 'source',
        sourceType: 'document',
        marker: 6,
        title: 'Rate shock scenarios',
        snippet: 'A parallel 100 bp rise takes 6.2% off the market value of the core sleeve.',
        metadata: {fileName: 'Rate Scenarios.xlsx', meta: ['Sheet: Shocks', 'Updated Oct 28']}
    },
    {
        id: 's7',
        type: 'source',
        sourceType: 'url',
        marker: 7,
        title: 'Quarterly review: markets and liquidity',
        url: 'https://www.bis.org/publ/quarterly.htm',
        snippet: 'Term premia rose across major markets while policy rate expectations held steady.'
    },
    {
        id: 's8',
        type: 'source',
        sourceType: 'document',
        marker: 8,
        title: 'Investment Committee Minutes - September',
        snippet:
            'The committee agreed to hold duration near 6.5 years and review the position in December.',
        metadata: {fileName: 'Committee Minutes 2026-09.pdf', page: 2}
    }
];

const CITED_TEXT = markdown(`
    Duration across the core sleeve rose to **6.4 years** after the September purchases [3]. That
    sits inside the policy band of 4.0 to 7.0 years [1], and the committee chose to hold it there
    until December [8].

    Outside views expect rates to stay on hold into next year [2, 7]. All four rate inputs agree
    on the direction of a 100 bp shock [5, 6, 7, 8], and a mixed set of them [1, 3, 6, 8] shows
    the same loss within a point. There is no fourth source, so [4] stays as written.
`);
