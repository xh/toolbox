package io.xh.toolbox.blueprints

import java.time.Instant

/**
 * One client's live subscription to a Blueprints data request. Holds the rows and server
 * aggregates last sent, and diffs fresh ones against them into `{add, update, remove, aggregates}`.
 */
class BlueprintSession {

    final String channelKey
    final String topic
    /** The auth user who subscribed, and owns the channel. */
    final String owner
    final BlueprintRequest request
    /** When the first rows were computed. Updates computed before then must not apply. */
    final Instant snapshotTime

    private Map<Object, Map> rows
    private List<List<String>> sets
    // Values last sent, by a group's dims.
    private Map<Map, Map> aggregates = [:]

    BlueprintSession(String channelKey, String topic, String owner, BlueprintRequest request, BlueprintResult first, Instant snapshotTime) {
        this.channelKey = channelKey
        this.topic = topic
        this.owner = owner
        this.request = request
        this.snapshotTime = snapshotTime
        this.rows = byId(first.rows)
        this.sets = new ArrayList(request.groupBy)
        recordAggregates(first.aggregates)
    }

    String getId() {
        key(channelKey, topic)
    }

    static String key(String channelKey, String topic) {
        "$channelKey||$topic"
    }

    /** Grouping sets whose server values this session pushes. */
    synchronized List<List<String>> getSets() {
        new ArrayList(this.@sets)
    }

    /** Add grouping sets, with their values as just sent. */
    synchronized void addSets(List<List<String>> newSets, List<Map> values) {
        for (List<String> set : newSets) {
            if (!this.@sets.contains(set)) this.@sets << set
        }
        recordAggregates(values)
    }

    /** Replace the rows and aggregates, returning the changes, or null if there are none. */
    synchronized Map update(BlueprintResult result) {
        Map<Object, Map> next = byId(result.rows)
        List<Map> add = [], update = []
        next.each { id, row ->
            Map prev = rows[id]
            if (prev == null) add << row
            else if (prev != row) update << row
        }
        List remove = rows.keySet().findAll { !next.containsKey(it) }.toList()
        rows = next

        List<Map> changedAggs = (result.aggregates ?: []).findAll { aggregates[it.dims] != it.values }
        recordAggregates(changedAggs)

        if (!add && !update && !remove && !changedAggs) return null
        Map ret = [add: add, update: update, remove: remove]
        if (changedAggs) ret.aggregates = changedAggs
        return ret
    }

    private void recordAggregates(List<Map> values) {
        values?.each { aggregates[it.dims as Map] = it.values as Map }
    }

    private static Map<Object, Map> byId(List<Map> rows) {
        rows.collectEntries { [it.id, it] }
    }
}
