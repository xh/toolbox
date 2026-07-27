package io.xh.toolbox.admin

import groovy.json.JsonOutput
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
 * field count declared by the client's Store - the variable that decides whether the Store's
 * `optimizeRecordData` config pays off.
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
        Boolean populateExtraFields
    ) {
        def gen = createGenerator(recordCount, idSeed, numericId, extraFieldCount, populateExtraFields),
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
     *
     * Flushed on the first row (prompt time-to-first-record for the client) and every 1000 rows
     * thereafter (~128KB at this row shape) - coarse enough to be cheap, frequent enough to keep
     * data streaming through any buffering layers (compression filters, reverse proxies) between
     * server and client.
     *
     * Note two required details of this pattern:
     * - The BufferedOutputStream wrapper coalesces the many small per-row writes into ~32KB
     *   chunks. Sent individually, each tiny write travels the response pipeline as its own
     *   chunk, degrading downstream gzip ratios (compressors that sync-flush per chunk lose
     *   most of their efficiency on sub-KB blocks) and adding per-chunk transfer overhead.
     * - Rows must be written via write(), NOT the Groovy << operator - Groovy's
     *   OutputStream.leftShift() flushes after every write, which would defeat the buffer.
     */
    def streamingData(
        Integer recordCount,
        Integer idSeed,
        Boolean numericId,
        Integer extraFieldCount,
        Boolean populateExtraFields
    ) {
        def gen = createGenerator(recordCount, idSeed, numericId, extraFieldCount, populateExtraFields)

        // Deliberately served as text/plain rather than the standard application/x-ndjson -
        // the NDJSON type is missing from most default gzip/compressible MIME lists (webpack
        // dev-server, Spring Boot, typical nginx gzip_types), so it would transfer uncompressed
        // without per-environment config. text/plain is compressed out of the box.
        response.contentType = 'text/plain'
        response.characterEncoding = 'UTF-8'

        def out = new BufferedOutputStream(response.outputStream, 32 * 1024)
        gen.eachFlatRow { Map row ->
            out.write((JsonOutput.toJson(row) + '\n').getBytes('UTF-8'))
            if (gen.count % 1000 == 1) out.flush()
        }
        out.flush()
    }

    //------------------------
    // Implementation
    //------------------------
    private static Generator createGenerator(
        Integer recordCount,
        Integer idSeed,
        Boolean numericId,
        Integer extraFieldCount,
        Boolean populateExtraFields
    ) {
        return new Generator(
            recordCount ?: 100000,
            idSeed ?: 1,
            numericId ?: false,
            // Extra fields are declared client-side whether or not populated - a request to leave
            // them empty simply generates none, yielding the wide-and-sparse record shape.
            populateExtraFields ? (extraFieldCount ?: 0) : 0
        )
    }

    /** Generates test rows - six base fields, plus any requested populated `extraFieldN` values. */
    private static class Generator {

        /**
         * Small pool of repeated values for categorical extra fields - the most common shape for
         * a wide grid's string columns (status, region, desk, etc.).
         */
        static final List<String> CATEGORIES = [
            'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'
        ]

        /**
         * Value type assigned to each extra field, by `index % TYPE_CYCLE.size()`. Types are fixed
         * per field (as they would be in a real dataset) and mixed in roughly the proportions seen
         * in real-world wide grids - value payload materially affects the memory profile of a
         * record, so a uniform column of integers would not be a representative test.
         *
         * Note the single 'null' slot yields a column that is null for every row, so populated
         * extra fields work out to ~11/12 of the requested `extraFieldCount`.
         */
        static final List<String> TYPE_CYCLE = [
            'cat', 'cat', 'int', 'cat', 'double', 'bool',
            'cat', 'int', 'cat', 'double', 'uniqueStr', 'null'
        ]

        final int recordCount
        final int idSeed
        final boolean numericId
        final ThreadLocalRandom rand = ThreadLocalRandom.current()
        final int traderCount
        final List<String> extraFieldNames
        int count = 0

        /**
         * @param extraFieldCount - number of populated `extraFieldN` values to emit on each row.
         *      Zero to emit none, leaving any extra fields declared by the client unpopulated.
         */
        Generator(int recordCount, int idSeed, boolean numericId, int extraFieldCount) {
            this.recordCount = recordCount
            this.idSeed = idSeed
            this.numericId = numericId
            this.traderCount = Math.max(1, (recordCount / 10) as int)
            // Pre-computed - these names are re-generated for every row, and string interpolation
            // at 100k+ rows x 100+ fields would dominate the cost of generating the data itself.
            this.extraFieldNames = extraFieldCount > 0 ?
                (0..<extraFieldCount).collect { "extraField$it" as String } :
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

        void eachFlatRow(Closure fn) {
            while (count < recordCount) {
                fn(nextParent())
            }
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
            switch (TYPE_CYCLE[idx % TYPE_CYCLE.size()]) {
                case 'cat':
                    return CATEGORIES[rand.nextInt(CATEGORIES.size())]
                case 'uniqueStr':
                    return "val-${count}-${idx}" as String
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
    }
}
