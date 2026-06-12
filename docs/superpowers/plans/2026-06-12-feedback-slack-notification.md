# Feedback Slack Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route desktop home-page feedback to Slack as a second push channel alongside email, while coalescing each feedback interaction into a single track entry so no consumer double-fires.

**Architecture:** The client widget (`FeedbackWidgetModel`) defers its track call and emits exactly one `Feedback` entry per interaction via an inactivity timer + `pagehide` `sendBeacon` backstop. The server `SlackAlertService` gains a `Feedback` branch that posts a Block Kit message, and its config moves to a typed `SlackAlertConfig` (`TypedConfigMap`) with explicit per-notification-type enable flags, all disabled by default.

**Tech Stack:** Grails/Groovy (hoist-core: `BaseService`, `TypedConfigMap`, `ConfigSpec`, `JSONClient`, Slack Web API), TypeScript/MobX (hoist-react: `HoistModel`, `XH.track`, `navigator.sendBeacon`).

**Design spec:** `docs/superpowers/specs/2026-06-12-feedback-slack-notification-design.md`

**Branch:** `atm/feedback-slack-notification`

---

## Testing reality (read first)

This branch is cut from `develop`, which has **no automated test harness**: no client unit runner, no server Spock tests, and the `playwright/` suite lives only on the unmerged `atm/playwright-setup` branch. Verification in this plan is therefore **manual** (run the app, drive the widget, observe the Admin Console activity log + Slack). Automated Playwright coverage is a **follow-up** for when that suite merges to `develop` (see the closing note). Each task lists concrete manual verification steps in place of automated test steps.

**To run the app locally (used throughout):**
- Terminal 1 (repo root): `./gradlew bootRun` (server on :8080)
- Terminal 2 (`client-app/`): `yarn start` (dev server on :3000)
- Desktop app: http://localhost:3000/app
- Admin Console: http://localhost:3000/admin (Activity Tracking and Config tabs are used below)

---

## File Structure

**Server (Groovy):**
- Create `grails-app/services/io/xh/toolbox/SlackAlertConfig.groovy` - the typed config class.
- Modify `grails-app/init/io/xh/toolbox/BootStrap.groovy` - register `slackAlertConfig` via `ConfigSpec(typedClass:)`.
- Modify `grails-app/services/io/xh/toolbox/SlackAlertService.groovy` - typed reads, per-type flags, feedback branch, Block Kit.

**Client (TypeScript):**
- Modify `client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidgetModel.ts` - single-entry coalescing.
- Modify `client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidget.ts` - `commitOnChange` on the textarea.

**Docs:**
- Modify `CHANGELOG.md`.

---

## Task 1: Typed `SlackAlertConfig` + bootstrap the config

Introduces Toolbox's first `TypedConfigMap` and declares `slackAlertConfig` in the config inventory with cleanly-disabled defaults.

**Files:**
- Create: `grails-app/services/io/xh/toolbox/SlackAlertConfig.groovy`
- Modify: `grails-app/init/io/xh/toolbox/BootStrap.groovy` (insert a `ConfigSpec` after the `recallsHost` entry, currently ending at line 244)

- [ ] **Step 1: Create the typed config class**

