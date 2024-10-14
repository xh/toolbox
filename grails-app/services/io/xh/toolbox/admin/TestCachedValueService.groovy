package io.xh.toolbox.admin

import groovy.transform.CompileStatic
import io.xh.hoist.BaseService
import io.xh.hoist.cachedvalue.CachedValue
import io.xh.hoist.cachedvalue.CachedValueChanged

import static io.xh.hoist.util.DateTimeUtils.SECONDS
import static io.xh.toolbox.admin.TestUtils.generatePrice
import static io.xh.toolbox.admin.TestUtils.generateResultSet

@CompileStatic
class TestCachedValueService extends BaseService {

    private CachedValue<List> resultValue = createCachedValue(
        name: 'result',
        replicate: true,
        onChange: {CachedValueChanged e ->
            logDebug(e.source.name, [value: e.value])
        }
    )

    private CachedValue<Long> priceValue = createCachedValue(
        name: 'price',
        expireTime: 30*SECONDS,
        replicate: true,
        onChange: { CachedValueChanged e ->
            logDebug(e.source.name, [value: e.value, oldValue: e.oldValue])
        }
    )

    private List<CachedValue<?>> allValues = [resultValue, priceValue]

    void init() {
        super.init()
        if (isPrimary) initData()
        resultValue.ensureAvailable()
    }

    private void initData() {
        resultValue.set(generateResultSet())
        priceValue.getOrCreate {
            generatePrice()
        }
        logInfo('Values', allValues.collectEntries { [it.name, it.get()] })
    }

    void clearCaches() {
        super.clearCaches()
        allValues.each {it.clear()}
        if (isPrimary) initData()
    }

    Map getAdminStats() {
        return allValues.collectEntries { [it.name, it.get()] }
    }
}
