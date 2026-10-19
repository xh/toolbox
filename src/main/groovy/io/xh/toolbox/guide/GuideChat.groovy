package io.xh.toolbox.guide

import io.xh.hoist.json.JSONFormat

import java.util.concurrent.CopyOnWriteArrayList

/**
 * One conversation with the guideline assistant, under the session id the client minted. Holds its
 * messages - one record per question and answer - and counts the runs in progress, so the chat list
 * can show it as running.
 */
class GuideChat implements JSONFormat {

    /** Most answers a chat keeps. The oldest go first. */
    static final int MAX_MESSAGES = 100

    final String sessionId
    final long createdAt = System.currentTimeMillis()
    final List<Map> messages = new CopyOnWriteArrayList<>()

    volatile String title
    volatile long lastActivityAt = createdAt
    private int activeRuns = 0

    GuideChat(String sessionId, String title) {
        this.sessionId = sessionId
        this.title = title
    }

    synchronized void startRun() {
        activeRuns++
        lastActivityAt = System.currentTimeMillis()
    }

    synchronized void endRun() {
        activeRuns--
    }

    synchronized boolean isRunning() {
        activeRuns > 0
    }

    /** Record a finished answer, keeping the chat's last {@link #MAX_MESSAGES}. */
    synchronized void addMessage(Map message) {
        messages << message
        if (messages.size() > MAX_MESSAGES) messages.remove(0)
        lastActivityAt = System.currentTimeMillis()
    }

    /** As the chat list returns it - `lastActivityAt` in epoch seconds, as the dialect has it. */
    Map formatForJSON() {
        return [
            sessionId     : sessionId,
            title         : title,
            lastActivityAt: lastActivityAt.intdiv(1000),
            isRunning     : running
        ]
    }
}
