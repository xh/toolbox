package io.xh.toolbox.admin

import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache
import io.xh.hoist.cache.CacheValueChanged

import java.time.LocalDate

import static grails.async.Promises.task
import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static io.xh.hoist.util.DateTimeUtils.SECONDS
import static java.lang.Thread.sleep
import static TestUtils.*

class TestCacheService extends BaseService {

    private Cache<LocalDate, List> resultCache = new Cache<>(name: 'result', replicate: true, svc: this)
    private Cache<String, Long> priceCache = new Cache<>(name: 'prices', expireTime: 30*SECONDS, replicate: true, svc: this)
    private Cache<String, Long> localPriceCache  = new Cache<>(name: 'localPrices', expireTime: {30*SECONDS}, replicate: false, svc: this)
    private Cache<String, Boolean> flagCache = new Cache<>(name: 'flags', replicate: true, svc: this)

    private List<Cache> allCaches = [resultCache, priceCache, localPriceCache, flagCache]

    void init() {
        super.init()

        allCaches.each(this.&logEvents)

        createTimer(
            primaryOnly: true,
            interval: 15 * SECONDS,
            runImmediatelyAndBlock: true
        )
        resultCache.ensureAvailable(LocalDate.now())

        // Shutdown after 2 minutes of changes, to avoid trashing logs
        task {
            sleep(2 * MINUTES)
            timers[0]?.cancel()
            logInfo('sizes', allCaches.collectEntries { [it.name, it.size()]})
        }
    }

    private void onTimer() {
        LocalDate today = LocalDate.now()

        // Simulate initial delay
        if (!resultCache.get(today)) sleep(15 * SECONDS)

        resultCache.put(today, generateResultSet())
        priceCache.put(generateSymbol(), generatePrice())
        localPriceCache.put(generateSymbol(), generatePrice())
        flagCache.put('toggleValue', !flagCache.get('toggleValue'))
    }

    private void logEvents(Cache c) {
        c.addChangeHandler { CacheValueChanged change ->
            logDebug(c.name, [key: change.key, value: change.value])
        }
    }
}
