package io.xh.toolbox.admin

import groovy.json.JsonOutput
import io.xh.hoist.security.AccessRequiresRole
import io.xh.toolbox.BaseController

import java.util.concurrent.ThreadLocalRandom

/**
 * Serves generated test data for the Admin > Tests > Grid panel.
 */
@AccessRequiresRole('HOIST_ADMIN_READER')
class GridTestController extends BaseController {

    /**
     * Flush the response to the client after roughly this many bytes have been written.
     *
     * Note the servlet container streams on its own as its (much smaller) response buffer fills -
     * explicit flushes exist to defeat any larger buffering layers between server and client
     * (compression filters, reverse proxies) that could otherwise hold the entire response,
     * while remaining coarse enough to avoid per-row flush overhead. Sized to align with the
     * chunk granularity a streaming fetch client typically consumes.
     */
    private static final int FLUSH_INTERVAL_BYTES = 128 * 1024

    /**
     * Stream flat grid test rows as NDJSON - one JSON object per line, flushed immediately after
     * the first row (prompt time-to-first-record for the client) and every FLUSH_INTERVAL_BYTES
     * thereafter. Source for the panel's "Load NDJSON" test of `Store.loadDataAsync()`, which
     * creates records as chunks arrive without ever buffering the complete raw dataset in memory.
     *
     * Rows match the shape of the client-side generator in GridTestData.ts (flat mode).
     */
    def ndjson(Integer recordCount, Integer idSeed) {
        recordCount = recordCount ?: 100000
        idSeed = idSeed ?: 1

        response.contentType = 'application/x-ndjson'
        response.characterEncoding = 'UTF-8'

        def out = response.outputStream,
            rand = ThreadLocalRandom.current(),
            traderCount = Math.max(1, (recordCount / 10) as int)
        long unflushed = 0

        for (int i = 0; i < recordCount; i++) {
            def symbol = "Symbol $i" as String,
                row = [
                    id    : "${idSeed}~${symbol}" as String,
                    symbol: symbol,
                    trader: "Trader ${i % traderCount}" as String,
                    day   : rand.nextLong(-80000, 100001),
                    mtd   : rand.nextLong(-500000, 500001),
                    ytd   : rand.nextLong(-1000000, 2000001),
                    volume: rand.nextLong(1000, 2000001)
                ]

            byte[] line = (JsonOutput.toJson(row) + '\n').getBytes('UTF-8')
            out.write(line)
            unflushed += line.length

            if (i == 0 || unflushed >= FLUSH_INTERVAL_BYTES) {
                out.flush()
                unflushed = 0
            }
        }
        out.flush()
    }
}
