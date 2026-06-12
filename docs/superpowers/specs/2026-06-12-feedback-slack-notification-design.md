# Feedback -> Slack Notification (with single-post client coalescing)

Date: 2026-06-12
Status: Approved design, pending implementation plan

## Summary

The desktop home page now has a feedback widget. Today, submitted feedback reaches the team
only via email (the hoist-core `FeedbackEmailService`) plus the Admin Console activity log. This
project adds **Slack** as a second push channel by extending Toolbox's existing
`SlackAlertService`, and - more substantially - fixes a duplicate-notification problem at its
source by coalescing each feedback interaction into a **single** track entry on the client.

A secondary goal: this is a deliberate in-Toolbox reference example of techniques Hoist apps do
not currently demonstrate - a Slack message via Block Kit, `navigator.sendBeacon` for reliable
capture during page unload, and the hoist-core v39 `TypedConfigMap` feature for typed soft-config
access (Toolbox already demos the `ConfigSpec`/`PreferenceSpec` declaration half, but nothing in
the app yet uses `TypedConfigMap` / `ConfigService.getObject`).

## Current State

### Client

`client-app/src/desktop/tabs/home/widgets/feedback/FeedbackWidgetModel.ts` fires feedback through
`XH.track()` with `category: 'Feedback'`:

- On rating click (`setRating`): one entry, `message: 'Hoist sentiment: <rating>'`, no `data`.
- On comment submit (`submitCommentAsync`): a second entry, `message: 'User submitted feedback'`,
  `data: {userMessage, rating}`, followed by `XH.trackService.pushPendingAsync()`.
- Skip sends nothing extra.

So a single interaction that includes a written comment produces **two** `Feedback` entries.

### Client TrackService behavior (hoist-react `svc/TrackService.ts`)

- `track()` queues to an in-memory `pending[]` and schedules a **10s debounced** flush.
- A `beforeunload` listener calls `pushPendingAsync()` (a normal `postJson`, best-effort).
- `correlationId` is supported end-to-end but is not needed by this design.

### Server

- `XhController.track` -> `TrackService.trackAll` persists each entry as a `TrackLog` and publishes
  it to the cluster topic `xhTrackReceived`. Endpoint contract: `POST xh/track?clientUsername=<user>`
  with body `{entries:[...]}`. Auth is **session-cookie based** plus a clientUsername-must-match-
  session check. There is **no XSRF token** requirement in hoist-core.
- hoist-core `FeedbackEmailService` subscribes to `xhTrackReceived`, and for every `Feedback` entry
  emails the body to the addresses in the `xhEmailSupport` config.
- Toolbox `grails-app/services/io/xh/toolbox/SlackAlertService.groovy` already authenticates to the
  Slack Web API (`chat.postMessage`) with a bot token and subscribes to `xhTrackReceived`, but only
  acts on **client errors** (and on `xhMonitorStatusReport`). It does not handle `Feedback`. Config
  lives in `slackAlertConfig` (`enabled`, `channel`, `oauthToken`), read **untyped** via
  `configService.getMap('slackAlertConfig', [enabled: false])` and **not declared** in
  `ensureRequiredConfigsCreated` (so it is absent from the Admin Console config inventory). The
  service is suppressed in local dev via `!Utils.isLocalDevelopment`.

### Consequence

Because each interaction can emit two `Feedback` entries, the team currently receives up to **two**
emails per feedback submission (a metadata-only sentiment email plus the comment email). Adding
Slack naively would double the Slack posts the same way.

## Goals

1. Add Slack as a feedback notification channel alongside email.
2. Emit exactly **one** `Feedback` track entry per interaction, so every downstream consumer
   (email, Slack, activity log) fires once. Fix this at the source (the client), which is the only
   layer upstream of both the framework email service and the app Slack service.
3. Preserve the widget's core UX guarantee: a user only has to click a sentiment face - no need to
   type or submit - and we still capture their response.
4. Serve as a clean reference example of Block Kit Slack messages, `sendBeacon` unload capture, and
   the `TypedConfigMap` typed soft-config feature (the first use of it in Toolbox).

