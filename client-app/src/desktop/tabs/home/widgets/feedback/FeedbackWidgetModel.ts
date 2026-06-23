import {HoistModel, PlainObject, XH} from '@xh/hoist/core';
import {action, bindable, runInAction} from '@xh/hoist/mobx';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {debounce} from 'lodash';

export type HoistRating = 'negative' | 'neutral' | 'positive';

/**
 * Auto-flush a sitting (unsubmitted) feedback rating after this idle period. The timer is reset on
 * each keystroke (see the reaction in the constructor), so an actively-typing user is never cut off.
 */
const INACTIVITY_TIMEOUT = 30 * SECONDS;

export class FeedbackWidgetModel extends HoistModel {
    @bindable accessor rating: HoistRating = null;
    @bindable accessor commentSent: boolean = false;
    @bindable accessor comment: string = '';

    // True once this interaction's single track entry has been emitted - guards every capture path.
    private sent = false;

    // Inactivity timer. debounce() gives us reset-on-call semantics plus a .cancel().
    private scheduleFlush = debounce(() => this.flushAuto(), INACTIVITY_TIMEOUT);

    constructor() {
        super();
        // Reset the inactivity timer whenever the user types, so composing never trips it.
        this.addReaction({
            track: () => this.comment,
            run: () => {
                if (this.rating && !this.sent) this.scheduleFlush();
            }
        });
        // Capture an unsent rating on real page teardown via Hoist's managed page-lifecycle
        // observable. We react to the terminal states only - NOT 'hidden', since a benign tab
        // switch must not finalize a still-composing entry (unloadFlush self-guards otherwise).
        this.addReaction({
            track: () => XH.pageState,
            run: state => {
                if (state === 'frozen' || state === 'terminated') this.unloadFlush();
            }
        });
    }

    @action
    setRating(rating: HoistRating) {
        this.rating = rating;
        // Defer the track call: a rating plus a later comment must coalesce into ONE entry.
        // The inactivity timer and the pageState reaction (set up in the constructor) handle the
        // auto/unload capture paths; both self-guard on `rating`/`sent`.
        this.scheduleFlush();
    }

    skipComment() {
        // Explicit "no comment" - emit sentiment only, ignoring any stray draft text.
        this.sendAliveAsync({rating: this.rating}, {showToast: false});
    }

    async submitCommentAsync() {
        // Explicit submit - include the written comment when present.
        const userMessage = this.comment?.trim();
        await this.sendAliveAsync(
            userMessage ? {rating: this.rating, userMessage} : {rating: this.rating},
            {showToast: true}
        );
    }

    @action
    reset() {
        this.clearPending();
        this.sent = false;
        this.rating = null;
        this.commentSent = false;
        this.comment = '';
    }

    override destroy() {
        // In-app navigation unmounts the widget WITHOUT firing `pagehide`. Capture any unsent
        // rating here while the page is still alive (a normal request completes fine).
        this.flushAuto();
        this.clearPending();
        super.destroy();
    }

    //------------------------
    // Implementation
    //------------------------

    /** Page-alive send path: queue via TrackService and flush immediately. */
    private async sendAliveAsync(data: PlainObject, {showToast}: {showToast: boolean}) {
        if (this.sent || !this.rating) return;
        this.markSent();
        XH.track({category: 'Feedback', message: this.trackMessage(data), data, logData: true});
        runInAction(() => {
            this.comment = '';
            this.commentSent = true;
        });
        try {
            await XH.trackService.pushPendingAsync();
            if (showToast) XH.successToast('Thank you - your feedback has been sent!');
        } catch (e) {
            XH.handleException(e, {showAlert: false});
        }
    }

    /** Inactivity-timer / unmount path: capture the rating plus any sitting draft, no toast. */
    private flushAuto() {
        if (this.sent || !this.rating) return;
        const userMessage = this.comment?.trim();
        this.sendAliveAsync(
            userMessage ? {rating: this.rating, userMessage} : {rating: this.rating},
            {showToast: false}
        );
    }

    /**
     * Page-teardown path, driven by the `XH.pageState` reaction on `frozen`/`terminated`. We defer
     * queueing to coalesce, so here we queue the entry and flush it immediately. `TrackService`
     * routes the flush through a `keepalive` request once the page is non-visible, so it survives
     * teardown while reusing the framework's auth/serialization.
     *
     * The explicit flush guarantees this entry lands in the same teardown tick, regardless of
     * ordering with TrackService's own page-hidden flush. Reacting to the terminal states only (not
     * `hidden`) means a mid-compose tab switch does not prematurely finalize a sentiment-only entry.
     */
    private unloadFlush() {
        if (this.sent || !this.rating) return;
        this.markSent();

        const userMessage = this.comment?.trim(),
            data: PlainObject = userMessage
                ? {rating: this.rating, userMessage}
                : {rating: this.rating};
        XH.track({category: 'Feedback', message: this.trackMessage(data), data, logData: true});
        XH.trackService.pushPendingAsync();
    }

    private markSent() {
        this.sent = true;
        this.clearPending();
    }

    private clearPending() {
        this.scheduleFlush.cancel();
    }

    private trackMessage(data: PlainObject): string {
        return `Hoist feedback: ${data.rating}`;
    }
}
