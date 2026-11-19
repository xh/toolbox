package io.xh.toolbox.blueprints

import java.time.Instant

/**
 * One client's live subscription to a Blueprints data request. Holds the rows last sent, and
 * diffs fresh rows against them into `{add, update, remove}`.
 */
class BlueprintSession {

    final String channelKey
    final String topic
    final BlueprintRequest request
    /** When the first rows were computed. Updates computed before then must not apply. */
    final Instant snapshotTime

    private Map<Object, Map> rows

    BlueprintSession(String channelKey, String topic, BlueprintRequest request, List<Map> rows, Instant snapshotTime) {
        this.channelKey = channelKey
        this.topic = topic
        this.request = request
        this.rows = byId(rows)
        this.snapshotTime = snapshotTime
    }

    String getId() {
        key(channelKey, topic)
    }

    static String key(String channelKey, String topic) {
        "$channelKey||$topic"
    }

    /** Replace the rows, returning the changes, or null if there are none. */
    synchronized Map update(List<Map> newRows) {
        Map<Object, Map> next = byId(newRows)
        List<Map> add = [], update = []
        next.each { id, row ->
            Map prev = rows[id]
            if (prev == null) add << row
            else if (prev != row) update << row
        }
        List remove = rows.keySet().findAll { !next.containsKey(it) }.toList()
        rows = next

        if (!add && !update && !remove) return null
        return [add: add, update: update, remove: remove]
    }

    private static Map<Object, Map> byId(List<Map> rows) {
        rows.collectEntries { [it.id, it] }
    }
}
