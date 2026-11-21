package io.xh.toolbox.blueprints

import io.xh.hoist.BaseService
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.jsonblob.JsonBlob
import io.xh.toolbox.llm.LlmConfig

import java.time.LocalDate

import static io.xh.hoist.json.JSONParser.parseObject
import static io.xh.hoist.json.JSONSerializer.serialize
import static io.xh.hoist.util.DateTimeUtils.appDay
import static io.xh.hoist.util.DateTimeUtils.appZoneId

/**
 * Stores the feature requests the Blueprints Architect sends, once a user approves them, for
 * admins to read. A request is untrusted input from the browser, so every field is checked again
 * here, against the limits of the kit's `checkFeatureRequest`, and each user may send at most
 * `LlmConfig.dailyFeatureRequests` a day.
 *
 * Each request is one JsonBlob, owned by its sender, which holds it whole. A track entry in category
 * `Blueprint Feature Request` records its id and summary for the Activity tab: track entries drop
 * payloads over `xhActivityTrackingConfig.maxDataLength`, which a fragment can exceed.
 */
class BlueprintFeatureRequestService extends BaseService {

    static final String BLOB_TYPE = 'blueprintFeatureRequest'
    static final String TRACK_CATEGORY = 'Blueprint Feature Request'

    static final List<String> CATEGORIES = ['widget', 'renderer', 'variableType', 'resolver', 'action', 'format', 'data', 'other']
    static final int MAX_SUMMARY = 120, MAX_USER_WORDS = 1000, MAX_WORKAROUND = 500, MAX_FRAGMENT = 5000
    static final int MAX_LIST_DAYS = 366

    def configService,
        jsonBlobService,
        trackService

    /**
     * Check and store a request for the current user.
     *
     * @param body `{request, blueprintType, blueprintId, app}`, where `request` is the kit's
     *      `FeatureRequest`. Its `context` is ignored: the user comes from the session.
     * @return `{id}`, the stored request's token
     */
    Map submit(Map body) {
        Map request = checkedRequest(body.request)
        Map meta = [
            app          : checkedText(body.app, 'app', 50),
            blueprintType: checkedText(body.blueprintType, 'blueprintType', 50),
            blueprintId  : checkedToken(body.blueprintId),
            category     : request.category,
            summary      : request.summary
        ]
        ensureUnderDailyLimit()

        JsonBlob blob = jsonBlobService.create([
            type : BLOB_TYPE,
            name : "request-${UUID.randomUUID().toString().substring(0, 8)}".toString(),
            value: request.subMap('summary', 'category', 'userWords', 'workaround', 'fragment'),
            meta : meta
        ], username)
        trackService.track(category: TRACK_CATEGORY, msg: 'Blueprint feature request', data: [id: blob.token, *: meta])
        return [id: blob.token]
    }

    /** Every user's requests submitted from the start of `startDay` to the end of `endDay`, newest first. */
    List<Map> list(LocalDate startDay, LocalDate endDay) {
        if (!startDay || !endDay || endDay < startDay || startDay.plusDays(MAX_LIST_DAYS) <= endDay) {
            throw new RoutineRuntimeException("Give a startDay and an endDay at most $MAX_LIST_DAYS days apart, with startDay first")
        }
        JsonBlob.withNewSession {
            JsonBlob.findAllByTypeAndArchivedDateAndDateCreatedBetween(
                BLOB_TYPE, 0, startOf(startDay), new Date(startOf(endDay.plusDays(1)).time - 1), [sort: 'dateCreated', order: 'desc']
            ).collect { JsonBlob b ->
                Map value = parseObject(b.value), meta = parseObject(b.meta)
                [
                    id           : b.token,
                    submitted    : b.dateCreated.time,
                    user         : b.owner,
                    app          : meta.app,
                    blueprintType: meta.blueprintType,
                    blueprintId  : meta.blueprintId,
                    category     : value.category,
                    summary      : value.summary,
                    userWords    : value.userWords,
                    workaround   : value.workaround,
                    fragment     : value.fragment
                ]
            }
        }
    }

    //------------------
    // Implementation
    //------------------
    private Map checkedRequest(Object request) {
        if (!(request instanceof Map)) fail('Send a request object.')
        Map ret = request as Map
        String extra = ret.keySet().find { !(it in ['summary', 'category', 'userWords', 'workaround', 'fragment', 'context']) }
        if (extra) fail("'$extra' is not a field of a request.")
        if (!isText(ret.summary, MAX_SUMMARY)) fail("summary is one line of at most $MAX_SUMMARY characters.")
        if (!(ret.category in CATEGORIES)) fail("category is one of ${CATEGORIES.join(', ')}.")
        if (!isText(ret.userWords, MAX_USER_WORDS)) fail("userWords is the user's own words, at most $MAX_USER_WORDS characters.")
        if (ret.workaround != null && !isText(ret.workaround, MAX_WORKAROUND)) fail("workaround is at most $MAX_WORKAROUND characters, or null.")
        def fragment = ret.fragment
        if (fragment != null) {
            if (!(fragment instanceof Map)) fail('fragment is one element or config object.')
            if (serialize(fragment).length() > MAX_FRAGMENT) fail("fragment is at most $MAX_FRAGMENT characters of JSON.")
            String dataKey = findDataKey(fragment)
            if (dataKey) fail("fragment holds '$dataKey', and a request never sends data.")
        }
        return ret
    }

    // A key that would carry data or reach a stored artifact, at any depth.
    private static String findDataKey(Object value) {
        if (value instanceof Map) {
            String own = (value as Map).keySet().find { it in ['inline', 'artifact', 'rows'] }
            return own ?: (value as Map).values().findResult { findDataKey(it) }
        }
        if (value instanceof List) return (value as List).findResult { findDataKey(it) }
        return null
    }

    private static String checkedText(Object value, String name, int max) {
        if (!isText(value, max)) fail("$name is text of at most $max characters.")
        return value
    }

    private static String checkedToken(Object value) {
        if (value == null) return null
        if (!(value instanceof String) || !(value ==~ /[A-Za-z0-9._-]{1,64}/)) fail('blueprintId is a blueprint token, or null.')
        return value
    }

    private void ensureUnderDailyLimit() {
        int limit = configService.getObject(LlmConfig).dailyFeatureRequests
        int sent = JsonBlob.countByTypeAndOwnerAndDateCreatedGreaterThanEquals(BLOB_TYPE, username, startOf(appDay()))
        if (sent >= limit) {
            trackService.track(category: TRACK_CATEGORY, msg: 'Blueprint feature request limit hit', severity: 'WARN', data: [limit: limit])
            fail("You have sent the $limit feature requests allowed today. Try again tomorrow.")
        }
    }

    private static Date startOf(LocalDate day) {
        Date.from(day.atStartOfDay(appZoneId).toInstant())
    }

    private static boolean isText(Object value, int max) {
        value instanceof String && value.trim() && value.length() <= max
    }

    private static void fail(String msg) {
        throw new RoutineRuntimeException(msg)
    }
}
