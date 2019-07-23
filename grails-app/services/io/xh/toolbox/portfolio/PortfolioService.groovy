package io.xh.toolbox.portfolio

import io.xh.hoist.BaseService

import java.time.Instant
import java.time.LocalTime

import static io.xh.toolbox.portfolio.Utils.*
import static java.time.ZoneOffset.UTC

class PortfolioService extends BaseService {

    def marketService

    private final List MODELS = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul']
    private final List FUNDS = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay']
    private final List TRADERS = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn', 'Robert Greer', 'HedgeSys', 'Susan Major']
    private final int ORDERS_COUNT = 20000

    private List<Order> orders
    private List<RawPosition> rawPositions

    void init() {
        orders = generateOrders()
        rawPositions = calculateRawPositions(orders)

        super.init()
    }

    /**
     * Return a portfolio of hierarchically grouped positions for the selected dimension(s).
     * @param dims - field names for dimensions on which to group.
     */
    List<Position> getPortfolio(List<String> dims, boolean includeSummary = false) {

        List<Position> positions = getPositions(dims)

        return (!includeSummary) ? positions : [
                new Position(
                        id      : 'summary',
                        name    : 'Total',
                        pnl     : positions.sum { it.pnl },
                        mktVal  : positions.sum { it.mktVal },
                        children: positions
                )
        ]
    }


    /**
     * Return a single grouped position, uniquely identified by drill-down ID.
     * @param positionId - ID installed on each position returned by `getPortfolio()`.
     */
    Position getPosition(String positionId) {

        Map parsedId = parsePositionId(positionId)
        log.debug("getting position: " + positionId)
        List dims = parsedId.keySet() as List
        List dimVals = parsedId.values()

        List<Position> positions = getPositions(dims)
        Position ret = null

        dimVals.each { dimVal ->
            ret = positions.find { it.name == dimVal }
            if (ret.getChildren()) positions = ret.getChildren()
        }

        return ret
    }


    List<Order> getOrders(String positionId) {
        if (!positionId)
            return []
        else {
            log.debug("getting position for order: " + positionId)
            Map parseId = parsePositionId(positionId)
            List dims = parseId.keySet() as List

            return orders.findAll { order ->
                dims.every { dim ->
                    parseId[dim] == order."$dim"
                }
            }
        }
    }



    //------------------------
    // Implementation
    //------------------------
    private List<Order> generateOrders() {
        List<Order> ret = new ArrayList<Order>(ORDERS_COUNT)
        List<String> symbols = marketService.getAllSymbols() as List
        ORDERS_COUNT.times {i ->

            // Get random attributes
            def symbol = sample(symbols),
                fund = sample(FUNDS),
                model = sample(MODELS),
                trader = sample(TRADERS),
                dir = sample(['Sell', 'Buy']),
                hour = randInt(9, 16),
                min = randInt(0, 59)

            // Calc 2nd order, partially random attributes
            MarketPrice mktData = sample(marketService.getMarketData(symbol))
            Instant time = mktData.day.atTime(LocalTime.of(hour, min)).toInstant(UTC)
            long quantity = randInt(300, 10000) * (dir == 'Sell' ? -1 : 1)
            double price = randDouble(mktData.low, mktData.high).round(2)
            long mktVal = (quantity * price).round()

            ret << new Order(
                    id: "order-${i}",
                    symbol: symbol,
                    dir: dir,
                    quantity: quantity,
                    price: price,
                    mktVal: mktVal,
                    time: time,
                    model: model,
                    fund: fund,
                    trader: trader,
                    commission: Math.abs(mktVal * 0.0002),
                    confidence: randInt(0, 1000)
            )
        }

        return ret.sort { it.time }
    }

    // Calculate lowest-level leaf positions with P&L.
    private List<RawPosition> calculateRawPositions(List<Order> orders) {
        Map<String, List<Order>> bySymbol = orders.groupBy { it.symbol }
        List<RawPosition> ret = []

        bySymbol.each { symbol, ordersForSymbol ->
            Order first = ordersForSymbol.first()
            double endPx = marketService.getMarketData(symbol).last().close

            def endQty = 0
            def netCashflow = 0

            ordersForSymbol = ordersForSymbol.sort { it.time }
            ordersForSymbol.each {
                endQty += it.quantity
                netCashflow -= it.mktVal
            }

            // Crude P&L calc.
            long endMktVal = (endQty * endPx).round()
            long pnl = netCashflow + endMktVal

            ret << new RawPosition(
                    symbol: symbol,
                    model : first.model,
                    fund  : first.fund,
                    trader: first.trader,
                    mktVal: endMktVal,
                    pnl   : pnl
            )
        }

        return ret
    }

    // Generate grouped, hierarchical position roll-ups for a list of one or more dimensions.
    private List<Position> getPositions(List<String> dims, List<RawPosition> positions = rawPositions, String id = 'root') {
        List<String> dimsCopy = dims.collect()  // Avoid mutating our input array.

        String dim = dimsCopy.first()
        dimsCopy.remove(0)
        Map byDimVal = positions.groupBy { it[dim] }
        List<Position> ret = []

        byDimVal.each { dimVal, members ->
            Position pos = new Position([
                    // Generate a drill-down ID that encodes the path to this row.
                    id    : id + ">>${dim}:${dimVal}",
                    name  : dimVal,
                    pnl   : members.sum { it.pnl },
                    mktVal: members.sum { it.mktVal }
            ])

            // Recurse to create children for this node if additional dimensions remain.
            if (dimsCopy.size()) {
                pos.setChildren(getPositions(dimsCopy, members, pos.id))
            }

            ret << pos
        }

        return ret
    }

    // Parse a drill-down ID from a rolled-up position into a map of all
    // dimensions -> dim values contained within the rollup.
    private Map parsePositionId(String id) {
        List<String> dims = id.split('>>').drop(1)
        Map posMap = [:]

        dims.each { dimStr ->
            List<String> dimParts = dimStr.split(':')
            posMap[dimParts[0]] = dimParts[1]
        }

        return posMap
    }

    void clearCaches() {
        super.clearCaches()

    }
}
