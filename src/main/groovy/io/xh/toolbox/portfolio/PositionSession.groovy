package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormat
import io.xh.hoist.util.Utils


class PositionSession implements JSONFormat {

    final String id
    final String channelKey
    final String topic

    private PositionResultSet positions


    PositionSession(PositionQuery query, String channelKey, String topic) {
        this.id = [channelKey, topic].join('||')
        this.channelKey = channelKey
        this.topic = topic
        this.positions = positionService.getPositions(query)
    }

    void pushUpdate() {
        PositionResultSet newPositions = positionService.getPositions(positions.query)

        // find changed positions, and send them as a flat list of updates.
        Map<String, Position> oldPositionMap = getMappedPositions(positions.root)
        Map<String, Position> newPositionMap = getMappedPositions(newPositions.root)

        def allIds = oldPositionMap.keySet()
        List<Position> changedPositions = allIds.findAll { id ->
            if (id == 'root') return false
            Position oldPos = oldPositionMap[id]
            Position newPos = newPositionMap[id]
            // Position tree structure is the same in new positions and old, as only prices have changed.
            // So, positions are different iff their pnl and/or mktVal values differ.
            return (newPos.pnl != oldPos.pnl || newPos.mktVal != oldPos.mktVal)
        }.collect { id -> newPositionMap[id] }

        Utils.webSocketService.pushToChannel(channelKey, topic, changedPositions)
    }


    //--------------------
    // Implementation
    //--------------------

    private Map<String, Position> getMappedPositions(Position root) {
        Map<String, Position> ret = [:]
        Closure<Void> addToPositionMapRecursive
        addToPositionMapRecursive = { Position pos ->
            ret[pos.id] = pos
            if (pos.children) {
                pos.children.each { childPos ->
                    addToPositionMapRecursive(childPos)
                }
            }
            return
        }
        addToPositionMapRecursive(root)
        return ret
    }

    private PositionService getPositionService() {
        Utils.appContext.positionService
    }

    void destroy() {

    }

    Object formatForJSON() {
        return [
                id: id,
                channelKey: channelKey,
                topic: topic,
                positions: positions
        ]
    }
}
