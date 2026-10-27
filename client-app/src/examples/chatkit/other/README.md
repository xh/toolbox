# Other Chat Library

The kit's chat workspace and thread list around a conversation the kit does not run. It shows how
an app whose chat runs on another library, such as OpenUI, can move its outer chrome to the kit
and keep its conversation where it is.

## What to try

- **Select a thread.** The other library loads it from its own backend, and shows it in its own
  view, in the middle of the kit's workspace.
- **Ask with "slow" in the question, then select another thread.** The list shows the first
  thread as working. Go back while it streams, then leave again and let it finish. The list
  marks a new reply, and takes the title the backend gave the thread.
- **Ask with "fail", slowly, and leave.** The list marks the thread as failed, with the reason.
- **New Chat, rename, search and delete** all work from the kit's list, over the other library's
  backend.

## How it fits together

| Part                      | Role                                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OtherChatModel`          | Stands in for the other library, and the app's own model over it. It keeps its threads on an emulated backend and streams its own replies. It never uses the kit's chat engine. |
| `OtherChatConversation`   | The kit's `ChatConversation` for one thread. The threads model opens one for the selected thread, and for each thread whose reply still streams.                                |
| `OtherChatThreadStore`    | The kit's `ChatThreadStore`: list, rename and delete. It has no `loadMessagesAsync`, as each conversation loads its own messages.                                               |
| `OtherChatAssistantModel` | Creates the threads model with `createConversation`, and the workspace model. The other library shows one thread at a time, so a reaction keeps it on the selected thread.      |
| `OtherChatPanel`          | The kit's `chatWorkspace`, with the other library's view as its `conversationView`.                                                                                             |

Two rules from the kit's thread layer shape this code:

- `loadAsync()` runs only when a thread opens. A user who returns to a thread whose reply still
  streams finds its conversation open, so the other library follows `selectedThreadId` to know
  which thread to show.
- When a reply ends while the user reads another thread, the kit closes that thread's
  conversation at once. The model therefore saves the thread before it marks the reply done.

See "Use a conversation of the app's own" in the kit's `threads` README.