## Non-Goals

- No change to hoist-core's `FeedbackEmailService` (it benefits automatically from coalescing).
- No server-side buffering/correlation of feedback entries (rejected as more complex and unable to
  fix the duplicate email without forking the framework).
- 100% capture reliability is explicitly not required; the design must be defensible, not perfect.
- Migrating Toolbox's other untyped configs to `TypedConfigMap` is out of scope - this batch types
  only `slackAlertConfig`. A separate ticket will cover the rest.

## Design

### Part 1 - Client-side coalescing (`FeedbackWidgetModel`)

The widget holds the chosen rating in model state on click and emits a single track entry only at
a resolution point. The governing rule:

> Every resolution path emits exactly one entry capturing the rating plus whatever comment text
> exists at that moment. Explicit Submit, the inactivity timeout, and the `pagehide` backstop all
> include a sitting draft if one is present; **Skip** is the one explicit "no comment" signal and
> sends the rating only. Submit, Skip, and the timeout then move the widget to "thanks", so a
> captured draft cannot be re-submitted.

#### Capture paths

| Path | Trigger | Mechanism | Payload | Reliability |
|------|---------|-----------|---------|-------------|
| Submit | user clicks "Send to XH" | `XH.track` + `pushPendingAsync` | `{rating, userMessage}` | reliable (page alive) |
| Skip | user clicks "Skip" | `XH.track` + `pushPendingAsync` | `{rating}` | reliable (page alive) |
| Inactivity | 30s with no textarea change | `XH.track` + `pushPendingAsync` | `{rating, userMessage?}` | reliable (page alive) - primary safety net |
| Abandon | `pagehide` while unsent | `navigator.sendBeacon` | `{rating, userMessage?}` | best-effort, survives teardown |

#### Inactivity timer

- Starts when a rating is set; implemented as a debounced flush (e.g. lodash `debounce(fn, 30s)`).
- **Reset on every keystroke** so an actively-composing user never trips it. Wiring: set
  `commitOnChange: true` on the `textArea` and add a model reaction `{track: () => this.comment,
  run: () => this.scheduleFlush()}` (or an equivalent `onChange` that re-arms the debounce).
- When it fires, send one entry capturing the rating plus whatever text is currently in the box,
  then move the widget to its "thanks" state so the captured draft cannot later be re-submitted.
  This means a 30s-idle partial draft is sent as-is, which is slightly unusual but deliberately
  chosen over the alternative (leaving the box open and submitting in the background), which would
  let a user who types, pauses, types more, pauses again, etc. trigger several "draft" submissions.
- The 30s duration is a single named constant, easy to tune.

#### Abandon via sendBeacon (the showcase technique)

The naive approach - calling `XH.track()` then `pushPendingAsync()` inside a `pagehide`/
`beforeunload` handler - is unreliable and races the framework:

1. The framework's own `beforeunload` -> `pushPendingAsync` (registered at app init, so it fires
   first) flushes the current `pending[]`, which does not yet contain our deferred sentiment.
2. Our handler then queues the sentiment and starts a `postJson`, but a normal request kicked off
   during page teardown is routinely cancelled by the browser.

Instead, on `pagehide` we fire `navigator.sendBeacon` directly to the track endpoint, bypassing
`TrackService.pending` and `pushPendingAsync` entirely:

```
const url = <absolute xh/track URL, respecting XH base URL> + '?clientUsername=' +
            encodeURIComponent(XH.getUsername());
const body = new Blob([JSON.stringify({entries: [entry]})], {type: 'application/json'});
navigator.sendBeacon(url, body);
```

- The beacon carries session cookies automatically (same-origin), satisfies the clientUsername
  param check, and needs no XSRF header (none exists). It is queued by the browser and survives
  teardown.
- `entry` mirrors the shape `TrackService.toServerJson` produces: `msg`, `category: 'Feedback'`,
  `data: {rating, userMessage?}` (the sitting draft, if any), `clientUsername`, `appVersion`,
  `clientAppCode`, `loadId`, `tabId`, `url`, `timestamp`. The server enriches the remaining columns
  from request headers.
