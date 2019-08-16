package io.xh.toolbox.portfolio

import groovy.util.logging.Slf4j
import io.xh.hoist.json.JSONFormat
import io.xh.hoist.util.Utils

@Slf4j
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
        PositionUpdate posUpdate = computeDiff(newPositions)

        Utils.webSocketService.pushToChannel(channelKey, topic, posUpdate)

        this.positions = newPositions
    }


    //--------------------
    // Implementation
    //--------------------
    private PositionUpdate computeDiff(PositionResultSet newPositions) {
        Map oldPositionMap = getMappedPositions(positions.root)

        // 1) Compute updates and adds by recursively traversing the new positions tree
        List<Position> updates = []
        List<Map> adds = []
        Closure computeDiffRecursive
        computeDiffRecursive = {Position newPos, String parentId ->
            String id = newPos.id
            Position oldPos = oldPositionMap[id]

            // If id corresponds to an existing position, update it
            if (oldPos) {
                if (oldPos.pnl != newPos.pnl || oldPos.mktVal != newPos.mktVal) {
                    updates << newPos
                }

                newPos.children.each { Position newPosChild ->
                    computeDiffRecursive(newPosChild, id)
                }

            } else {
                adds << [parentId: parentId, rawData: newPos]
            }
        }
        computeDiffRecursive(newPositions.root, null)

        // 2) Compute deletes with a simple pass through existing positions
        Map newPositionMap = getMappedPositions(newPositions.root)
        Collection<String> deletes = oldPositionMap.keySet().findAll {!newPositionMap[it]}

        return new PositionUpdate(updates: updates, adds: adds, deletes: deletes)
    }

    private Map<String, Position> getMappedPositions(Position pos, Map<String, Position> col = [:]) {
        col[pos.id] = pos
        pos.children.each { getMappedPositions(it, col) }
        return col
    }

    private PositionService getPositionService() {
        Utils.appContext.positionService
    }

    Object formatForJSON() {
        return [
                id: id,
                channelKey: channelKey,
                topic: topic,
                positions: positions
        ]
    }

    void destroy() {

    }
}
