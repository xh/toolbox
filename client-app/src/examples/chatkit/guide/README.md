# Guideline Assistant

The client plumbing for a server-mode demo of `@xh/hoist-chat-kit`: a guideline assistant that
answers questions over a small document library, with numbered citations. The backend owns the
conversations. The browser sends one question per turn and renders the stream.

It is the reference recipe for porting a retrieval-augmented (RAG) assistant into a Hoist app.
The Toolbox server emulates the backend, so the recipe runs with no external service and no LLM.

There is no UI yet. The kit's thread list and workspace components come after a design handoff.
See [What the UI step adds](#what-the-ui-step-adds).

## Architecture

```
GuideAssistantModel (HoistModel)
├── threadsModel: ChatThreadsModel        # The user's chats, one ChatModel per open chat
│   ├── store: GuideThreadStore           # REST: list, history, rename, delete, feedback
│   └── createChatModel → ChatModel       # historyMode 'server', feedback with comments
│       └── SseChatTransport('guide/query')
│           └── codec: GuideCodec         # The stream dialect <-> kit events
├── documents: GuideDocument[]            # The library, for a scope picker
├── scope / setScope()                    # The selected chat's runOptions.scope
├── newThread()                           # A new chat, with the current chat's scope
└── viewedSource / showSource()           # The onSourceClick seam, for a document viewer
```

| File                       | Role                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| `GuideApi.ts`              | Wire types, and `toSourceFields()`, which maps a cited passage to a kit source |
| `GuideCodec.ts`            | A server-mode `ChatCodec` for the stream dialect                               |
| `GuideThreadStore.ts`      | A `ChatThreadStore` over the REST endpoints                                    |
| `GuideAssistantModel.ts`   | Builds the `ChatThreadsModel`, and holds the library and the scope             |
| `GuideStreams.fixtures.ts` | Streams recorded from the server, for the specs                                |

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

Times are epoch seconds. Each frame of the query stream is `data: <json>`, with no `event` field:

| Frame                                                              | Meaning                                       | Codec output                                                                                                                                                           |
| ------------------------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chunk {text}`                                                     | The next piece of the answer                  | `TEXT_MESSAGE_CHUNK`                                                                                                                                                   |
| `reset {}`                                                         | Discard the answer so far. Chunks follow      | `xh.chat.textReplace` with empty text                                                                                                                                  |
| `final_summary {answer, sources, sourceType, queryId, duplicate?}` | The authoritative answer. Last, on success    | `xh.chat.textReplace`, an `xh.chat.source` per source (with `marker` and `metadata.excerpt`), `xh.chat.message {role: 'assistant', serverId: queryId}`, `RUN_FINISHED` |
| `error {message}`                                                  | The answer failed                             | `RUN_ERROR`, code `guide-error`                                                                                                                                        |
| `duplicate_in_progress {message, retryAfterSeconds}`               | The idempotency key matches a run in progress | `RUN_ERROR`, code `duplicate-in-progress`, with `retryAfterSeconds`                                                                                                    |

How the emulator behaves:

- The browser mints the session id, and the first question creates the chat, titled from the
  question. A new chat therefore has no history: its load is a 404, which the kit reads as empty.
- Answers come from keyword retrieval over the passages, with `[n]` markers that match the
  sources. An answer from more than one document streams a short draft, resets, then streams the
  full answer. A question that contains `#fail` fails partway.
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
- **External sources** - a source that is already a URL sets `url` in `toSourceFields()`, so the
  default click opens it.
- **Leaked model markup** - a model that leaks tags such as `<thinking>` needs a `textTransform`
  on the chat, and the same clean-up in the store's mapping.
- **Paging and search** - the store lists every chat, loads every message and searches titles
  itself, as the backend has neither. A backend with cursors passes them through.

## Not yet wired into the app

The folder builds, lints and tests against the published kit, but no entry point imports it yet,
so the app build leaves it out. The UI step below wires it in.

## What the UI step adds

- A page or demo in the Chat Kit app that creates a `GuideAssistantModel`, and loads it.
- The kit's thread list, bound to `threadsModel`: recency groups, search, rename, delete with a
  confirm, a running badge, and New chat wired to `model.newThread()`.
- The conversation panel for `threadsModel.chatModel`, with `citationMarkers: true` and
  `onSourceClick: source => model.showSource(source)`.
- A document scope picker over `documents`, bound to `scope` and `setScope()`.
- A feedback row on each answer. The chat asks for a comment on a down rating, and requires one.
- A source viewer for `viewedSource`, showing the cited passage in its document.
- Suggested questions in the empty state.
