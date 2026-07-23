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
     * Stream flat grid test rows as NDJSON - one JSON object per line. Source for the panel's
     * "Load NDJSON" test of `Store.loadDataAsync()`, which creates records as chunks arrive
     * without ever buffering the complete raw dataset in memory.
     *
     * Flushed on the first row (prompt time-to-first-record for the client) and every 1000 rows
     * thereafter (~128KB at this row shape) - coarse enough to be cheap, frequent enough to keep
     * data streaming through any buffering layers (compression filters, reverse proxies) between
     * server and client.
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
            out << JsonOutput.toJson(row) << '\n'
            if (i % 1000 == 0) out.flush()
        }
        out.flush()
    }
}
