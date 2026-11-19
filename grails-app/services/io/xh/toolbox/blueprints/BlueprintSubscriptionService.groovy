package io.xh.toolbox.blueprints

import io.xh.hoist.BaseService
import io.xh.toolbox.portfolio.PortfolioConfig
import io.xh.toolbox.portfolio.PortfolioDatasets

import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

import static io.xh.hoist.util.DateTimeUtils.SECONDS

/**
 * Live Blueprints data subscriptions. Each returns its first rows, then pushes
 * `{add, update, remove}` to its web socket channel and topic while its rows can change.
 */
class BlueprintSubscriptionService extends BaseService {

    def blueprintDataService,
        portfolioService,
        webSocketService,
        configService

    private Map<String, BlueprintSession> sessions = new ConcurrentHashMap()

    void init() {
        createTimer(
            name: 'pushUpdates',
            runFn: this.&pushUpdates,
            interval: {config.pushUpdatesIntervalSecs * SECONDS},
            delay: true
        )
    }

    /** Start a subscription, replacing any on the same channel and topic. Returns its first rows and aggregates. */
    BlueprintResult subscribe(Map spec, String channelKey, String topic) {
        if (!channelKey || !topic) throw new BlueprintRequestException('Subscribe requires channelKey and topic')

        BlueprintRequest req = blueprintDataService.parseRequest(spec)
        PortfolioDatasets ds = blueprintDataService.isPortfolioDataset(req.dataset) ? blueprintDataService.currentDatasets() : null
        BlueprintResult result = blueprintDataService.query(req, ds)
        def session = new BlueprintSession(channelKey, topic, req, result, ds?.now ?: Instant.now())
        sessions[session.id] = session
        return result
    }

    /**
     * Server aggregates for a request's grouping sets. With a channelKey and topic, also adds the
     * sets to that subscription's pushes. An unknown subscription is ignored.
     */
    List<Map> aggregates(Map spec, String channelKey = null, String topic = null) {
        BlueprintRequest req = blueprintDataService.parseRequest(spec)
        List<Map> ret = blueprintDataService.query(req).aggregates ?: []
        BlueprintSession session = channelKey && topic ? sessions[BlueprintSession.key(channelKey, topic)] : null
        session?.addSets(req.groupBy, ret)
        return ret
    }

    /** End a subscription. A no-op for an unknown one. */
    void unsubscribe(String channelKey, String topic) {
        sessions.remove(BlueprintSession.key(channelKey, topic))
    }

    //------------------------
    // Implementation
    //------------------------
    private void pushUpdates() {
        sessions.values()
            .findAll { !webSocketService.hasChannel(it.channelKey) }
            .each { sessions.remove(it.id) }

        if (!sessions || !portfolioService.portfolioAvailable) return

        PortfolioDatasets ds = blueprintDataService.currentDatasets()
        sessions.values().each { session ->
            try {
                if (session.snapshotTime.isAfter(ds.now) || !blueprintDataService.isLive(session.request, ds)) return
                Map update = session.update(blueprintDataService.query(session.request, ds, session.sets))
                if (update) webSocketService.pushToChannel(session.channelKey, session.topic, update)
            } catch (Exception e) {
                logError("Failed to push update for ${session.topic}", e)
            }
        }
    }

    private PortfolioConfig getConfig() {
        configService.getObject(PortfolioConfig)
    }

    Map getAdminStats() {[
        sessions: sessions.size()
    ]}
}
