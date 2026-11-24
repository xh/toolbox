### New Features

* Added a Chat Kit tab to the desktop app, a tour of `@xh/hoist-chat-kit`, XH's new library of chat
  components for Hoist apps. Each major component has a playground, and scripted conversations run
  without a server or model. Two integration pages show a full `chatWorkspace` and a live Claude
  chat with tools that act on the app.
* Added the Chat Kit docs to the Docs tab, with a `$CK` link token that opens them.

### Technical

* Added `LlmService` and a `/llm/stream` endpoint that relay the Anthropic Messages API for the
  Live Model demo. Access needs the `TOOLBOX_LLM_USER` role. An hourly limit applies unless the user
  has `TOOLBOX_LLM_UNLIMITED`. Configure it with the `llmApiKey` and `llmConfig` configs.

### Libraries

* @xh/hoist-chat-kit `3.0` - new