Create `grails-app/services/io/xh/toolbox/SlackAlertConfig.groovy` (mirrors the framework's `ClientErrorConfig` pattern - plain class, no `@CompileStatic`, `init(args)` in the constructor body):

```groovy
package io.xh.toolbox

import io.xh.hoist.config.TypedConfigMap

/**
 * Typed representation of the `slackAlertConfig` soft config, controlling Slack notifications for
 * monitor status reports, client-error reports, and user feedback.
 *
 * Everything is disabled by default: set `enabled` plus the relevant per-type flag(s) and target
 * channel(s) to begin posting. This is Toolbox's reference example of hoist-core's `TypedConfigMap`
 * typed soft-config feature - read via `configService.getObject(SlackAlertConfig)`.
 */
class SlackAlertConfig extends TypedConfigMap {

    /** Master switch - when false (the default), the service posts nothing at all. */
    boolean enabled = false

    /** Slack bot OAuth token (xoxb-...). Required for any posting. */
    String oauthToken = null

    /** Channel for monitor status + client-error alerts (e.g. '#toolbox-alerts'). */
    String channel = null

    /** Optional separate channel for user feedback; falls back to `channel` when blank. */
    String feedbackChannel = null

    /** Post monitor status reports (gated under `enabled`). */
    boolean monitorAlertsEnabled = false

    /** Post client-error reports (gated under `enabled`). */
    boolean clientErrorsEnabled = false

    /** Post user feedback (gated under `enabled`). */
    boolean feedbackEnabled = false

    SlackAlertConfig(Map args) { init(args) }
}
```

- [ ] **Step 2: Register the config in BootStrap**

In `grails-app/init/io/xh/toolbox/BootStrap.groovy`, insert this `ConfigSpec` into the `ensureRequiredConfigsCreated([...])` list, immediately after the `recallsHost` entry (the entry that ends with `groupName: 'Toolbox - Example Apps'` around line 243-244) and before the `sourceUrls` entry. `SlackAlertConfig` needs no import - it shares the `io.xh.toolbox` package with `BootStrap`:

```groovy
            new ConfigSpec(
                name: 'slackAlertConfig',
                valueType: 'json',
                defaultValue: [
                    enabled: false,
                    oauthToken: null,
                    channel: null,
                    feedbackChannel: null,
                    monitorAlertsEnabled: false,
                    clientErrorsEnabled: false,
                    feedbackEnabled: false
                ],
                typedClass: SlackAlertConfig,
                groupName: 'Slack Integration',
                note: 'Slack bot token + target channels for monitor alerts, client-error reports, and user feedback. All disabled by default; set enabled plus the specific per-type flag(s) and channel(s) to post.'
            ),
```

- [ ] **Step 3: Verify the app starts and the config is created/typed**

Run: `./gradlew bootRun`
Expected:
- Server starts with **no** startup `WARN` about `SlackAlertConfig` (a drift warning would mean the class defaults disagree with the `ConfigSpec` `defaultValue` - they must match exactly).
- In the Admin Console (http://localhost:3000/admin) Configs tab, a `slackAlertConfig` entry appears under group **Slack Integration** with all flags false and null channels/token.

- [ ] **Step 4: Verify typed read via the Grails console**

Run: `./gradlew console` and evaluate:

```groovy
io.xh.hoist.config.ConfigService cs = ctx.getBean('configService')
def c = cs.getObject(io.xh.toolbox.SlackAlertConfig)
println([enabled: c.enabled, feedbackEnabled: c.feedbackEnabled, channel: c.channel, feedbackChannel: c.feedbackChannel])
```

Expected output: `[enabled:false, feedbackEnabled:false, channel:null, feedbackChannel:null]`

- [ ] **Step 5: Commit**

```bash
git add grails-app/services/io/xh/toolbox/SlackAlertConfig.groovy grails-app/init/io/xh/toolbox/BootStrap.groovy
git commit -m "Add typed SlackAlertConfig and bootstrap slackAlertConfig"
```

---

## Task 2: Refactor `SlackAlertService` to typed reads + per-type flags

Switches the service from untyped `getMap` to `getObject(SlackAlertConfig)`, gates each existing path on its own flag, and generalizes `sendSlackMessage` to take an explicit channel and optional Block Kit `blocks`. No feedback handling yet - this keeps the diff reviewable and leaves existing behavior intact (now flag-gated).

**Files:**
- Modify: `grails-app/services/io/xh/toolbox/SlackAlertService.groovy`

- [ ] **Step 1: Replace `getConfig()`, `getEnabled()`, and gate the existing send methods**

In `SlackAlertService.groovy`:

Replace the `getConfig()` method:

```groovy
    private SlackAlertConfig getConfig() {
        return configService.getObject(SlackAlertConfig)
    }
```

Replace the `getEnabled()` method (drops the `Utils.isLocalDevelopment` guard - safe now that everything defaults off and must be explicitly enabled):

```groovy
    private boolean getEnabled() {
        return config.enabled && config.oauthToken
    }
```

Update the guard at the top of `sendMonitorStatusReport`:

```groovy
    private void sendMonitorStatusReport(MonitorStatusReport report) {
        if (!enabled || !config.monitorAlertsEnabled) return
```

Update the guard at the top of `sendClientErrorReport`:

```groovy
    private void sendClientErrorReport(TrackLog tl) {
        if (!enabled || !config.clientErrorsEnabled) return
```

- [ ] **Step 2: Generalize `sendSlackMessage` to take a channel + optional blocks**

Replace the entire `sendSlackMessage` method:

```groovy
    private void sendSlackMessage(String channel, String text, List blocks = null) {
        span('sendMessage').run {
            def client = new JSONClient(),
                post = new HttpPost('https://slack.com/api/chat.postMessage'),
                payload = [channel: channel, text: text]
            if (blocks) payload.blocks = blocks

            def entity = new StringEntity(JSONSerializer.serialize(payload))
            post.setHeader('Content-type', 'application/json')
            post.setHeader('Authorization', "Bearer ${config.oauthToken}")
            post.setEntity(entity)

            client.executeAsMap(post)
        }
    }
```

- [ ] **Step 3: Update the two existing callers to pass `config.channel`**

In `sendMonitorStatusReport`, change the `sendSlackMessage(...)` call to pass the channel as the first argument:

```groovy
        sendSlackMessage(config.channel, """
Monitor Status Report:
${report.title}
${alertSummary(report)}
        """)
```

In `sendClientErrorReport`, likewise:

```groovy
        sendSlackMessage(config.channel, """
Client Error Report:
Error: ${tl.errorSummary}
User: ${tl.username}
Version: ${tl.appVersion}
Environment: ${tl.appEnvironment}
Browser: ${tl.browser}
Device: ${tl.device}
URL: ${tl.url}
Time: ${tl.dateCreated.format('dd-MMM-yyyy HH:mm:ss')}
---------------------------------
        """)
```

- [ ] **Step 4: Verify the app compiles and starts**

Run: `./gradlew bootRun`
Expected: server starts cleanly. With `slackAlertConfig` still all-false, `getEnabled()` returns false and no Slack calls are attempted (no behavior change visible without config).

- [ ] **Step 5: Commit**

```bash
git add grails-app/services/io/xh/toolbox/SlackAlertService.groovy
git commit -m "SlackAlertService: typed config reads and per-type enable flags"
```

---

## Task 3: Add the feedback branch + Block Kit message

Subscribes the feedback category and posts a richly formatted Block Kit message to the feedback channel.

**Files:**
- Modify: `grails-app/services/io/xh/toolbox/SlackAlertService.groovy`

- [ ] **Step 1: Route `Feedback` track entries in the `xhTrackReceived` subscription**

In `init()`, update the `xhTrackReceived` subscription's `onMessage` closure to add the feedback branch:

```groovy
        subscribeToTopic(
            topic: 'xhTrackReceived',
            onMessage: {TrackLog tl ->
                if (tl.isClientError) sendClientErrorReport(tl)
                else if (tl.category == 'Feedback') sendFeedbackReport(tl)
            },
            primaryOnly: true
        )
```

- [ ] **Step 2: Add `sendFeedbackReport` and its Block Kit helpers**

Add these methods to the `// Implementation` section of `SlackAlertService.groovy` (after `sendClientErrorReport`). `Utils.appName` / `Utils.appCode` are available via the existing `import io.xh.hoist.util.Utils`:

```groovy
    private void sendFeedbackReport(TrackLog tl) {
        if (!enabled || !config.feedbackEnabled) return

        def data = tl.dataAsObject ?: [:],
            rating = data.rating as String,
            userMessage = data.userMessage as String,
            channel = config.feedbackChannel ?: config.channel

        if (!channel) {
            logWarn('Feedback received but no Slack channel configured', [user: tl.username])
            return
        }

        sendSlackMessage(channel, feedbackFallbackText(tl, rating, userMessage), feedbackBlocks(tl, rating, userMessage))
    }

    private List feedbackBlocks(TrackLog tl, String rating, String userMessage) {
        def blocks = [
            [type: 'header', text: [type: 'plain_text', text: ':speech_balloon: User Feedback', emoji: true]],
            [type: 'section', text: [type: 'mrkdwn', text: "*Sentiment:* ${ratingEmoji(rating)} ${rating ?: 'n/a'}".toString()]]
        ]
        if (userMessage) {
            def quoted = userMessage.replaceAll('\n', '\n> ')
            blocks << [type: 'section', text: [type: 'mrkdwn', text: "> ${quoted}".toString()]]
        }
        blocks << [type: 'context', elements: [[type: 'mrkdwn', text: feedbackMeta(tl)]]]
        return blocks
    }

    private String ratingEmoji(String rating) {
        switch (rating) {
            case 'positive': return ':smiley:'
            case 'neutral':  return ':neutral_face:'
            case 'negative': return ':slightly_frowning_face:'
            default:         return ':grey_question:'
        }
    }

    private String feedbackMeta(TrackLog tl) {
        [
            "*User:* ${tl.username}",
            "*App:* ${Utils.appName} (${Utils.appCode})",
            "*Version:* ${tl.appVersion}",
            "*Env:* ${tl.appEnvironment}",
            "*Browser:* ${tl.browser}",
            "*Device:* ${tl.device}",
            "*Submitted:* ${tl.dateCreated.format('dd-MMM-yyyy HH:mm:ss')}"
        ].join('  |  ').toString()
    }

    private String feedbackFallbackText(TrackLog tl, String rating, String userMessage) {
        def parts = ["User Feedback from ${tl.username}"]
        if (rating) parts << "(${rating})"
        if (userMessage) parts << "- ${userMessage}"
        return parts.join(' ').toString()
    }
```

- [ ] **Step 3: Verify end-to-end against a real Slack workspace (primary)**

Prerequisite: a Slack bot token (`xoxb-...`) for a workspace where the bot is invited to a test channel.

1. In the Admin Console Configs tab, edit `slackAlertConfig` to:
   `{"enabled": true, "oauthToken": "xoxb-...", "channel": "#your-test-channel", "feedbackChannel": "#your-test-channel", "feedbackEnabled": true, "monitorAlertsEnabled": false, "clientErrorsEnabled": false}`
2. In the desktop app (http://localhost:3000/app) home page, click a sentiment face in the feedback widget, type a comment, and click **Send to XH**.
3. Expected: one Block Kit message in the channel - a "User Feedback" header, a sentiment line with the matching emoji, the quoted comment, and a metadata context line.

- [ ] **Step 4: Verify the payload by log inspection (fallback, no token needed)**

If no Slack token is available, temporarily add a log line at the top of `sendSlackMessage` to inspect the serialized payload, then exercise the widget and read the server log:

```groovy
    private void sendSlackMessage(String channel, String text, List blocks = null) {
        logInfo('Slack payload', JSONSerializer.serialize([channel: channel, text: text, blocks: blocks]))   // TEMP - remove before commit
        span('sendMessage').run {
```

With config `enabled: true, feedbackEnabled: true, oauthToken: 'xoxb-test', feedbackChannel: '#test'`, submit feedback and confirm the logged JSON contains the expected `blocks` structure. **Remove the temporary log line before committing.**

- [ ] **Step 5: Commit**

```bash
git add grails-app/services/io/xh/toolbox/SlackAlertService.groovy
git commit -m "SlackAlertService: post user feedback to Slack via Block Kit"
```

---

## Task 4: Client-side single-entry coalescing in `FeedbackWidgetModel`

Replaces the immediate-on-click track call with deferred, coalesced emission: one entry per interaction via an inactivity timer (reset on each keystroke), an explicit-action path, and an unmount flush. The `pagehide` beacon backstop is added in Task 5.

**Files:**
- Modify: `client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidgetModel.ts`
- Modify: `client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidget.ts` (textarea `commitOnChange`)

- [ ] **Step 1: Rewrite `FeedbackWidgetModel.ts`**

Replace the entire file contents. (The `beaconFlush` body is a stub here that no-ops; Task 5 fills it in. `onPageHide`/listener wiring is included now so Task 5 only changes one method.)

```typescript
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

    @action
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
        await XH.trackService.pushPendingAsync();
        if (showToast) XH.successToast('Thank you - your feedback has been sent!');
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

    /** Page-teardown path - filled in by Task 5. */
    private beaconFlush() {
        if (this.sent || !this.rating) return;
        // (Task 5 posts the entry via navigator.sendBeacon here.)
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
```

- [ ] **Step 2: Make the textarea commit on every keystroke**

In `client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidget.ts`, add `commitOnChange: true` to the `textArea({...})` config inside `commentPrompt` so the `comment` observable updates per keystroke (required for the inactivity-timer reset reaction to see typing live):

```typescript
                textArea({
                    bind: 'comment',
                    commitOnChange: true,
                    placeholder: negative
                        ? 'What is missing, broken, or confusing?'
                        : 'Optional - a sentence or two is plenty.',
                    flex: 1,
                    width: '100%',
                    autoFocus: negative
                }),
```

- [ ] **Step 3: Verify the build and type-check**

Run (from `client-app/`): `yarn lint:code`
Expected: no errors in `FeedbackWidgetModel.ts` / `FeedbackWidget.ts`.

- [ ] **Step 4: Verify single-entry coalescing in the app**

Run the app. Open the Admin Console Activity Tracking tab (http://localhost:3000/admin) in one window and the desktop app home page in another. Filter activity by category `Feedback`.

- Case A (submit): click a face, type a comment, click **Send to XH**. Expect **one** new `Feedback` entry, `data` containing both `rating` and `userMessage`. A success toast appears.
- Case B (skip): click a face, click **Skip**. Expect **one** entry with `data.rating` only, no `userMessage`, no toast.
- Case C (inactivity): click a face, type a few characters, wait ~30s without typing. Expect the widget to switch to the "Thanks" state and **one** entry to appear carrying `rating` plus the typed text. While actively typing, confirm it does **not** flip to Thanks (timer resets per keystroke).
- Case D (in-app nav): click a face (do not submit), then navigate to another desktop tab and back. Expect **one** sentiment-only entry (the unmount flush), not two, and none lost.

- [ ] **Step 5: Commit**

```bash
git add client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidgetModel.ts client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidget.ts
git commit -m "FeedbackWidget: coalesce each interaction into a single track entry"
```

---

## Task 5: `pagehide` `sendBeacon` backstop

Captures the "clicked a rating then closed the tab / navigated away within the idle window" case reliably, using `navigator.sendBeacon` so the request survives page teardown.

**Files:**
- Modify: `client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidgetModel.ts`

- [ ] **Step 1: Implement `beaconFlush`**

Replace the `beaconFlush` stub from Task 4 with the real implementation. The entry shape mirrors `TrackService.toServerJson`; the server enriches the remaining columns from request headers. The beacon carries the session cookie automatically (same-origin) and the endpoint needs no XSRF header:

```typescript
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
```

- [ ] **Step 2: Verify the build and type-check**

Run (from `client-app/`): `yarn lint:code`
Expected: no errors.

- [ ] **Step 3: Verify the beacon fires and persists on tab close**

Run the app. On the home page, open DevTools → Network and filter for `track`.
- Click a sentiment face (do **not** submit/skip), then immediately close the browser tab (or navigate the whole window to another URL).
- Expected: a `POST` to `xh/track` of request type `ping` (the `sendBeacon` request) is issued at unload.
- Reopen the app, go to Admin Console Activity Tracking, filter `Feedback`: the sentiment entry from the closed tab is present.
- Confirm **no duplicate**: a normal submit/skip/inactivity flush before leaving means `pagehide` finds `sent === true` and issues no beacon.

- [ ] **Step 4: Commit**

```bash
git add client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidgetModel.ts
git commit -m "FeedbackWidget: sendBeacon backstop to capture feedback on page unload"
```

---

## Task 6: CHANGELOG

**Files:**
- Modify: `CHANGELOG.md` (under the existing `## 9.0-SNAPSHOT - unreleased` heading)

- [ ] **Step 1: Add a New Features bullet**

Under the `### New Features` list in the `9.0-SNAPSHOT` section, add (single line - the changelog parser drops wrapped/continuation lines):

```
* Added Slack as a second channel for home-page user feedback: feedback now posts a Block Kit message to a configurable Slack channel alongside the existing email notification, demonstrating an outbound Slack integration via the Slack Web API.
```

- [ ] **Step 2: Add Technical bullets**

Under the `### Technical` list, add (each a single line):

```
* The feedback widget now coalesces each interaction (sentiment click plus optional comment) into a single activity-tracking entry on the client, using a typing-reset inactivity timer and a `navigator.sendBeacon` backstop on page unload - eliminating duplicate feedback emails/Slack posts and demonstrating reliable capture during teardown.
* Adopted hoist-core's `TypedConfigMap` for `slackAlertConfig` (Toolbox's first use of typed soft-config value access via `ConfigService.getObject`), and gave the Slack service explicit per-notification-type enable flags (`monitorAlertsEnabled`, `clientErrorsEnabled`, `feedbackEnabled`), all disabled by default. Note: existing deployed `slackAlertConfig` entries must set `monitorAlertsEnabled`/`clientErrorsEnabled` to true to keep posting those alerts.
```

- [ ] **Step 3: Verify the changelog renders**

Run (from `client-app/`): `yarn start`, then in the desktop app open the changelog dialog (Admin/About area, or trigger via the version footer). Confirm the new bullets render in full (no truncation), which verifies each is a single line.

- [ ] **Step 4: Commit**

```bash
git add CHANGELOG.md
git commit -m "Update changelog for feedback Slack notification"
```

---

## Self-Review checklist (completed during plan authoring)

- **Spec coverage:** Part 1 (client coalescing) → Tasks 4-5; Part 2 (Slack routing + Block Kit) → Tasks 2-3; Part 3 (typed config, bootstrap, per-type flags, enablement) → Tasks 1-2; Part 4 (email, no code change) → covered automatically by coalescing, noted in changelog. Deploy migration note → changelog (Task 6, Step 2).
- **Type/name consistency:** client methods `setRating`/`skipComment`/`submitCommentAsync`/`reset`/`destroy`/`sendAliveAsync`/`flushAuto`/`beaconFlush`/`markSent`/`clearPending`/`trackMessage` are referenced consistently across Tasks 4-5. Server methods `getConfig`/`getEnabled`/`sendMonitorStatusReport`/`sendClientErrorReport`/`sendFeedbackReport`/`sendSlackMessage(channel,text,blocks)`/`feedbackBlocks`/`ratingEmoji`/`feedbackMeta`/`feedbackFallbackText` consistent across Tasks 2-3. `SlackAlertConfig` property names match between the class (Task 1), the `ConfigSpec` defaultValue (Task 1), and the service reads (Tasks 2-3).
- **Placeholders:** the only intentionally-temporary code is the Task 3 Step 4 log line, explicitly marked TEMP with a remove-before-commit instruction.

## Follow-up (out of scope for this plan)

- **Automated coverage:** when the `playwright/` suite (currently on `atm/playwright-setup`) lands on `develop`, add an e2e test asserting one `Feedback` `TrackLog` per interaction across the submit/skip/inactivity paths, and a unit-style assertion that the `pagehide` beacon is issued. The toolkit's `ApiHelper`/`HoistPage` (`getModel`/`getSvc`) are the intended way to assert against the live Hoist runtime.
- **Framework email parity:** hoist-core's `FeedbackEmailService.formatHtml` does not include the rating, so sentiment-only emails remain metadata-only. Including the rating would be a hoist-core enhancement.
- **Migrating Toolbox's other untyped configs to `TypedConfigMap`** - separate ticket.
