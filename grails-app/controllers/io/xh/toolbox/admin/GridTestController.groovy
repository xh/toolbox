package io.xh.toolbox.admin

import io.xh.hoist.security.AccessRequiresRole
import io.xh.toolbox.BaseController

import java.util.concurrent.ThreadLocalRandom

/**
 * Serves generated test data for the Admin > Tests > Grid panel, as either a conventional JSON
 * response (`data` - flat or tree, with optional summary) or streamed NDJSON (`streamingData` -
 * flat only).
 *
 * Both endpoints emit six base fields (symbol, trader, day, mtd, ytd, volume) and accept
 * `extraFieldCount` / `populateExtraFields` to widen each row with generated `extraFieldN` values.
 * That pair lets the panel dial in any point on the populated-fields axis independently of the
 * field count declared by the client's Store - a key variable in a record's memory profile.
 *
 * The *character* of those generated values is controlled separately, by `valueMix` (which value
 * types the extra fields carry) and `categoryCount` (cardinality of the categorical string pool).
 * Memory results are sensitive to both - a figure measured against one value distribution says
 * little about another - so vary them deliberately and record them alongside any result.
 *
 * Both are strict: an unknown `valueMix` or an out-of-range `categoryCount` fails the request
 * rather than falling back to a default, so a mistyped param cannot quietly serve one dataset
 * under another's label.
 */
@AccessRequiresRole('HOIST_ADMIN_READER')
class GridTestController extends BaseController {

    /**
     * Return grid test rows as a conventional (buffered) JSON response of the form
     * `{rows, summary}`. Supports tree data (nested `children`), an optional summary row, and
     * the `loadRootAsSummary` form (summary as a single root node wrapping all rows).
     */
    def data(
        Integer recordCount,
        Integer idSeed,
        Boolean numericId,
        Boolean tree,
        Boolean showSummary,
        Boolean loadRootAsSummary,
        Integer extraFieldCount,
        Boolean populateExtraFields,
        String valueMix,
        Integer categoryCount
    ) {
        def gen = createGenerator(recordCount, idSeed, numericId, extraFieldCount,
                populateExtraFields, valueMix, categoryCount),
            rows = gen.generateRows(tree ?: false),
            summary = showSummary ? gen.summarize(rows) : null

        if (summary && tree && loadRootAsSummary) {
            summary.children = rows
            rows = [summary]
            summary = null
        }

        renderJSON(rows: rows, summary: summary)
    }

    /**
     * Stream flat grid test rows as NDJSON - one JSON object per line. Source for the panel's
     * "Stream" mode, where the client consumes the response incrementally via
     * `Store.loadDataAsync()`, creating records as chunks arrive without ever buffering the
     * complete raw dataset in memory.
     */
    def streamingData(
        Integer recordCount,
        Integer idSeed,
        Boolean numericId,
        Integer extraFieldCount,
        Boolean populateExtraFields,
        String valueMix,
        Integer categoryCount
    ) {
        def gen = createGenerator(recordCount, idSeed, numericId, extraFieldCount,
                populateExtraFields, valueMix, categoryCount)
        renderNDJSON(gen.flatRows())
    }

    //------------------------
    // Implementation
    //------------------------
    private static Generator createGenerator(
        Integer recordCount,
        Integer idSeed,
        Boolean numericId,
        Integer extraFieldCount,
        Boolean populateExtraFields,
        String valueMix,
        Integer categoryCount
    ) {
        return new Generator(
            recordCount ?: 100000,
            idSeed ?: 1,
            numericId ?: false,
            // Extra fields are declared client-side whether or not populated - a request to leave
            // them empty simply generates none, yielding the wide-and-sparse record shape.
            populateExtraFields ? (extraFieldCount ?: 0) : 0,
            valueMix ?: Generator.DEFAULT_VALUE_MIX,
            categoryCount ?: Generator.DEFAULT_CATEGORY_COUNT
        )
    }

    /** Generates test rows - six base fields, plus any requested populated `extraFieldN` values. */
    private static class Generator {

        static final String DEFAULT_VALUE_MIX = 'mixed'
        static final int DEFAULT_CATEGORY_COUNT = 8

