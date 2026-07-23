package io.xh.toolbox.admin

import groovy.json.JsonOutput
import io.xh.hoist.security.AccessRequiresRole
import io.xh.toolbox.BaseController

import java.util.concurrent.ThreadLocalRandom

/**
 * Serves generated test data for the Admin > Tests > Grid panel, as either a conventional JSON
 * response (`data` - flat or tree, with optional summary) or streamed NDJSON (`streamingData` -
 * flat only).
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
        Boolean loadRootAsSummary
    ) {
        def gen = new Generator(recordCount ?: 100000, idSeed ?: 1, numericId ?: false),
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
    def streamingData(Integer recordCount, Integer idSeed, Boolean numericId) {
        def gen = new Generator(recordCount ?: 100000, idSeed ?: 1, numericId ?: false)

        response.contentType = 'application/x-ndjson'
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
    /** Generates test rows matching the retired client-side generator (GridTestData.ts). */
    private static class Generator {
        final int recordCount
        final int idSeed
        final boolean numericId
        final ThreadLocalRandom rand = ThreadLocalRandom.current()
        final int traderCount
        int count = 0

        Generator(int recordCount, int idSeed, boolean numericId) {
            this.recordCount = recordCount
            this.idSeed = idSeed
            this.numericId = numericId
            this.traderCount = Math.max(1, (recordCount / 10) as int)
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
            return [
                id    : numericId ? count : "${idSeed}~${symbol}" as String,
                trader: trader,
                symbol: symbol,
                day   : randBetween(-80000, 100000),
                mtd   : randBetween(-500000, 500000),
                ytd   : randBetween(-1000000, 2000000),
                volume: randBetween(1000, 2000000)
            ]
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
                def child = [
                    id    : numericId ? count : "${parent.id}~${trader}" as String,
                    trader: trader,
                    symbol: symbol,
                    day   : t < maxT ? randBetween(Math.min(0L, dayRem), Math.max(0L, dayRem)) : dayRem,
                    mtd   : t < maxT ? randBetween(Math.min(0L, mtdRem), Math.max(0L, mtdRem)) : mtdRem,
                    ytd   : t < maxT ? randBetween(Math.min(0L, ytdRem), Math.max(0L, ytdRem)) : ytdRem,
                    volume: t < maxT ? randBetween(0L, volRem) : volRem
                ]
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
