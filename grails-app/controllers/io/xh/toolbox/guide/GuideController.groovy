package io.xh.toolbox.guide

import io.xh.hoist.exception.RoutineException
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

import static java.nio.charset.StandardCharsets.UTF_8

/**
 * Endpoints of the emulated guideline assistant, for the Chat Kit's server mode demo. See
 * GuideService for the stream dialect and the demo storage, and GuideUrlMappings for the routes.
 * Each user sees only their own chats, keyed by Hoist username.
 */
@AccessAll
class GuideController extends BaseController {

    def guideService

    /**
     * POST /guide/query
     * Body: `{question, sessionId?, documentIds?, idempotencyKey?}`.
     * Returns: `text/event-stream` - `data: <json>` frames with no `event` field, flushed one at a
     *      time. See GuideService for the frame types.
     *
     * Hoist's `renderNDJSON` buffers its output, which would hold back the stream, so this action
     * writes and flushes each frame itself. The response commits on the first frame, so an invalid
     * request renders a normal Hoist error response. A failure after the first frame ends the stream
     * with an `error` frame, as the dialect does.
     */
    def query() {
        def body = parseRequestJSON()

        response.contentType = 'text/event-stream'
        response.characterEncoding = 'UTF-8'
        response.setHeader('Cache-Control', 'no-cache')
        // Ask an nginx proxy not to buffer the stream.
        response.setHeader('X-Accel-Buffering', 'no')

        try {
            guideService.query(body, authUsername) { String frame -> writeFrame(frame) }
        } catch (Exception e) {
            if (!response.committed) throw e
            logWarn('Guide query failed after the answer started', [error: e])
            def message = e instanceof RoutineException ? e.message : 'The answer stopped on a server error.'
            writeFrame(JSONSerializer.serialize([type: 'error', message: message]))
        }
    }

    /**
     * GET /guide/chats
     * Returns: `{chats: [{sessionId, title, lastActivityAt, isRunning}]}`, most recently active
     *      first, with `lastActivityAt` in epoch seconds.
     */
    def listChats() {
        renderJSON(chats: guideService.listChats(authUsername))
    }

    /**
     * GET /guide/chats/{sessionId}/messages
     * Returns: `{messages: [{queryId, question, answer, sources, sourceType, documentIds, createdAt,
     *      feedback?, comment?}]}`, oldest first, with `createdAt` in epoch seconds. 404 for a chat
     *      the user does not have.
     */
    def listMessages(String sessionId) {
        renderJSON(messages: guideService.listMessages(authUsername, sessionId))
    }

    /**
     * PATCH /guide/chats/{sessionId}
     * Body: `{title}`, truncated to 80 characters.
     * Returns: `{sessionId, title}`.
     */
    def renameChat(String sessionId) {
        renderJSON(guideService.renameChat(authUsername, sessionId, parseRequestJSON().title as String))
    }

    /**
     * DELETE /guide/chats/{sessionId}
     * Returns: `{sessionId, deleted: true}`. 404 for a chat the user does not have.
     */
    def deleteChat(String sessionId) {
        renderJSON(guideService.deleteChat(authUsername, sessionId))
    }

    /**
     * PATCH /guide/messages/{queryId}
     * Body: `{rating: 'up' | 'down' | null, comment?}` - a comment is required for `down`.
     * Returns: `{queryId, rating}`.
     */
    def submitFeedback(String queryId) {
        def body = parseRequestJSON()
        renderJSON(guideService.submitFeedback(authUsername, queryId, body.rating as String, body.comment as String))
    }

    /**
     * GET /guide/documents
     * Returns: `{documents: [{documentId, documentName, passageCount}]}`.
     */
    def documents() {
        renderJSON(documents: guideService.listDocuments())
    }

    /**
     * GET /guide/documents/{documentId}
     * Returns: `{documentId, documentName, passages: [{id, text}]}`, the passages in document order.
     *      404 for a document the library does not have.
     */
    def showDocument(String documentId) {
        renderJSON(guideService.getDocument(documentId).formatWithPassages())
    }

    //------------------------
    // Implementation
    //------------------------
    /** Write one SSE frame and flush it. Returns false if the client has gone. */
    private boolean writeFrame(String json) {
        try {
            def out = response.outputStream
            out.write("data: $json\n\n".getBytes(UTF_8))
            out.flush()
            return true
        } catch (IOException ignored) {
            return false
        }
    }
}