- `pagehide` (not `visibilitychange: 'hidden'`) is used so an alt-tab mid-compose does not
  prematurely fire. Code comments will explain why beacon beats a normal request here, so the
  example teaches the technique.

#### `sent` guard

A single boolean makes all capture paths mutually exclusive: the first to fire sets `sent = true`;
all others no-op. This prevents the inactivity flush and the `pagehide` beacon from double-posting.

#### Listener lifecycle

The `pagehide` listener is added when a rating is set and removed on send and on model `destroy()`.
The pending debounce is cancelled on `destroy()` and on any explicit send.

#### Accepted residual losses

- Click -> idle < 30s -> hard process kill before `pagehide` fires (crash/power loss, not a
  navigation).
- Mobile app-kill, where `pagehide` may not fire.

Both are within the "defensible, not 100%" bar, and the inactivity timer moves the common lingering
case onto a reliable in-page request well before any unload event.

#### Analytics note

Coalescing yields one activity-log row per interaction carrying `data.rating` (and `data.userMessage`
when present), instead of one or two rows. Sentiment counts are still derivable from `data.rating`;
data is cleaner, not lost.

### Part 2 - Server-side Slack routing (`SlackAlertService`)

Extend the existing `xhTrackReceived` subscription with a feedback branch:

```groovy
onMessage: {TrackLog tl ->
    if (tl.isClientError) sendClientErrorReport(tl)
    else if (tl.category == 'Feedback') sendFeedbackReport(tl)
}
```

`sendFeedbackReport(tl)` builds a **Block Kit** message:

- Header: `:speech_balloon: User Feedback`.
- A sentiment line with an emoji derived from `tl.dataAsObject?.rating` (negative/neutral/positive
  -> sad/neutral/smiling face). For an entry with no rating, omit or show a neutral marker.
- The written comment (`tl.dataAsObject?.userMessage`) quoted in a section block, when present.
- A context block of metadata mirroring `FeedbackEmailService.formatHtml`: user, app + code,
  version, environment, browser, device, submitted time.
- A plain-text `text` fallback for notifications/accessibility.

Generalize the private `sendSlackMessage` to accept a target channel and an optional `blocks`
payload (keeping the existing `text`-only callers working unchanged), then post to
`config.feedbackChannel ?: config.channel`.

Per the agreed scope, **every** `Feedback` entry posts; with client coalescing that means one post
per interaction.

### Part 3 - Typed config, bootstrap, and enablement