        /** Upper bound on `categoryCount` - the pool is materialized, and CAT_DIGITS bounds it. */
        static final int MAX_CATEGORY_COUNT = 1_000_000

        /**
         * Value type assigned to each extra field, by `index % cycle.size()`, selected by the
         * `valueMix` param. Types are fixed per field, as they would be in a real dataset - value
         * payload materially affects a record's memory profile, so a uniform column of integers
         * would not be a representative test on its own.
         *
         * Every mix is twelve slots carrying a single 'null' in the same final position, so all
         * mixes emit the same ~11/12 populated fields per row. That is deliberate: populated-field
         * count is its own variable in a record's memory profile, and a mix comparison that also
         * moved it would confound the two effects.
         */
        static final Map<String, List<String>> VALUE_MIXES = [
            // Roughly the proportions seen in real-world wide grids.
            mixed      : ['cat', 'cat', 'int', 'cat', 'double', 'bool',
                          'cat', 'int', 'cat', 'double', 'uniqueStr', 'null'],
            // Low-cardinality repeated strings, as in status/region/desk columns. Sweep
            // `categoryCount` alongside this to vary how much sharing is available.
            categorical: (['cat'] * 11) + ['null'],
            // A distinct string in every cell - nothing for interning or the VM to share.
            unique     : (['uniqueStr'] * 11) + ['null'],
            // Numbers and booleans only, so the base fields carry the row's entire string payload.
            numeric    : (['int', 'double'] * 5) + ['bool', 'null']
        ].asImmutable()

        /** Digits in a generated category name, and in each half of a unique string. */
        static final int CAT_DIGITS = 6
        static final int UNIQUE_ROW_DIGITS = 9
        static final int UNIQUE_FIELD_DIGITS = 6

        /** Zero-padding prefixes by length, to keep String.format out of the hot path. */
        static final List<String> ZEROS = (0..<16).collect { '0' * it }

        final int recordCount
        final int idSeed
        final boolean numericId
        final ThreadLocalRandom rand = ThreadLocalRandom.current()
        final int traderCount
        final List<String> extraFieldNames
        final List<String> typeCycle
        final List<String> categories
        int count = 0

        /**
         * @param extraFieldCount - number of populated `extraFieldN` values to emit on each row.
         *      Zero to emit none, leaving any extra fields declared by the client unpopulated.
         * @param valueMix - key into VALUE_MIXES, deciding the value types the extra fields carry.
         * @param categoryCount - cardinality of the categorical string pool. Inert for mixes with
         *      no categorical slots.
         */
        Generator(
            int recordCount,
            int idSeed,
            boolean numericId,
            int extraFieldCount,
            String valueMix,
            int categoryCount
        ) {
            this.recordCount = recordCount
            this.idSeed = idSeed
            this.numericId = numericId
            this.traderCount = Math.max(1, (recordCount / 10) as int)
            // Pre-computed - these names are re-generated for every row, and string interpolation
            // at 100k+ rows x 100+ fields would dominate the cost of generating the data itself.
            this.extraFieldNames = extraFieldCount > 0 ?
                (0..<extraFieldCount).collect { "extraField$it" as String } :
                []

            this.typeCycle = VALUE_MIXES[valueMix]
            if (!typeCycle) {
                throw new IllegalArgumentException(
                    "Unknown valueMix '$valueMix' - expected one of ${VALUE_MIXES.keySet().join(', ')}"
                )
            }
            if (categoryCount < 1 || categoryCount > MAX_CATEGORY_COUNT) {
                throw new IllegalArgumentException(
                    "categoryCount must be between 1 and $MAX_CATEGORY_COUNT - got $categoryCount"
                )
            }

            // Fixed-width names, so cardinality is the only thing that varies across a sweep -
            // pool size and value byte size would otherwise move together. Built only when the
            // mix actually has categorical slots, to avoid materializing an unused large pool.
            this.categories = typeCycle.contains('cat') ?
                (0..<categoryCount).collect { 'Cat-' + pad(it, CAT_DIGITS) } :
                []
        }

        List<Map> generateRows(boolean tree) {
            def rows = []
            while (count < recordCount) {
                def pos = nextParent()
                if (tree) pos.children = createChildren(pos, pos.symbol as String, 10)
                rows << pos
            }
            return rows
        }

