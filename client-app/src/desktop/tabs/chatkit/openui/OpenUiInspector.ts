import type {ChatTextPart} from '@xh/hoist-chat-kit/core';
import {
    code,
    div,
    filler,
    li,
    placeholder,
    pre,
    span,
    table,
    tbody,
    td,
    th,
    thead,
    tr,
    ul
} from '@xh/hoist/cmp/layout';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import type {HoistProps} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, lookup, managed, uses} from '@xh/hoist/core';
import {clipboardButton} from '@xh/hoist/desktop/cmp/clipboard';
import {button} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtNumber, fmtTime} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {pluralize} from '@xh/hoist/utils/js';
import classNames from 'classnames';
import {isEmpty, partition} from 'lodash';
import {OpenUiLabModel} from './OpenUiLabModel';
import type {
    OpenUiElementReport,
    OpenUiProgramReport,
    OpenUiProgramStatus
} from './OpenUiProgramReport';

/** The model of the inspector: its tabs and display options. The lab's model holds the data. */
class OpenUiInspectorModel extends HoistModel {
    @lookup(OpenUiLabModel) labModel: OpenUiLabModel;

    @managed readonly tabModel = new TabContainerModel({
        tabs: [
            {id: 'programs', title: 'Programs', icon: Icon.code(), content: programsTab},
            {id: 'calls', title: 'Calls', icon: Icon.transaction(), content: callsTab},
            {id: 'prompt', title: 'Prompt', icon: Icon.terminal(), content: promptTab},
            {id: 'reply', title: 'Reply Text', icon: Icon.fileText(), content: replyTab}
        ]
    });

    /** True to show the whole system prompt, not only the catalog's OpenUI Lang section. */
    @bindable accessor showWholePrompt = false;

    /** The prompt text on show. */
    get promptText(): string {
        const {labModel, showWholePrompt} = this;
        return showWholePrompt ? labModel.systemPrompt : labModel.catalog.instructions;
    }

    /** The text parts of the inspected reply, as the model wrote them. */
    get replyText(): string {
        return (this.labModel.inspectedMessage?.parts ?? [])
            .filter(it => it.type === 'text')
            .map(it => (it as ChatTextPart).text)
            .join('\n\n');
    }
}

/**
 * The inspector beside the lab's chat. It shows the mechanism behind a reply: each OpenUI Lang
 * program with what became of it, the tool calls of the model and of its programs, the prompt
 * that taught the model the language, and the reply's text as written.
 */
export const openUiInspector = hoistCmp.factory({
    displayName: 'OpenUiInspector',
    model: creates(OpenUiInspectorModel),

    render({model}) {
        return panel({
            className: 'tb-openui-inspector',
            title: 'Inspector',
            icon: Icon.magnifyingGlass(),
            compactHeader: true,
            modelConfig: {side: 'right', defaultSize: '45%', minSize: 320},
            item: tabContainer({model: model.tabModel})
        });
    }
});

//------------------
// Programs tab
//------------------
const programsTab = hoistCmp.factory<HoistProps<OpenUiLabModel>>({
    displayName: 'OpenUiProgramsTab',
    model: uses(OpenUiLabModel),

    render({model}) {
        const {reports, inspectedMessage} = model;
        if (!inspectedMessage) {
            return placeholder(
                Icon.code(),
                'Ask for a UI. Each OpenUI Lang program of the latest reply shows here.'
            );
        }
        if (isEmpty(reports)) {
            return placeholder(
                Icon.code(),
                inspectedMessage.isStreaming
                    ? 'Waiting for a program...'
                    : 'The latest reply holds no OpenUI Lang program.'
            );
        }
        return div({
            className: 'tb-openui-inspector__scroll',
            items: reports.map(report => programReport({key: report.index, report}))
        });
    }
});

interface ProgramReportProps extends HoistProps {
    report: OpenUiProgramReport;
}

