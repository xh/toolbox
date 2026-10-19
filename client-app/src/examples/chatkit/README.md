# Chat Kit

A tour of [`@xh/hoist-chat-kit`](https://github.com/xh/hoist-chat-kit), the chat components for
Hoist apps. Run it at `/chatkit`. It has two tabs:

- **Demos** lists demo conversations on the left and shows the active one on the right. Each demo
  runs its own `ChatModel`, so it keeps its conversation when you switch away.
- **Guideline Assistant** is a full chat workspace over a backend that owns its conversations: a
  thread sidebar, document scope, `[n]` citations that open the cited passage beside the chat,
  feedback and a fixed "not found" reply. See [`guide/README.md`](guide/README.md).

All demos but the last run on a `ScriptedChatTransport`, with replies scripted in the browser.
They need no server, model or API key. Each script's `respond` function picks its reply from the
request context the transport passes in: the step within the turn, the user message, and the
attempt at that message. The live demo talks to Claude through the Toolbox server.

## Demos

| Demo                | What it shows                                                                                                                                                                   | Kit API                                                                   | Source                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| Rich content        | A streamed markdown reply: headings, lists, a table, code blocks, a blockquote, citations and sources                                                                           | `textEvents`, `citationEvents`, `sourceEvents`                            | `demos/richContentDemo.ts`               |
| Reasoning and tools | Streamed thinking, then three tool calls the browser runs in turn. One fails, and the answer works with the rest                                                                | `reasoningEvents`, `toolCallEvents`, `ChatToolSpec.execute`               | `demos/reasoningDemo.ts`                 |
| Agent timeline      | A plan drawn inline as a checklist where the agent calls it, then a run in the activity timeline: a query, a batch of three calls, and a sub-agent whose failed call is retried | `subagentEvents`, `toolCallEvents`, `ChatToolSpec.display` and `renderer` | `demos/timelineDemo.ts`                  |
| Approval            | An order that waits for Approve or Deny, shown as an order ticket                                                                                                               | `needsApproval`, `approvalPrompt`, `renderer`                             | `demos/approvalDemo.ts`                  |
| Agent Questions     | A server agent that pauses its run to ask a question, fill in a short form, or approve one of its tools, then resumes                                                           | `interruptEvents`, `ChatRunRequest.resume`                                | `demos/interruptsDemo.ts`                |
| Generative UI       | KPI tiles, a grid that fills in as it streams, a chart, and a card whose buttons ask follow-ups                                                                                 | `ChatUiCatalog` and the built-in `chatUi*Spec` components                 | `demos/genUiDemo.ts`, `demos/catalog.ts` |
| Errors and stop     | A reply that fails partway, with Retry. The retry streams a long reply to cut short with Stop                                                                                   | `errorEvents`, the `attempt` passed to `respond`, retry and stop          | `demos/errorsDemo.ts`                    |
| Attachments         | Files attached with the paperclip, dropped on the chat or pasted                                                                                                                | `ChatComposerConfig` attachment options                                   | `demos/attachmentsDemo.ts`               |
| Live model          | A real conversation with Claude, with the same generative UI catalog                                                                                                            | `HoistChatTransport`, `AnthropicCodec`                                    | `demos/liveDemo.ts`                      |

## Structure

- `AppModel` holds the two tabs, and persists the active one.
- `DemosPanel` creates a `DemosModel`, which creates one `ChatKitDemoModel` per demo and persists
  the active demo. It renders the nav and the kit's `chatPanel` for the active demo, with the
  kit's `chatClearButton` in its header.
- `ChatKitDemoModel` owns the demo's `ChatModel`, built from the demo's `createChatConfig()`.
- `demos/Types.ts` declares a demo: its title, nav text, empty state and chat config.
  `demos/scriptUtils.ts` holds the `markdown` helper for the scripted replies.
- `guide/` holds the Guideline Assistant, with its own README.

## Live model

The live demo posts to `llm/stream`, the server relay that the Weather V2 Dashboard Agent also
uses. See `LlmService.groovy` for the request policy and the `llm*` configs. The demo needs the
`llmApiKey` config set. Until then it shows the server's error. Each model call counts toward the
per-user `llmRateLimit`, which the live demo shares with Weather V2. A reply makes one call per
step, and each component the model shows ends a step. The demo caps a reply at 4 steps with
`maxSteps`, enough for three components and a closing message.

The demo needs LLM access: the `TOOLBOX_LLM_USER` role, or the `llmOpenToAllUsers` config. A
user without it sees a one-line notice in place of the chat. See "Deployment settings" in the
[Weather V2 README](../weatherv2/README.md#deployment-settings) for access, limits and where to see
usage.

## Kit dependency

Toolbox installs `@xh/hoist-chat-kit` from npm under `next`. See the "Chat kit" section of the
Weather V2 README for how the app builds it, and how to link a local kit checkout instead.