        Iterator<Map> flatRows() {
            [hasNext: { count < recordCount }, next: { nextParent() }] as Iterator<Map>
        }

        Map summarize(List<Map> rows) {
            def ret = [id: "${idSeed}~summaryRow" as String, day: 0L, mtd: 0L, ytd: 0L, volume: 0L]
            rows.each {
                ret.day += it.day as long
                ret.mtd += it.mtd as long
                ret.ytd += it.ytd as long
                ret.volume += it.volume as long
            }
            return ret
        }

        private Map nextParent() {
            def symbol = "Symbol $count" as String,
                trader = "Trader ${count % traderCount}" as String
            count++
            return addExtraFields([
                id    : numericId ? count : "${idSeed}~${symbol}" as String,
                trader: trader,
                symbol: symbol,
                day   : randBetween(-80000, 100000),
                mtd   : randBetween(-500000, 500000),
                ytd   : randBetween(-1000000, 2000000),
                volume: randBetween(1000, 2000000)
            ])
        }

        /**
         * Add a populated `extraFieldN` entry for each requested extra field - no-op when none
         * requested, leaving any extra fields declared by the client unpopulated (the wide-and-
         * sparse case).
         */
        private Map addExtraFields(Map row) {
            extraFieldNames.eachWithIndex { String name, int idx ->
                row[name] = extraFieldValue(idx)
            }
            return row
        }

        private Object extraFieldValue(int idx) {
            switch (typeCycle[idx % typeCycle.size()]) {
                case 'cat':
                    return categories[rand.nextInt(categories.size())]
                case 'uniqueStr':
                    // Fixed width, so a row's unique values cost the same at row 1 and row 500,000.
                    return 'Uni-' + pad(count, UNIQUE_ROW_DIGITS) + '-' + pad(idx, UNIQUE_FIELD_DIGITS)
                case 'int':
                    return rand.nextInt(-1000000, 1000000)
                case 'double':
                    return Math.round(rand.nextDouble() * 10000000) / 1000d
                case 'bool':
                    return rand.nextBoolean()
                default:
                    return null
            }
        }

        /** Children sum to their parent's values, splitting each remainder across siblings. */
        private List<Map> createChildren(Map parent, String symbol, int maxCount) {
            int childCount = rand.nextInt(maxCount + 1),
                maxT = childCount - 1
            long dayRem = parent.day as long,
                mtdRem = parent.mtd as long,
                ytdRem = parent.ytd as long,
                volRem = parent.volume as long

            def ret = []
            for (int t = 0; t <= maxT; t++) {
                def trader = "Trader $t" as String
                count++
                def child = addExtraFields([
                    id    : numericId ? count : "${parent.id}~${trader}" as String,
                    trader: trader,
                    symbol: symbol,
                    day   : t < maxT ? randBetween(Math.min(0L, dayRem), Math.max(0L, dayRem)) : dayRem,
                    mtd   : t < maxT ? randBetween(Math.min(0L, mtdRem), Math.max(0L, mtdRem)) : mtdRem,
                    ytd   : t < maxT ? randBetween(Math.min(0L, ytdRem), Math.max(0L, ytdRem)) : ytdRem,
                    volume: t < maxT ? randBetween(0L, volRem) : volRem
                ])
                dayRem -= child.day as long
                mtdRem -= child.mtd as long
                ytdRem -= child.ytd as long
                volRem -= child.volume as long

                int nextMax = (maxCount / 2) as int
                if (nextMax > 0) child.children = createChildren(child, symbol, nextMax)
                ret << child
            }
            return ret
        }

        private long randBetween(long lo, long hi) {
            return lo == hi ? lo : rand.nextLong(lo, hi + 1)
        }

        /**
         * Left-pad `val` with zeros to `width`. Deliberately hand-rolled - this runs once per
         * generated string value (millions of times on a wide `unique` run), where String.format
         * is orders of magnitude more expensive than a length check and a concat.
         */
        private static String pad(long val, int width) {
            def s = Long.toString(val)
            int need = width - s.length()
            return need > 0 ? ZEROS[need] + s : s
        }
    }
}
