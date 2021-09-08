package io.xh.toolbox.portfolio

import io.xh.hoist.BaseService

import java.util.concurrent.ConcurrentHashMap

import static io.xh.hoist.util.DateTimeUtils.getSECONDS


class PositionService extends BaseService {

    private Map<String, PositionSession> sessions = new ConcurrentHashMap()

    def portfolioService,
        webSocketService,
        configService

    void init() {
        createTimer(
                runFn: this.&pushUpdatesToAllSessions,
                interval: {config.pushUpdatesIntervalSecs},
                intervalUnits: SECONDS,
                delay: true
        )
        super.init()
    }


    PositionSession getLivePositions(PositionQuery query, String channelKey, String topic) {
        def newSession = new PositionSession(query, channelKey, topic),
            oldSession = sessions[newSession.id]

        if (oldSession) oldSession.destroy()
        sessions[newSession.id] = newSession
        return newSession
    }


    PositionResultSet getPositions(PositionQuery query) {

        List<RawPosition> rawPositions = portfolioService.getData().rawPositions

        List<Position> positions = groupPositions(query.dims, rawPositions, 'root')

        Position root = new Position(
                id: 'root',
                name: 'Total',
                pnl: (positions.sum { it.pnl }) as long,
                mktVal: (positions.sum { it.mktVal }) as long,
                children: positions
        )

        Map options = [
                maxCount: query.maxCount,
                returnAllGroups: query.returnAllGroups
        ]

        if (options.maxCount) truncatePositions(root, options)

        return new PositionResultSet(
                query: query,
                root: root
        )
    }

    Position getPosition(String positionId) {

        List<RawPosition> rawPositions = portfolioService.getData().rawPositions

        Map<String, String> parsedId = parsePositionId(positionId)
        List<String> dims = parsedId.keySet() as List<String>
        List<String> dimVals = parsedId.values() as List<String>

        List<RawPosition> positions = rawPositions.findAll { pos ->
            dims.every { dim ->
                pos."$dim" == parsedId[dim]
            }
        }

        return new Position(
                id: positionId,
                name: dimVals.last(),
                children: null,
                pnl: positions.sum { it.pnl } as long,
                mktVal: positions.sum { it.mktVal } as long,
        )
    }


    List<Order> ordersForPosition(String positionId) {
        List<Order> orders = portfolioService.getData().orders

        Map<String, String> parsedId = parsePositionId(positionId)
        List<String> dims = parsedId.keySet() as List<String>

        return orders.findAll { order ->
            dims.every { dim ->
                parsedId[dim] == order."$dim"
            }
        }
    }

    //----------------------
    // Implementation
    //----------------------

    // Generate grouped, hierarchical position roll-ups for a list of one or more dimensions.
    private List<Position> groupPositions(List<String> dims, List<RawPosition> positions, String id) {

        String dim = dims.first()
        Map<String, List<RawPosition>> byDimVal = positions.groupBy { it."$dim" }

        List<String> childDims = dims.tail()
        return byDimVal.collect { dimVal, members ->

            String posId = id + ">>${dim}:${dimVal}"

            // Recurse to create children for this node if additional dimensions remain.
            // Use these children to calc metrics, bottom up, if possible.
            List<Position> children = childDims ? groupPositions(childDims, members, posId) : null
            List<Object> calcChildren = children ?: members

            new Position(
                    id: posId,
                    name: dimVal,
                    children: children,
                    pnl: calcChildren.sum { it.pnl } as long,
                    mktVal: calcChildren.sum { it.mktVal } as long
            )
        }
    }

    private long truncatePositions(Position root, Map options) {
        Integer maxCount = options.maxCount as Integer
        if (!maxCount) return 0

        Boolean returnAllGroups = options.returnAllGroups ?: false
        Closure priorityFn = options.priorityFn ?: { pos -> Math.abs(pos.pnl) }

        Map<Position, Position> parentMap = buildParentMap(root)

        long numToTruncate = parentMap.size() - maxCount
        if (numToTruncate <= 0) return 0

        List<Position> removeCandidates = parentMap.keySet().sort(priorityFn)
        if (returnAllGroups) {
            removeCandidates.removeAll { pos ->
                parentMap[pos].is(root)
            }
        }

        // Start peeling off items into candidate baskets. Baskets are confirmed when they reach two members.
        // When the number of peeled items minus confirmed baskets is large enough, we are done.
        Map<Position, List<Position>> candidateBaskets = [:]
        Map<Position, List<Position>> confirmedBaskets = [:]
        Set<Position> removals = new HashSet<Position>()

        Closure<Void> removePos
        removePos = { Position pos ->
            removals.add(pos)
            confirmedBaskets.remove(pos)
            candidateBaskets.remove(pos)

            List<Position> children = pos.children
            if (children) {
                children.each(removePos)
            }
            return
        }

        for (Position minor : removeCandidates) {
            if (removals.contains(minor)) continue
            if (removals.size() - confirmedBaskets.size() >= numToTruncate) break

            Position parent = parentMap[minor]

            // 1) Promote candidate basket that will now hit two positions
            List<Position> basket = candidateBaskets.remove(parent)
            if (basket) {
                confirmedBaskets[parent] = basket
                removePos(basket.first())
            }

            // 2) Now process this position
            basket = confirmedBaskets[parent]
            if (basket) {
                basket << minor
                removePos(minor)
            } else {
                candidateBaskets[parent] = [minor]
            }
        }

        confirmedBaskets.each { parent, minors ->
            List<Position> children = parent.children
            children.removeAll(minors)
            children << createBasket(minors)
        }

        return removals.size() - confirmedBaskets.size()
    }

    private Position createBasket(List<Position> minors) {
        String basketName = "Minor Positions (${minors.size()})"
        String firstPosId = minors.first().id
        Integer idx = firstPosId.lastIndexOf(':')
        String basketId = firstPosId.substring(0, idx+1) + basketName
        Long basketPnl = minors.sum { it.pnl } as Long
        Long basketMktVal = minors.sum { it.mktVal } as Long

        return new Position(
                id: basketId,
                name: basketName,
                pnl: basketPnl,
                mktVal: basketMktVal,
                children: null
        )
    }

    private Map<Position, Position> buildParentMap(Position root) {
        Closure<Void> addToParentMapRecursive
        Map<Position, Position> ret = [:]
        addToParentMapRecursive = { Position pos ->
            if (!pos.children) return
            for (Position child : pos.children) {
                ret[child] =  pos
                addToParentMapRecursive(child)
            }
        }
        addToParentMapRecursive(root)
        return ret
    }

    // Parse a drill-down ID from a rolled-up position into a map of all
    // dimensions -> dim values contained within the rollup.
    private Map<String, String> parsePositionId(String id) {
        List<String> dims = id.split('>>').drop(1)
        return dims.collectEntries { it.split(':') as List<String> }
    }


    void pushUpdatesToAllSessions() {
        cullSessions()
        sessions.values().each {
            it.pushUpdate()
        }
    }

    void cullSessions() {
        def obsoleteSessions = sessions.values().findAll {
            !webSocketService.hasChannel(it.channelKey)
        }
        obsoleteSessions.each {
            it.destroy()
            sessions.remove(it.id)
        }
    }

    private Map getConfig() {
        configService.getMap('portfolioConfigs')
    }
}
