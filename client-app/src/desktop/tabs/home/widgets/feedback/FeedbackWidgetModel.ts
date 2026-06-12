import {HoistModel, PlainObject, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, runInAction} from '@xh/hoist/mobx';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {debounce} from 'lodash';

export type HoistRating = 'negative' | 'neutral' | 'positive';

/**
 * Auto-flush a sitting (unsubmitted) feedback rating after this idle period. The timer is reset on
 * each keystroke (see the reaction in the constructor), so an actively-typing user is never cut off.
 */
const INACTIVITY_TIMEOUT = 30 * SECONDS;

export class FeedbackWidgetModel extends HoistModel {
    @bindable rating: HoistRating = null;
    @bindable commentSent: boolean = false;
    @bindable comment: string = '';

    // True once this interaction's single track entry has been emitted - guards every capture path.
    private sent = false;

    // Inactivity timer. debounce() gives us reset-on-call semantics plus a .cancel().
    private scheduleFlush = debounce(() => this.flushAuto(), INACTIVITY_TIMEOUT);

    // Stable handler reference so add/removeEventListener target the same function.
    private onPageHide = () => this.beaconFlush();

    constructor() {
        super();
        makeObservable(this);
        // Reset the inactivity timer whenever the user types, so composing never trips it.
        this.addReaction({
            track: () => this.comment,
            run: () => {
                if (this.rating && !this.sent) this.scheduleFlush();
            }
        });
    }

    @action
    setRating(rating: HoistRating) {
        this.rating = rating;
        // Defer the track call: a rating plus a later comment must coalesce into ONE entry.
        this.scheduleFlush(); // start the inactivity timer
        window.addEventListener('pagehide', this.onPageHide); // unload backstop (see beaconFlush)
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
     * Page-teardown path. A normal fetch started during unload is routinely cancelled by the
     * browser, and would also race TrackService's own `beforeunload` flush. navigator.sendBeacon
     * posts the entry directly to the track endpoint - queued by the browser, surviving teardown -
     * bypassing TrackService's pending buffer entirely. Best-effort by design.
     */
    private beaconFlush() {
        if (this.sent || !this.rating) return;
        this.markSent();

        const userMessage = this.comment?.trim(),
            data: PlainObject = userMessage
                ? {rating: this.rating, userMessage}
                : {rating: this.rating},
            entry = {
                msg: this.trackMessage(data),
                category: 'Feedback',
                data,
                severity: 'INFO',
                clientUsername: XH.getUsername(),
                appVersion: XH.getEnv('clientVersion'),
                clientAppCode: XH.clientAppCode,
                loadId: XH.loadId,
                tabId: XH.tabId,
                url: window.location.href,
                timestamp: Date.now()
            },
            url = `${XH.baseUrl}xh/track?clientUsername=${encodeURIComponent(XH.getUsername())}`,
            body = new Blob([JSON.stringify({entries: [entry]})], {type: 'application/json'});

        navigator.sendBeacon(url, body);
    }

    private markSent() {
        this.sent = true;
        this.clearPending();
    }

    private clearPending() {
        this.scheduleFlush.cancel();
        window.removeEventListener('pagehide', this.onPageHide);
    }

    private trackMessage(data: PlainObject): string {
        return data.userMessage ? 'User submitted feedback' : `Hoist sentiment: ${data.rating}`;
    }
}
