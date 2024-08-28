package io.xh.toolbox.admin

import io.xh.hoist.BaseService
import io.xh.hoist.cache.CacheValueChanged
import io.xh.hoist.cache.CachedValue

import static grails.async.Promises.task
import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static io.xh.hoist.util.DateTimeUtils.SECONDS
import static io.xh.toolbox.admin.TestUtils.generatePrice
import static io.xh.toolbox.admin.TestUtils.generateResultSet
import static java.lang.Thread.sleep

class TestCachedValueService extends BaseService {

    private CachedValue<List> resultValue = new CachedValue<>(name: 'result', replicate: true, svc: this)
    private CachedValue<Long> priceValue = new CachedValue<>(name: 'price', expireTime: 30*SECONDS, replicate: true, svc: this)
    private CachedValue<Long> localPriceValue  = new CachedValue<>(name: 'localPrice', expireTime: {30*SECONDS}, replicate: false, svc: this)
    private CachedValue<Boolean> flagValue = new CachedValue<>(name: 'flag', replicate: true, svc: this)


    private List<CachedValue> allValues = [resultValue, priceValue, localPriceValue, flagValue]

    void init() {
        super.init()
        allValues.each(this.&logEvents)

        createTimer(
            primaryOnly: true,
            runImmediatelyAndBlock: true,
            interval: 15 * SECONDS
        )
        resultValue.ensureAvailable()

        // Shutdown after 2 minutes of changes, to avoid trashing logs
        task {
            sleep(2 * MINUTES)
            timers[0]?.cancel()
            logInfo('Values: ', allValues.collectEntries { [it.name, it.get()]})
        }

    }

    private void onTimer() {
        // Simulate initial delay
        if (!resultValue.get()) sleep(15 * SECONDS)

        resultValue.set(generateResultSet())
        priceValue.set(generatePrice())
        localPriceValue.set(generatePrice())
        flagValue.set(!flagValue.get())
    }

    private void logEvents(CachedValue value) {
        value.addChangeHandler { CacheValueChanged change ->
            logDebug(change.key, [value: change.value])
        }
    }

}
