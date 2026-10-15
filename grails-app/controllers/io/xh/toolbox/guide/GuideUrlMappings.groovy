package io.xh.toolbox.guide

/**
 * Resource-style routes for GuideController, matching the API of the guideline assistant it
 * emulates. Hoist's default `/$controller/$action/$id` mapping cannot express a path such as
 * `/guide/chats/{sessionId}/messages`, or pick an action by HTTP method.
 */
class GuideUrlMappings {

    static mappings = {
        group "/guide", {
            post "/query"(controller: "guide", action: "query")
            get "/chats"(controller: "guide", action: "listChats")
            get "/chats/$sessionId/messages"(controller: "guide", action: "listMessages")
            "/chats/$sessionId"(controller: "guide", action: [PATCH: "renameChat", DELETE: "deleteChat"])
            patch "/messages/$queryId"(controller: "guide", action: "submitFeedback")
            get "/documents"(controller: "guide", action: "documents")
            get "/documents/$documentId"(controller: "guide", action: "showDocument")
        }
    }
}