const programReport = hoistCmp.factory<ProgramReportProps>({
    displayName: 'OpenUiProgramReport',
    model: false,

    render({report}) {
        const {index, source, status, elements, errors, unresolved, orphaned} = report,
            fallbacks = elements.filter(it => !isEmpty(it.errors)).length;

        return div({
            className: 'tb-openui-program',
            items: [
                div({
                    className: 'tb-openui-program__header',
                    items: [
                        span({className: 'tb-openui-program__title', item: `Program ${index}`}),
                        statusPill(status),
                        span({
                            className: 'tb-openui-program__counts',
                            item: [
                                pluralize('element', elements.length, true),
                                fallbacks ? pluralize('fallback', fallbacks, true) : null,
                                `${fmtNumber(source.length, {precision: 0})} chars`
                            ]
                                .filter(Boolean)
                                .join(' · ')
                        }),
                        filler(),
                        clipboardButton({
                            getCopyText: () => source,
                            text: null,
                            minimal: true,
                            title: 'Copy the program',
                            successMessage: 'Program copied.'
                        })
                    ]
                }),
                div({
                    className: 'tb-openui-program__body',
                    items: [
                        pre({className: 'tb-openui-code', item: source}),
                        div({
                            className: 'tb-openui-program__outcome',
                            items: [
                                elementTable(elements),
                                findings(
                                    // A program with no element was refused whole, before or
                                    // by the parser.
                                    isEmpty(elements)
                                        ? 'Why the program did not render'
                                        : 'Dropped by the parser',
                                    errors,
                                    'danger'
                                ),
                                findings(
                                    'Used but never defined',
                                    unresolved.map(it => `${it}: no statement defines it`),
                                    'warning'
                                ),
                                findings(
                                    'Defined but not reached from root',
                                    orphaned.map(it => `${it}: no statement uses it`),
                                    'warning'
                                )
                            ]
                        })
                    ]
                })
            ]
        });
    }
});

function statusPill(status: OpenUiProgramStatus) {
    return span({
        className: `tb-openui-pill tb-openui-pill--${status}`,
        item: STATUS_LABELS[status]
    });
}

function elementTable(elements: OpenUiElementReport[]) {
    if (isEmpty(elements)) return null;
    return table({
        className: 'tb-openui-elements',
        items: [
            thead(tr(th('Element'), th('Component'), th('Outcome'))),
            tbody(
                elements.map(({id, component, isPartial, readsState, errors}) =>
                    tr({
                        key: id,
                        className: classNames(
                            !isEmpty(errors) && 'tb-openui-elements__row--failed'
                        ),
                        items: [
                            td(code(id)),
                            td(component),
                            td(
                                isEmpty(errors)
                                    ? isPartial
                                        ? 'Streaming'
                                        : readsState
                                          ? 'Reads state'
                                          : 'Rendered'
                                    : ul(errors.map((it, idx) => li({key: idx, item: it})))
                            )
                        ]
                    })
                )
            )
        ]
    });
}

function findings(title: string, messages: string[], intent: 'danger' | 'warning') {
    if (isEmpty(messages)) return null;
    return div({
        className: `tb-openui-findings tb-openui-findings--${intent}`,
        items: [
            div({className: 'tb-openui-findings__title', item: title}),
            ul(messages.map((it, idx) => li({key: idx, item: it})))
        ]
    });
}

const STATUS_LABELS: Record<OpenUiProgramStatus, string> = {
    streaming: 'Streaming',
    rendered: 'Rendered',
    renderedWithIssues: 'Rendered with issues',
    failed: 'Failed'
};

