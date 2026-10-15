# Guideline Assistant

A server-mode demo of `@xh/hoist-chat-kit`: a guideline assistant that
answers questions over a small document library, with numbered citations. The backend owns the
conversations. The browser sends one question per turn and renders the stream.

It is the reference recipe for porting a retrieval-augmented (RAG) assistant into a Hoist app.
The Toolbox server emulates the backend, so the recipe runs with no external service and no LLM.

Open it in the Chat Kit app at `/chatkit`, on the Guideline Assistant tab. See
[The page](#the-page).

## Architecture

```
GuideAssistantModel (HoistModel)
├── threadsModel: ChatThreadsModel        # The user's chats, one ChatModel per open chat
│   ├── store: GuideThreadStore           # REST: list, history, rename, delete, feedback
│   └── createChatModel → ChatModel       # historyMode 'server', feedback with comments
│       └── SseChatTransport('guide/query')
│           └── codec: GuideCodec         # The stream dialect <-> kit events
├── workspaceModel: ChatWorkspaceModel    # The kit's workspace: sidebar, chat, side panel
│   └── documentRenderer → GuideDocumentView
├── documentModel: GuideDocumentModel     # The viewer: follows the side panel's request
├── documents: GuideDocument[]            # The library, for the scope chip
└── scope / setScope()                    # The selected chat's runOptions.scope

GuideAssistantPanel (hoistCmp)            # Creates the model, renders chatWorkspace
```

| File                       | Role                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| `GuideApi.ts`              | Wire types, and `toSourceFields()`, which maps a cited passage to a kit source |
| `GuideCodec.ts`            | A server-mode `ChatCodec` for the stream dialect                               |
| `GuideThreadStore.ts`      | A `ChatThreadStore` over the REST endpoints                                    |
| `GuideAssistantModel.ts`   | Builds the threads and workspace models, and holds the library and the scope   |
| `GuideAssistantPanel.ts`   | The page: the kit's `chatWorkspace`, with the scope chip and suggestions       |
| `GuideDocumentModel.ts`    | The document viewer's model: loads a cited document, finds the passage         |
| `GuideDocumentView.ts`     | The document viewer, rendered in the workspace's side panel                    |
| `GuideStreams.fixtures.ts` | Streams in the server's format, for the specs                                  |

The server side is `GuideController`, `GuideService` and `GuideUrlMappings` in
`grails-app/*/io/xh/toolbox/guide`, with the documents in `src/main/resources/guide`.

## The backend

All endpoints are relative to the Toolbox server. Each user sees only their own chats.

| Call                                   | Request                                                 | Response                                                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST guide/query`                     | `{question, sessionId?, documentIds?, idempotencyKey?}` | `text/event-stream`, frames below                                                                                                                                  |
| `GET guide/chats`                      | -                                                       | `{chats: [{sessionId, title, lastActivityAt, isRunning}]}`, newest first                                                                                           |
| `GET guide/chats/{sessionId}/messages` | -                                                       | `{messages: [{queryId, question, answer, sources, sourceType, documentIds, createdAt, feedback?, comment?}]}`, oldest first. 404 for a chat the user does not have |
| `PATCH guide/chats/{sessionId}`        | `{title}`                                               | `{sessionId, title}`                                                                                                                                               |
| `DELETE guide/chats/{sessionId}`       | -                                                       | `{sessionId, deleted: true}`. 404 for a chat the user does not have                                                                                                |
| `PATCH guide/messages/{queryId}`       | `{rating: 'up' \| 'down' \| null, comment?}`            | `{queryId, rating}`. A down rating needs a comment                                                                                                                 |
| `GET guide/documents`                  | -                                                       | `{documents: [{documentId, documentName, passageCount}]}`                                                                                                          |
| `GET guide/documents/{documentId}`     | -                                                       | `{documentId, documentName, passages: [{id, text}]}`, in document order. 404 for a document the library does not have                                              |

Times are epoch seconds. Each frame of the query stream is `data: <json>`, with no `event` field:

| Frame                                                              | Meaning                                       | Codec output                                                                                                                                                           |
| ------------------------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chunk {text}`                                                     | The next piece of the answer                  | `TEXT_MESSAGE_CHUNK`                                                                                                                                                   |
| `reset {}`                                                         | Discard the answer so far. Chunks follow      | `xh.chat.textReplace` with empty text                                                                                                                                  |
| `final_summary {answer, sources, sourceType, queryId, duplicate?}` | The authoritative answer. Last, on success    | `xh.chat.textReplace`, an `xh.chat.source` per source (with `marker` and `metadata.excerpt`), `xh.chat.message {role: 'assistant', serverId: queryId}`, `RUN_FINISHED` |
| `final_summary` with `sourceType: 'none'`                          | Nothing found in the documents searched       | `xh.chat.textReplace` with empty text, then the kit's `xh.chat.noAnswer` data part, naming the documents searched, in place of the answer                              |
| `error {message}`                                                  | The answer failed                             | `RUN_ERROR`, code `guide-error`                                                                                                                                        |
| `duplicate_in_progress {message, retryAfterSeconds}`               | The idempotency key matches a run in progress | `RUN_ERROR`, code `duplicate-in-progress`, with `retryAfterSeconds`                                                                                                    |

How the emulator behaves:

- The browser mints the session id, and the first question creates the chat, titled from the
  question. A new chat therefore has no history: its load is a 404, which the kit reads as empty.
- Answers come from keyword retrieval over the passages, with `[n]` markers that match the
  sources. An answer from more than one document streams a short draft, resets, then streams the
  full answer. A question that matches no passage gets a fixed "not found" answer, with
  `sourceType: 'none'`. A question that contains `#fail` fails partway.
- The codec sends the turn id as the idempotency key. A retry while the run goes on gets
  `duplicate_in_progress`. A retry after it finished gets the stored `final_summary`, marked
  `duplicate`. A regenerate or an edit sends a key of its own, to get a new answer.
- A disconnect does not cancel a run. The run finishes, unstreamed, and saves its answer. So a
  chat detached from its turn shows the answer when it loads again, as the kit's server mode
  expects of a backend with no cancel.
- Storage is in memory, on one server node, keyed by Hoist username. It is demo storage only: not
  shared across a cluster, and lost on restart.

## Why `SseChatTransport`

The server speaks the backend's own dialect, Server-Sent Events, so the client reads it with
`SseChatTransport`. The codec is then the one place that knows the dialect. A Hoist proxy in front
of a real backend can pass the stream through, flushing per frame, with no parsing on the server.
`SseChatTransport` posts through `XH.fetch`, so requests keep Hoist's auth, correlation ids and
`FetchException` errors.

Re-framing as NDJSON for `HoistChatTransport` is the other option. It suits a proxy that already
parses the stream, for example to log or to filter it. It would add a translation on the server
and leave the codec unchanged in shape.

## Porting to a real backend

The real backend's contract may differ from the emulator's in a few places. Each has one home:

- **Identity and keys** - the Hoist server proxies the calls, adds the API key from config and the
  user's token, and throttles per user. The browser never calls the backend directly.
- **Scope in history** - the emulator returns each question's `documentIds`, which the store
  restores as the question's run options. A backend that does not store them needs the app to
  keep them by `queryId`.
- **Comments and clearing** - the emulator returns a rating's comment, and takes a null rating to
  clear one. A backend without either needs the store to omit the comment, and the UI to hide
  the clear.
- **External sources** - a source that is already a URL sets `url` and `sourceType: 'url'` in
  `toSourceFields()`, so the default click opens it in a new tab.
- **Documents** - the viewer shows the emulator's passages as text. A real library serves files,
  such as PDFs. Replace `GuideDocumentView` with a viewer for them, and keep the model's status
  reports. If the backend returns a page or a passage id with each source, pass it in the source's
  `metadata`, and locate by it rather than by the excerpt.
- **Leaked model markup** - a model that leaks tags such as `<thinking>` needs a `textTransform`
  on the chat, and the same clean-up in the store's mapping.
- **Paging and search** - the store lists every chat, loads every message and searches titles
  itself, as the backend has neither. A backend with cursors passes them through.

## The page

`GuideAssistantPanel` creates a `GuideAssistantModel` and renders the kit's `chatWorkspace` over
its `workspaceModel`. The Chat Kit app shows it on its Guideline Assistant tab. The component holds
no state.

- **Threads** - the kit's sidebar lists the chats by recency, with search, rename, delete and a
  running badge. New Chat starts a chat with the scope of the chat the user was in, from any of
  the workspace's buttons, as `createChatModel` reads the scope for a new chat.
- **Scope** - `chatScopeChip` in the composer, bound to `scope` and `setScope()`. Each question
  records its scope, and a chat opens with the scope of its last question.
- **Citations** - `citationMarkers: true` turns `[n]` into markers. Each source is a document, so
  a click on a marker or a source row opens it in the workspace's side panel.
- **Documents** - `GuideDocumentModel` follows the side panel's request. It loads the cited
  document once, finds the cited passage from the source's excerpt, and reports `opening`,
  `located`, `notLocated` or `error` to the panel. `GuideDocumentView` shows the document as one
  page, with the passage highlighted and scrolled into view.
- **Not found** - an answer with `sourceType: 'none'` shows the kit's fixed reply, which names the
  documents searched. Its only thumb is a down vote, meaning "it is in these documents".
- **Feedback** - thumbs on each answer. A down vote opens the kit's comment form, and saves only
  with its comment, as the backend requires one.
- **Empty state** - suggested questions, including one that shows the "not found" reply.