This batch types **only** `slackAlertConfig` (the rest of Toolbox's configs are a separate ticket)
and uses it as Toolbox's first demonstration of `TypedConfigMap` / `ConfigService.getObject`.

**3a. Declare the typed class.** A new `SlackAlertConfig extends TypedConfigMap` (e.g.
`grails-app/services/io/xh/toolbox/SlackAlertConfig.groovy` alongside the service, or under
`src/main/groovy/io/xh/toolbox/`) with cleanly-disabled defaults:

```groovy
class SlackAlertConfig extends TypedConfigMap {
    /** Master switch - when false (the default), the service posts nothing at all. */
    boolean enabled = false
    /** Slack bot OAuth token (xoxb-...). Required for any posting. */
    String oauthToken = null

    /** Channel for monitor status + client-error alerts. */
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

Each notification type the service controls has its own explicit on/off flag, all gated under the
master `enabled` switch + a present `oauthToken`. **Everything defaults off** (master and all three
per-type flags), so a fresh config posts nothing, and an operator or local-dev validator opts in
exactly to the path they want by setting the master switch plus the specific sub-key (e.g.
`enabled: true, oauthToken, feedbackChannel, feedbackEnabled: true` to validate feedback alone).
Per the hoist-core guidance, the constructor calls `init(args)` (not `super(args)`), so declared
defaults are not overwritten.

**Deploy migration note.** Any existing deployed `slackAlertConfig` (today an `enabled: true`
config implicitly posts monitor + client-error reports) will stop posting those once the per-type
flags default off. To preserve current behavior, the live config must add
`monitorAlertsEnabled: true` and `clientErrorsEnabled: true`. This is a one-time, intentional config
update and must be called out in the changelog / upgrade note.

**3b. Bootstrap the config.** Add a `ConfigSpec` for `slackAlertConfig` to
`ensureRequiredConfigsCreated`, binding the typed class and giving safe disabled defaults. The
`defaultValue` keys must match the typed-class defaults or hoist-core logs a startup drift `WARN`:

```groovy
new ConfigSpec(
    name: 'slackAlertConfig',
    valueType: 'json',
    defaultValue: [
        enabled: false, oauthToken: null, channel: null, feedbackChannel: null,
        monitorAlertsEnabled: false, clientErrorsEnabled: false, feedbackEnabled: false
    ],
    typedClass: SlackAlertConfig,
    groupName: 'Slack Integration',
    note: 'Slack bot token + target channels for monitor alerts, client-error reports, and user feedback. All disabled by default; enable the master flag plus the specific per-type flag(s) to post.'
)
```

Not `clientVisible` - the token must never reach the browser. Bootstrapping it also adds the config
to the Admin Console inventory for the first time.

**3c. Refactor the service to typed reads.** Replace `getMap('slackAlertConfig', ...)` with
`configService.getObject(SlackAlertConfig)`. The feedback channel resolves as
`config.feedbackChannel ?: config.channel`.

**3d. Enablement.** The master `getEnabled()` changes from `!Utils.isLocalDevelopment &&
config.enabled` to a purely config-driven check, and each send path additionally gates on its own
per-type flag:

```groovy
private boolean getEnabled() {
    return config.enabled && config.oauthToken
}
// sendMonitorStatusReport:  if (!enabled || !config.monitorAlertsEnabled) return
// sendClientErrorReport:    if (!enabled || !config.clientErrorsEnabled) return
// sendFeedbackReport:       if (!enabled || !config.feedbackEnabled) return
```

Because everything defaults off, dropping the `!Utils.isLocalDevelopment` guard is safe: no path
fires in local dev (or anywhere) unless its flags are explicitly turned on. This both makes the
integration locally testable per-path and resolves the earlier concern about the existing
monitor/client-error posts firing in dev - they now require an explicit opt-in on their own flags.

### Part 4 - Email (no code change)

hoist-core's `FeedbackEmailService` continues to email each `Feedback` entry to `xhEmailSupport`.
Because coalescing happens upstream, it now sends one email per interaction for free, eliminating
today's metadata-only duplicate sentiment email.

## Testing

- **Client unit/behavioral**: rating-then-submit emits one `{rating, userMessage}` entry; skip emits
  one `{rating}` entry; inactivity timer fires sentiment-only after 30s and resets on keystroke; the
  `sent` guard prevents double emission across timer + pagehide.
- **Playwright** (existing suite in `playwright/`): exercise the widget end-to-end against a running
  Toolbox, asserting a single `Feedback` `TrackLog` per interaction via the Hoist runtime helpers.
  The `pagehide`/`sendBeacon` path is inherently hard to assert in-browser; verify the beacon is
  issued (e.g. network capture) rather than full server round-trip.
- **Server**: with `slackAlertConfig` set locally (enabled + token + channel), confirm a `Feedback`
  entry produces one Slack post to the feedback channel with correct Block Kit content; confirm
  quiet no-op when config is unset (cleanly-disabled defaults).
- **Typed config**: confirm `configService.getObject(SlackAlertConfig)` returns the disabled
  defaults for a fresh/unset config, that `feedbackChannel` falls back to `channel` when blank, and
  that no startup drift `WARN` fires (typed-class defaults match the `ConfigSpec` `defaultValue`).

## Out of Scope

- Reworking the framework email formatting to include the rating (sentiment-only emails remain
  metadata-only; the rating shows in Slack and the activity log). Could be a future hoist-core
  enhancement.
- Per-rating routing, threading, or interactive Slack actions.
