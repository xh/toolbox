import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintModel, DataCatalog} from '@xh/hoist-chat-kit/blueprint';
import {FakeBlueprintDataProvider} from '@xh/hoist-chat-kit/blueprint/demo';
import {ChatModel} from '@xh/hoist-chat-kit/core';
import {chatMessageList} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {
    chatUiInputSpecs,
    chatUiStackSpec,
    chatUiTabsSpec,
    chatUiTextSpec
} from '@xh/hoist-chat-kit/desktop/cmp/genui';
import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {addToBlueprint, architectChatTools} from '@xh/hoist-chat-kit/genui/architect';
import {openUiLangFormat} from '@xh/hoist-chat-kit/genui/openui';
import {ScriptedChatTransport, textEvents, toolCallEvents} from '@xh/hoist-chat-kit/transport';
import type {ScriptedResponse} from '@xh/hoist-chat-kit/transport';
import type {PlainObject} from '@xh/hoist/core';
import {initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, beforeEach, describe, expect, it, onTestFinished, vi} from 'vitest';
import catalogJson from '../test-support/blueprintsCatalog.json';
import p1 from './scenarios/p1-one-grid.json';
import {createToolboxRegistry} from './toolboxRegistry';

const PROGRAM = [
    'root = Stack([counter, inc])',
    '$count = 0',
    'counter = Text("Count: " + $count)',
    'inc = Button("Add", @Set($count, $count + 1))'
].join('\n');

const TABS = {
    root: 'tabs',
    elements: {
        tabs: {component: 'tabs', props: {titles: ['Chart', 'Data']}, children: ['a', 'b']},
        a: {component: 'text', props: {text: 'First tab'}},
        b: {component: 'text', props: {text: 'Second tab'}}
    }
};

/**
 * Adding a chat answer to the host, as Toolbox wires it: the "Add to dashboard" button switches to
 * design mode for one turn and asks the Architect, whose `read_answer` gives the answer as written.
 */
describe('adding an answer to the host', () => {
    beforeAll(() => initTestAppAsync());

    // jsdom has no layout, and so no ResizeObserver or element scrolling.
    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', NoopResizeObserver);
        Element.prototype.scrollTo ??= () => {};
        Element.prototype.scrollIntoView ??= () => {};
    });

    it("gives a program's text with its initial state, whatever the user changed", async () => {
        const {chatModel, host, modes, readResults} = setup(() =>
            textEvents(`Here:\n\n\`\`\`openui\n${PROGRAM}\n\`\`\``)
        );
        render(chatMessageList({model: chatModel}));
        await act(() => chatModel.sendAsync('Show a counter'));

        await clickAsync(screen.getByRole('button', {name: 'Add'}));
        await waitFor(() => expect(document.body.textContent).toContain('Count: 1'));

        await clickAsync(screen.getByRole('button', {name: /Add to dashboard/}));
        await waitFor(() => expect(readResults).toHaveLength(2));

        const [list, read] = readResults,
            sent = chatModel.messages.filter(it => it.role === 'user').at(-1);
        expect(list).toEqual([expect.objectContaining({kind: 'program'})]);
        expect(sent.text).toBe(`Add answer ${list[0].answer} to my dashboard.`);
        expect(read.kind).toBe('program');
        expect(read.source).toContain('$count = 0');
        expect(read.source).not.toContain('$count = 1');
        await waitFor(() => expect(chatModel.isBusy).toBe(false));
        expect(modes).toContain('design');
        expect(host.mode).toBe('run');
    });

    it('gives a tabs answer as a container whose child references hold the titles', async () => {
        const {chatModel, readResults} = setup(() => toolCallEvents('show_ui', TABS));
        render(chatMessageList({model: chatModel}));
        await act(() => chatModel.sendAsync('Show two tabs'));
        await waitFor(() => expect(document.body.textContent).toContain('Chart'));
        expect(document.body.textContent).toContain('Data');

        await clickAsync(screen.getAllByRole('button', {name: /Add to dashboard/})[0]);
        await waitFor(() => expect(readResults).toHaveLength(2));

        const {elements, root} = readResults[1].blueprint as Blueprint;
        expect(elements[root]).toEqual(
            expect.objectContaining({
                component: 'tabs',
                config: {},
                children: [
                    {id: 'a', title: 'Chart'},
                    {id: 'b', title: 'Data'}
                ]
            })
        );
    });
});

//------------------
// Helpers
//------------------
function setup(firstReply: () => ScriptedResponse) {
    const catalog = new DataCatalog(catalogJson as any),
        host = new BlueprintModel({
            blueprint: p1 as Blueprint,
            catalog,
            registry: createToolboxRegistry(),
            dataProvider: new FakeBlueprintDataProvider({catalog}),
            mode: 'run',
            access: 'write'
        }),
        uiCatalog = new ChatUiCatalog({
            components: [
                chatUiStackSpec(),
                chatUiTextSpec(),
                chatUiTabsSpec(),
                ...chatUiInputSpecs()
            ],
            modes: ['document', 'openui'],
            textFormats: [openUiLangFormat({root: 'stack', bindings: true})],
            answers: {
                registry: host.registry,
                dataCatalog: catalog,
                dataProvider: host.dataProvider,
                addToHost: addToBlueprint(host)
            }
        }),
        modes: string[] = [],
        readResults: PlainObject[] = [];

    // The Architect's turn: list the answers, read the listed one, then reply.
    const chatModel: ChatModel = new ChatModel({
        catalog: uiCatalog,
        tools: architectChatTools(host, {catalog: uiCatalog}),
        transport: new ScriptedChatTransport({
            delayMs: 0,
            respond: (_, {turnIndex, stepIndex}) => {
                if (turnIndex === 0) return firstReply();
                modes.push(host.mode);
                if (stepIndex === 0) return toolCallEvents('read_answer', {});
                if (stepIndex === 1) {
                    readResults.push(lastReadOutput(chatModel));
                    return toolCallEvents('read_answer', {
                        answer: readResults[0][0].answer
                    });
                }
                readResults.push(lastReadOutput(chatModel));
                return textEvents('Done.');
            }
        })
    });
    onTestFinished(() => {
        chatModel.destroy();
        host.destroy();
    });
    return {chatModel, host, modes, readResults};
}

function lastReadOutput(chatModel: ChatModel): any {
    const parts = chatModel.messages.flatMap(it => it.parts) as PlainObject[];
    return parts.filter(it => it.toolName === 'read_answer').at(-1)?.output;
}

async function clickAsync(target: HTMLElement) {
    await act(async () => {
        fireEvent.click(target);
        await new Promise(resolve => setTimeout(resolve, 0));
    });
}

class NoopResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
