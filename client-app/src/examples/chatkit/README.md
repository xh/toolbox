# Chat Kit

A tour of [`@xh/hoist-chat-kit`](https://github.com/xh/hoist-chat-kit), the chat components for
Hoist apps. Run it at `/chatkit`. It has three tabs:

- **Demos** lists demo conversations on the left and shows the active one on the right. Each demo
  runs its own `ChatModel`, so it keeps its conversation when you switch away.
- **Guideline Assistant** is a full chat workspace over a backend that owns its conversations: a
  thread sidebar, document scope, `[n]` citations that open the cited passage beside the chat,
  feedback and a fixed "not found" reply. See [`guide/README.md`](guide/README.md).
- **Grid Helper** is a grid of positions with a component helper beside it. See
  [Grid Helper](#grid-helper).

All demos but the live one run on a `ScriptedChatTransport`, with replies scripted in the
browser, as does the Grid Helper. They need no server, model or API key. Each script's `respond`
function picks its reply from the request context the transport passes in: the step within the
turn, the user message, and the attempt at that message. The live demo talks to Claude through
the Toolbox server.

## Demos

| Demo                | What it shows                                                                                                    | Kit API                                                          | Source                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| Rich content        | A streamed markdown reply: headings, lists, a table, code blocks, a blockquote, citations and sources            | `textEvents`, `citationEvents`, `sourceEvents`                   | `demos/richContentDemo.ts`               |
| Reasoning and tools | Streamed thinking, then three tool calls the browser runs in turn. One fails, and the answer works with the rest | `reasoningEvents`, `toolCallEvents`, `ChatToolSpec.execute`      | `demos/reasoningDemo.ts`                 |
| Approval            | An order that waits for Approve or Deny, shown as an order ticket                                                | `needsApproval`, `approvalPrompt`, `renderer`                    | `demos/approvalDemo.ts`                  |
| Generative UI       | KPI tiles, a grid that fills in as it streams, a chart, and a card whose buttons ask follow-ups                  | `ChatUiCatalog` and the built-in `chatUi*Spec` components        | `demos/genUiDemo.ts`, `demos/catalog.ts` |
| Errors and stop     | A reply that fails partway, with Retry. The retry streams a long reply to cut short with Stop                    | `errorEvents`, the `attempt` passed to `respond`, retry and stop | `demos/errorsDemo.ts`                    |
| Attachments         | Files attached with the paperclip, dropped on the chat or pasted                                                 | `ChatComposerConfig` attachment options                          | `demos/attachmentsDemo.ts`               |
| Live model          | A real conversation with Claude, with the same generative UI catalog                                             | `HoistChatTransport`, `AnthropicCodec`                           | `demos/liveDemo.ts`                      |

## Grid Helper

A component helper is a small assistant beside one Hoist component. Here it sits beside a grid of
invented positions. Press the sparkles button last in the panel's header, or `Ctrl/Cmd+I` with
focus in the grid. The helper docks beside the grid when the panel is 740 px or wider, and opens as
a popover from the button when it is narrower.

`GridHelperModel` builds a `ChatAssistantModel` over `gridTools(gridModel, {...})`, with a title,
a data boundary and three documentation links. Toolbox's grid demo pages stand in for an app's
docs. `GridHelperPanel` puts `chatAssistantButton` in the panel's header and
`chatAssistantContainer` around the panel's toolbar and grid.

The helper's model is scripted in `helper/gridHelperScript.ts`. Its `respond` function reads the
user's message and calls the `gridTools` tools for the phrases it knows. The browser runs the
calls on the grid, and the second step answers from their results:

| Phrase                                           | Tool call                  |
| ------------------------------------------------ | -------------------------- |
| "Group by sector", "ungroup"                     | `group_grid`               |
| "Sort by market value"                           | `sort_grid`, largest first |
| "Hide the price column", "show the price column" | `update_columns`           |
| "Show only technology"                           | `filter_grid` on Sector    |
| "Clear filters", "show everything"               | `clear_filters`            |

A message can name several, such as "group by sector and sort by market value". Each change shows
as a line with Show, and the reply's Undo restores the grid. Anything else gets a help answer that
cites one of the docs links.

## Structure

- `AppModel` holds the three tabs, and persists the active one.
- `DemosPanel` creates a `DemosModel`, which creates one `ChatKitDemoModel` per demo and persists
  the active demo. It renders the nav and the kit's `chatPanel` for the active demo, with the
  kit's `chatClearButton` in its header.
- `ChatKitDemoModel` owns the demo's `ChatModel`, built from the demo's `createChatConfig()`.
- `demos/Types.ts` declares a demo: its title, nav text, empty state and chat config.
  `demos/scriptUtils.ts` holds the `markdown` helper for the scripted replies.
- `guide/` holds the Guideline Assistant, with its own README.
- `helper/` holds the Grid Helper: `GridHelperModel`, `GridHelperPanel` and the script.

## Live model

The live demo posts to `llm/stream`, the server relay that the Weather V2 Dashboard Agent also
uses. See `LlmService.groovy` for the request policy and the `llm*` configs. The demo needs the
`llmApiKey` config set. Until then it shows the server's error. Each model call counts toward the
per-user `llmRateLimit`, which the live demo shares with Weather V2. A reply makes one call per
step, and each component the model shows ends a step. The demo caps a reply at 4 steps with
`maxSteps`, enough for three components and a closing message.

## Kit dependency

Toolbox installs `@xh/hoist-chat-kit` from npm under `next`. See the "Chat kit" section of the
Weather V2 README for how the app builds it, and how to link a local kit checkout instead.
