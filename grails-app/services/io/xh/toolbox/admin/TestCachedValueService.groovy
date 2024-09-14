package io.xh.toolbox.admin

import groovy.transform.CompileStatic
import io.xh.hoist.BaseService
import io.xh.hoist.cache.CacheValueChanged
import io.xh.hoist.cache.CachedValue

import static io.xh.hoist.util.DateTimeUtils.SECONDS
import static io.xh.toolbox.admin.TestUtils.generatePrice
import static io.xh.toolbox.admin.TestUtils.generateResultSet
import static java.lang.Thread.sleep

@CompileStatic
class TestCachedValueService extends BaseService {

    private CachedValue<List> resultValue = createCachedValue(
        name: 'result',
        replicate: true,
        onChange: {CacheValueChanged e ->
            logDebug(e.source.name, [key: e.key, value: e.value])
        }
    )

    private CachedValue<Long> priceValue = createCachedValue(
        name: 'price',
        expireTime: 30*SECONDS,
        replicate: true,
        serializeOldValue: true,
        onChange: { CacheValueChanged e ->
            logDebug(e.source.name, [key: e.key, value: e.value, oldValue: e.oldValue])
        }
    )

    private List<CachedValue<?>> allValues = [resultValue, priceValue]

    void init() {
        super.init()
        initData()
    }

    private void initData() {
        if (isPrimary) {
            sleep(15 * SECONDS)    // Simulate delay to generate results
            resultValue.set(generateResultSet())
            priceValue.getOrCreate {
                generatePrice()
            }
        }
        resultValue.ensureAvailable()

        logInfo('Values', allValues.collectEntries { [it.name, it.get()]})
    }

    void clearCaches() {
        super.clearCaches()
        allValues.each {it.clear()}
        initData()
    }

    Map getAdminStats() {
        return allValues.collectEntries { [it.name, it.get()] }
    }
}
