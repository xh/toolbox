package io.xh.toolbox.admin

import io.xh.hoist.BaseService
import io.xh.hoist.cache.CacheValueChanged
import io.xh.hoist.cache.CachedValue

import static io.xh.hoist.util.DateTimeUtils.SECONDS
import static io.xh.toolbox.admin.TestUtils.generatePrice
import static io.xh.toolbox.admin.TestUtils.generateResultSet
import static java.lang.Thread.sleep

class TestCachedValueService extends BaseService {

    private CachedValue<List> resultValue = new CachedValue<>(
        name: 'result',
        replicate: true,
        svc: this,
        onChange: this.&onChange
    )

    private CachedValue<Long> priceValue = new CachedValue<>(
        name: 'price',
        expireTime: 30*SECONDS,
        replicate: true,
        svc: this,
        onChange: this.&onChange
    )

    private List<CachedValue> allValues = [resultValue, priceValue]

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

    private void onChange(CacheValueChanged change) {
        logDebug(change.source.name, [key: change.key, value: change.value, oldValue: change.oldValue])
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