//------------------
// Calls tab
//------------------
const callsTab = hoistCmp.factory<HoistProps<OpenUiLabModel>>({
    displayName: 'OpenUiCallsTab',
    model: uses(OpenUiLabModel),

    render({model}) {
        const {toolCalls, chatModel} = model,
            replyIds = chatModel.messages.filter(it => it.isAssistant).map(it => it.id),
            [byProgram, byModel] = partition(toolCalls, it => it.by === 'program');

        return panel({
            tbar: toolbar({
                compact: true,
                items: [
                    span({
                        className: 'tb-openui-inspector__meta',
                        item: `${byModel.length} by the model · ${byProgram.length} by Query()`
                    }),
                    filler(),
                    button({
                        text: 'Clear',
                        icon: Icon.reset(),
                        disabled: isEmpty(toolCalls),
                        onClick: () => model.clearToolCalls()
                    })
                ]
            }),
            item: isEmpty(toolCalls)
                ? placeholder(
                      Icon.transaction(),
                      'Each call to a data tool shows here: those the model makes in a reply, ' +
                          'and those a program makes with Query().'
                  )
                : div({
                      className: 'tb-openui-inspector__scroll',
                      items: [
                          table({
                              className: 'tb-openui-elements',
                              items: [
                                  thead(
                                      tr(
                                          th('#'),
                                          th('Time'),
                                          th('Reply'),
                                          th('By'),
                                          th('Tool'),
                                          th('Arguments')
                                      )
                                  ),
                                  tbody(
                                      toolCalls.map(({index, at, by, toolName, args, messageId}) =>
                                          tr({
                                              key: index,
                                              items: [
                                                  td(index),
                                                  td(fmtTime(at, {fmt: 'HH:mm:ss'})),
                                                  td(replyLabel(replyIds, messageId)),
                                                  td(by === 'model' ? 'Model' : 'Query()'),
                                                  td(code(toolName)),
                                                  td(code(JSON.stringify(args)))
                                              ]
                                          })
                                      )
                                  )
                              ]
                          }),
                          div({className: 'tb-openui-inspector__note', item: CALL_LIMITS_NOTE})
                      ]
                  })
        });
    }
});

/** Which reply of the chat made a call: its position among the replies, from 1. */
function replyLabel(replyIds: string[], messageId: string): string {
    const idx = replyIds.indexOf(messageId);
    return idx < 0 ? 'Gone' : `${idx + 1} of ${replyIds.length}`;
}

const CALL_LIMITS_NOTE =
    'The model calls a tool before it writes its reply, and the chat shows that call in the ' +
    'reply. A Query() call shows only here, as the chat keeps no record of one. ' +
    'The kit runs a query when its program completes, and again when a $variable in its ' +
    'arguments changes. A program with more than 8 queries runs none. Only the first 3 ' +
    'programs of a reply run queries. A program in an older reply waits until the user acts ' +
    'in it. All programs of a chat together start at most 60 calls a minute.';

//------------------
// Prompt tab
//------------------
const promptTab = hoistCmp.factory<HoistProps<OpenUiInspectorModel>>({
    displayName: 'OpenUiPromptTab',
    model: uses(OpenUiInspectorModel),

    render({model}) {
        const {promptText} = model;
        return panel({
            tbar: toolbar({
                compact: true,
                items: [
                    switchInput({
                        bind: 'showWholePrompt',
                        label: 'Whole system prompt',
                        labelSide: 'right'
                    }),
                    filler(),
                    span({
                        className: 'tb-openui-inspector__meta',
                        item: `${fmtNumber(promptText.length, {precision: 0})} chars`
                    }),
                    clipboardButton({
                        getCopyText: () => promptText,
                        text: 'Copy',
                        successMessage: 'Prompt copied.'
                    })
                ]
            }),
            item: pre({className: 'tb-openui-code tb-openui-code--fill', item: promptText})
        });
    }
});

//------------------
// Reply text tab
//------------------
const replyTab = hoistCmp.factory<HoistProps<OpenUiInspectorModel>>({
    displayName: 'OpenUiReplyTab',
    model: uses(OpenUiInspectorModel),

    render({model}) {
        const {replyText} = model;
        return replyText
            ? pre({className: 'tb-openui-code tb-openui-code--fill', item: replyText})
            : placeholder(Icon.fileText(), 'The text of the latest reply shows here, as written.');
    }
});
