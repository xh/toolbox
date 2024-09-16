package io.xh.toolbox.admin

import groovy.transform.CompileStatic
import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache
import io.xh.hoist.cache.CacheValueChanged

import java.time.LocalDate

import static io.xh.hoist.util.DateTimeUtils.SECONDS
import static java.lang.Thread.sleep
import static TestUtils.*

@CompileStatic
class TestCacheService extends BaseService {

    private Cache<LocalDate, List> resultCache = createCache(
        name: 'result',
        replicate: true,
        onChange: {CacheValueChanged e ->
            logDebug(e.source.name, [key: e.key, value: e.value])
        }
    )

    private Cache<String, Long> priceCache = createCache(
        name: 'prices',
        expireTime: {30*SECONDS},
        replicate: true,
        serializeOldValue: true,
        onChange: { CacheValueChanged e ->
            logDebug(e.source.name, [key: e.key, value: e.value, oldValue: e.oldValue])
        }
    )

    private List<Cache> allCaches = [resultCache, priceCache] as List<Cache>

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
            priceCache.getOrCreate('MSFT') {5000L}
        }
        resultCache.ensureAvailable(LocalDate.now(), timeout: 60 * SECONDS)

        logInfo('Sizes', allCaches.collectEntries { [it.name, it.size()]})
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
