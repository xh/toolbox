package io.xh.toolbox.portfolio

import io.xh.hoist.BaseService

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.util.concurrent.ConcurrentHashMap

import static io.xh.toolbox.portfolio.Utils.*

class PortfolioService extends BaseService {

    def marketService

    private final List MODELS = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul']
    private final List FUNDS = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay']
    private final List TRADERS = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn', 'Robert Greer', 'HedgeSys', 'Susan Major']
    private final int ORDERS_COUNT = 20000

    private List<Order> orders = generateOrders()
    private List<Position> rawPositions

    void init() {
        def symbols = marketService.getAllSymbols()

        def symStr = symbols.take(5) as String
        log.debug(symStr)

        Map<String, List<MarketPrice>> marketData = new ConcurrentHashMap(symbols.size())
        symbols.each {
            marketData[it] = marketService.getMarketData(it)
        }

        tradingDays = marketData[symbols.first()].collect { it.getDay() }

        instData = marketData.collectEntries { symbol, marketPriceList ->
            [
                    symbol: [
                            sector : sample(sectors),
                            mktData: marketPriceList
                    ]
            ]
        }

        orders =

        rawPositions = calculateRawPositions()

        super.init()
    }

    /**
     * Return a portfolio of hierarchically grouped positions for the selected dimension(s).
     * @param dims - field names for dimensions on which to group.
     */
    List<GroupedPosition> getPortfolio(List<String> dims, boolean includeSummary = false) {

        List<GroupedPosition> positions = getPositions(dims)

        return (!includeSummary) ? positions : [
                new GroupedPosition([
                        id      : 'summary',
                        name    : 'Total',
                        pnl     : positions.sum { it.pnl },
                        mktVal  : positions.sum { it.mktVal },
                        children: positions
                ])
        ]
    }


    /**
     * Return a single grouped position, uniquely identified by drilldown ID.
     * @param positionId - ID installed on each position returned by `getPortfolio()`.
     */
    GroupedPosition getPosition(String positionId) {

        Map parsedId = parsePositionId(positionId)
        List dims = parsedId.keySet()
        List dimVals = parsedId.values()

        List<GroupedPosition> positions = getPositions(dims)
        GroupedPosition ret = null

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
            Map posDimsMap = parsePositionId(positionId)
            List dims = posDimsMap.keySet()
            return orders.findAll { order ->
                Map orderAsMap = order.formatForJSON()
                return dims.every { dim ->
                    posDimsMap[dim] == orderAsMap.position.formatForJSON()[dim]
                }
            }
        }
    }

    /**
     * Available as a general function to generate a collection of mock orders of any given size.
     * Called internally (lazily) to generate a reference set of orders from which positions are
     * built to populate the demo portfolio viewer app.
     *
     * @param count - desired number of synthetic orders to generate.
     * @returns{Promise<Object[]>}
     */
    List<Order> generateOrders(int count = ORDERS_COUNT) {
        List<Order> orders = []
        int i = 0 // Invariant: i == orders.length
        while (i < count) {
            LocalDate tradingDay = sample(tradingDays)

            int hour = randInt(9, 16); int min = randInt(0, 59)
            LocalDateTime time = tradingDay.atTime(LocalTime.of(hour, min))

            Position pos = getRandomPositionForPortfolio()
            String symbol = pos.getSymbol()
            String dir = sample(["Sell", "Buy"])
            long quantity = randInt(300, 10000) * (dir == "Sell" ? -1 : 1)
            // MAKE THIS FASTER BY SAMPLING DIRECTLY FROM getMktData(symbol)
            MarketPrice mktData = getMktData(symbol).find { it.getDay() == tradingDay }
            double price = randDouble(mktData.low, mktData.high).round(2)
            long mktVal = (quantity * price).round()

            orders << new Order([
                    id        : "order-${i}",
                    posId     : pos.getId(),
                    symbol    : symbol,
                    dir       : dir,
                    quantity  : quantity,
                    price     : price,
                    mktVal    : mktVal,
                    time      : time,
                    sector    : pos.getSector(),
                    model     : pos.getModel(),
                    fund      : pos.getFund(),
                    region    : pos.getRegion(),
                    trader    : pos.getTrader(),
                    commission: Math.abs(mktVal * 0.0002),
                    confidence: randInt(0, 1000)
            ])

            i += 1
        }

        log.debug("Generate orders")


        return orders.sort { it.getTime() }
    }


    //------------------------
    // Implementation
    //------------------------

    private Position getRandomPositionForPortfolio() {
        String symbol = sample(symbols)
        Map posMap = [
                symbol: symbol,
                sector: getSector(symbol),
                model : sample(models),
                fund  : sample(funds),
                region: sample(regions),
                trader: sample(traders)
        ]

        // Generate unique key for leaf-level grouping within calculateRawPositions.
        posMap.id = posMap.values().join('||')
        return new Position(posMap)
    }

    // Calculate lowest-level leaf positions with P&L.
    private List<Position> calculateRawPositions() {
        Map<String, List<Order>> byPosId = orders.groupBy { it.posId }
        List<Position> positions = []

        byPosId.each { id, ordersForId ->
            Order first = ordersForId.first()
            String symbol = first.getSymbol()
            double endPx = getMktData(symbol).last().getClose()

            def endQty = 0
            def netCashflow = 0

            ordersForId = ordersForId.sort { it.time }
            ordersForId.each {
                endQty += it.quantity
                netCashflow -= it.mktVal
            }

            // Crude P&L calc.
            double endMktVal = endQty * endPx
            double pnl = netCashflow + endMktVal

            positions << new Position([
                    symbol: symbol,
                    sector: first.sector,
                    model : first.model,
                    fund  : first.fund,
                    region: first.region,
                    trader: first.trader,
                    mktVal: endMktVal,
                    pnl   : pnl
            ])
        }

        return positions
    }

    // Generate grouped, hierarchical position rollups for a list of one or more dimensions.
    private List<GroupedPosition> getPositions(List<String> dims, List<Position> positions = rawPositions, String id = "root") {
        List<String> dimsCopy = dims.collect()  // Avoid mutating our input array.

        String dim = dimsCopy.first()
        Map byDimVal = positions.groupBy { it[dim] }
        List<GroupedPosition> ret = []

        byDimVal.each { dimVal, members ->
            GroupedPosition groupPos = new GroupedPosition([
                    // Generate a drilldown ID that encodes the path to this row.
                    id    : id + ">>${dim}:${dimVal}",
                    name  : dimVal,
                    pnl   : members.sum { it.pnl },
                    mktVal: members.sum { it.mktVal }
            ])

            // Recurse to create children for this node if additional dimensions remain.
            if (dimsCopy.size()) {
                groupPos.setChildren(getPositions(dimsCopy, members, groupPos.id))
            }

            ret << groupPos
        }

        return ret
    }

    // Parse a drilldown ID from a rolled-up position into a map of all
    // dimensions -> dim values contained within the rollup.
    private Map parsePositionId(String id) {
        List<String> dims = id.split(">>").drop(1)
        Map posMap = [:]

        dims.each { dimStr ->
            List<String> dimParts = dimStr.split(":")
            posMap[dimParts[0]] = dimParts[1]
        }

        return posMap
    }

    private List<MarketPrice> getMktData(String symbol) {
        return instData[symbol].mktData
    }

    private String getSector(String symbol) {
        return instData[symbol].sector
    }

    void clearCaches() {
        super.clearCaches()

    }
}
