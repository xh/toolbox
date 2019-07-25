package io.xh.toolbox.portfolio

import io.xh.hoist.BaseService


class PositionService extends BaseService {

    def portfolioService

    List<Position> getPositions(List<String> dims) {

        List<RawPosition> rawPositions = portfolioService.getData().rawPositions

        List<Position> positions = groupPositions(dims, rawPositions, 'root')

        return [
                new Position(
                        id: 'root',
                        name: 'Total',
                        pnl: (positions.sum { it.pnl }) as long,
                        mktVal: (positions.sum { it.mktVal }) as long,
                        children: positions
                )
        ]
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

    // Parse a drill-down ID from a rolled-up position into a map of all
    // dimensions -> dim values contained within the rollup.
    private Map<String, String> parsePositionId(String id) {
        List<String> dims = id.split('>>').drop(1)
        return dims.collectEntries { it.split(':') as List<String> }
    }
}
