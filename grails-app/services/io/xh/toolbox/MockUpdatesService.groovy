package io.xh.toolbox

import io.xh.hoist.BaseService

import java.time.Instant

import static io.xh.hoist.util.DateTimeUtils.SECONDS

class MockUpdatesService extends BaseService {

    def webSocketService

    private Set<String> subs = []
    private Long updateCounter = 0

    void init() {
        createTimer(
            name: 'pushMockUpdate',
            runFn: this.&pushMockUpdate,
            interval: 3 * SECONDS
        )
    }

    void subscribe(String channelKey) {
       subs.add(channelKey)
    }

    void unsubscribe(String channelKey) {
        subs.remove(channelKey)
    }


    //------------------------
    // Implementation
    //------------------------
    private void pushMockUpdate() {
        def subCount = subs.size()
        cullInactiveSubs()

        def culledCount = subCount - subs.size()
        if (culledCount) logInfo("Culled $culledCount inactive subscribers")

        if (subs) {
            logDebug("Pushing mock update to ${subs.size()} active subscribers.")
            webSocketService.pushToChannels(subs, 'mockUpdate', [
                id: updateCounter,
                timestamp: Instant.now()
            ])

            updateCounter++
        }
    }

    private void cullInactiveSubs() {
        subs.removeAll{!webSocketService.hasChannel(it)}
    }

}
