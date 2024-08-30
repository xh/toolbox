package io.xh.toolbox.admin

import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache
import io.xh.hoist.cache.CacheValueChanged

import java.time.LocalDate

import static io.xh.hoist.util.DateTimeUtils.SECONDS
import static java.lang.Thread.sleep
import static TestUtils.*

class TestCacheService extends BaseService {

    private Cache<LocalDate, List> resultCache = new Cache<>(
        name: 'result',
        replicate: true,
        svc: this,
        onChange: this.&onChange
    )

    private Cache<String, Long> priceCache = new Cache<>(
        name: 'prices',
        expireTime: {30*SECONDS},
        replicate: true,
        svc: this,
        onChange: this.&onChange
    )

    private List<Cache> allCaches = [resultCache, priceCache]

    void init() {
        super.init()
        initData()
    }

    private void initData() {
        if (isPrimary) {
            // Simulate initial delay
            sleep(15 * SECONDS)
            resultCache.put(LocalDate.now(), generateResultSet())
            5.times {
                priceCache.put(generateSymbol(), generatePrice())
            }
            priceCache.getOrCreate('MSFT') {5000}
        }
        resultCache.ensureAvailable(LocalDate.now())

        logInfo('Sizes', allCaches.collectEntries { [it.name, it.size()]})
    }

    private void onChange(CacheValueChanged change) {
        logDebug(change.source.name, [key: change.key, value: change.value, oldValue: change.oldValue])
    }

    void clearCaches() {
        super.clearCaches()
        allCaches.each { it.clear() }
        initData()
    }

    Map getAdminStats() {
        return allCaches.collectEntries { [it.name, it.map] }
    }
}
