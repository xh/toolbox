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
        'files with the paperclip, a drop on the composer, or a paste.',
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
        'composer. Images, PDFs and CSVs up to 5 MB are accepted, at most four at a time.',
    suggestions: [{text: 'What can you do with attachments?'}],
    placeholder: 'Attach a file and ask about it...',
    createChatConfig: () => ({
        transport: new ScriptedChatTransport({delayMs: 15, respond: createResponse}),
        composer: {
            enableAttachments: true,
            accept: ['image/*', 'application/pdf', '.csv'],
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
            `| ${name} | \`${mediaType || 'unknown'}\` | ${fmtSize(size)} |`
    );
    return [
        `I received **${files.length === 1 ? 'one file' : `${files.length} files`}** with your message:`,
        '',
        '| File | Type | Size |',
        '|------|------|------|',
        ...rows,
        '',
        'A real model would read them now - an image or a PDF goes to Claude as a content ' +
            'block, and a CSV as text. This demo only lists them.'
    ].join('\n');
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
