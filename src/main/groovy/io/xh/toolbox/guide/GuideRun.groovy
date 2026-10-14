package io.xh.toolbox.guide

/**
 * One answer run, held under its idempotency key so that a retry with the same key gets the run's
 * result rather than a second run: `duplicate_in_progress` while it runs, its `final_summary` once
 * it has finished. A failed run frees its key for a fresh attempt.
 */
class GuideRun {

    final long createdAt = System.currentTimeMillis()

    /** When the run expects to finish, in epoch millis - for `retryAfterSeconds`. */
    volatile long expectedEndAt = createdAt

    /** The `final_summary` frame, once the run has finished. */
    volatile Map finalSummary

    volatile boolean failed = false

    boolean isRunning() {
        !finalSummary && !failed
    }

    /** Whole seconds until the run expects to finish, at least one. */
    int getSecondsLeft() {
        Math.max(1, Math.ceil((expectedEndAt - System.currentTimeMillis()) / 1000d) as int)
    }
}
