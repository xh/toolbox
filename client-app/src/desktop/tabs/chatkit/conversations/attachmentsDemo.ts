import type {ChatFilePart} from '@xh/hoist-chat-kit/core';
import {ScriptedChatTransport, scriptedDelay, textEvents} from '@xh/hoist-chat-kit/transport';
import type {ChatRunRequest, ScriptedRequestContext} from '@xh/hoist-chat-kit/transport';
import {fmtNumber} from '@xh/hoist/format';
import type {ChatDemoSpec} from '../common/ChatDemo';
import {chatDemoPanel, KIT_LINKS} from '../common/ChatDemo';

/**
 * The composer with attachments: attach files with the paperclip, by dropping them on the chat,
 * or by pasting. The reply lists what arrived with the message.
 */
const DEMO: ChatDemoSpec = {
    pageId: 'attachments',
    description: [
        'Attachments are a model setting: `composer: {enableAttachments: true}` on the',
        '`ChatModelConfig`, with `accept`, `maxFiles` and `maxFileSize`. The user then attaches',
        'files with the paperclip, a paste, or a drop anywhere on the chat panel. While files are',
        'dragged over the panel, a hint covers it.',
        '',
        'Files show as chips above the input until sent, and travel with the message as',
        '`file` parts. A file the rules leave out is named under the chips. The scripted reply',
        'lists what arrived.'
    ],
    kitApi: ['ChatComposerConfig', 'enableAttachments', 'accept', 'maxFiles', 'ChatFilePart'],
    links: [
        {
            url: '$CK/core/README.md#chatcomposerconfig-and-chatcomposermodel',
            text: 'ChatComposerConfig',
            notes: 'The attachment settings, and the composer model.'
        },
        KIT_LINKS.desktop
    ],
    heading: 'Send a file with your message',
    intro:
        'Attach files with the paperclip, drop them on the chat or paste them into the ' +
        'composer. This demo has no model behind it - the reply just lists the files that ' +
        'arrive. Images, PDFs, CSVs, text and markdown files up to 5 MB are accepted, at most ' +
        'four at a time.',
    suggestions: [{text: 'How do I send you a file?'}],
    placeholder: 'Attach a file and send it...',
    createChatConfig: () => ({
        transport: new ScriptedChatTransport({delayMs: 15, respond: createResponse}),
        composer: {
            enableAttachments: true,
            accept: ['image/*', 'application/pdf', '.csv', '.txt', '.md', '.markdown'],
            maxFiles: 4,
            maxFileSize: 5 * 1024 * 1024
        }
    })
};

export const attachmentsPanel = chatDemoPanel(DEMO);

//------------------
// Implementation
//------------------
function createResponse(request: ChatRunRequest, {userMessage}: ScriptedRequestContext) {
    const files = userMessage.parts.filter((it): it is ChatFilePart => it.type === 'file');
    return [scriptedDelay(600), textEvents(files.length ? describeFiles(files) : NO_FILES)];
}

function describeFiles(files: ChatFilePart[]): string {
    const rows = files.map(
        ({name, mediaType, size}) =>
            `| ${codeCell(name)} | ${codeCell(mediaType || 'unknown')} | ${fmtSize(size)} |`
    );
    return [
        `I received **${files.length === 1 ? 'one file' : `${files.length} files`}** with your message:`,
        '',
        '| File | Type | Size |',
        '|------|------|------|',
        ...rows,
        '',
        'A real model would read them now - an image or a PDF goes to Claude as a content ' +
            'block, and a CSV, text or markdown file as text.'
    ].join('\n');
}

/**
 * Text as a code span for a table cell, so that markdown leaves it as written. A file name such
 * as `logo@2x.png` would otherwise render as an email link. The fence is longer than any run of
 * backticks in the text, and pipes are escaped so that they do not split the cell.
 */
function codeCell(text: string): string {
    const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map(it => it.length)),
        fence = '`'.repeat(longest + 1),
        pad = text.startsWith('`') || text.endsWith('`') ? ' ' : '',
        body = text.replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|');
    return `${fence}${pad}${body}${pad}${fence}`;
}

function fmtSize(size: number): string {
    if (size == null) return '-';
    if (size < KB) return `${size} B`;
    const [value, unit] = size < KB * KB ? [size / KB, 'KB'] : [size / (KB * KB), 'MB'];
    return `${fmtNumber(value, {precision: value < 10 ? 1 : 0, asHtml: true})} ${unit}`;
}

const KB = 1024;

const NO_FILES =
    'Attach a file with the **paperclip** button, drop one on the chat, or paste an image ' +
    'into the composer. I will list what arrives - its name, type and size - to show how the ' +
    'files travel with the message.';
