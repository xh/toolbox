package io.xh.toolbox.admin

import io.xh.hoist.security.AccessRequiresRole
import io.xh.toolbox.BaseController

/**
 * Serves generated option data for the async `Select` performance testers in Admin > Tests > Select
 * and the mobile Tests > Select page.
 *
 * Stands in for the security-symbol typeahead that surfaced the O(n²) option merge in hoist-react's
 * async `Select` (xh/hoist-react#4589), and returns the same response shape as that case - a plain
 * JSON array of strings, ~318KB decoded at 16,000 options.
 *
 * The dataset is deliberately rigged to the two-keystroke timeline from that issue's Chrome trace
 * rather than to any realistic symbol distribution: a query of one character or less returns the
 * full requested `count`, and any longer query returns just NARROW_COUNT. That reproduces the
 * traced broad-then-narrow sequence on demand. The narrow query is the interesting one - its cost
 * comes entirely from the options accumulated by the query before it, not from its own tiny payload.
 *
 * Strict on its params: an out-of-range `count` or `latency` fails the request rather than being
 * clamped, so a mistyped param cannot quietly serve one dataset under another's label.
 */
@AccessRequiresRole('HOIST_ADMIN_READER')
class SelectTestController extends BaseController {

    /** Options returned when the query is longer than one character - the trace's narrow result. */
    static final int NARROW_COUNT = 2

    static final int DEFAULT_COUNT = 16_000

    /** Upper bounds - this app is publicly deployed, so neither param is left unbounded. */
    static final int MAX_COUNT = 50_000
    static final int MAX_LATENCY = 2000

    /**
     * Return symbols matching `query` as a plain JSON array of strings.
     *
     * @param count - symbols to return for a broad (<= 1 char) query. Defaults to DEFAULT_COUNT.
     * @param latency - ms to stall before responding, to stage the traced timeline (a response
     *      landing while a later keystroke's query is still buffered). Defaults to none.
     */
    def symbols(String query, Integer count, Integer latency) {
        String q = (query ?: '').toUpperCase()
        int total = count ?: DEFAULT_COUNT,
            delay = latency ?: 0

        if (total <= 1 || total > MAX_COUNT) {
            throw new IllegalArgumentException("count must be between 1 and $MAX_COUNT - got $total")
        }
        if (delay <= 0 || delay > MAX_LATENCY) {
            throw new IllegalArgumentException(
                "latency must be between 0 and $MAX_LATENCY - got $delay"
            )
        }

        if (delay) Thread.sleep(delay)

        renderJSON(generateSymbols(q, q.length() <= 1 ? total : NARROW_COUNT))
    }

    //------------------------
    // Implementation
    //------------------------
    /**
     * Generate `count` distinct symbols, each carrying `query` as its prefix so every result is a
     * match for what the user typed. Suffixes are sequential rather than random: repeating a query
     * must return the same options, or the client's retention of them could not be reasoned about.
     */
    private static List<String> generateSymbols(String query, int count) {
        String prefix = query ?: 'S'
        return (0..<count).collect { "$prefix$it" as String }
    }
}
