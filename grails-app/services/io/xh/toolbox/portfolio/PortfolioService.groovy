package io.xh.toolbox.portfolio

import io.xh.hoist.BaseService

import java.time.Instant
import java.time.LocalTime
import java.time.ZoneOffset

import static io.xh.toolbox.portfolio.Utils.*

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

    List<Position> getPortfolio(List<String> dims) {
        List<Position> positions = getPositions(dims)

        return [
                new Position(
                        id: 'summary',
                        name: 'Total',
                        pnl: (positions.sum { it.pnl }) as long,
                        mktVal: (positions.sum { it.mktVal }) as long,
                        children: positions
                )
        ]
    }

    List<RawPosition> getRawPositions() {
        return rawPositions
    }

    Position getPosition(String positionId) {

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


    List<Order> getOrders(String positionId) {
        if (!positionId)
            return []
        else {
            Map<String, String> parsedId = parsePositionId(positionId)
            List<String> dims = parsedId.keySet() as List<String>

            return orders.findAll { order ->
                dims.every { dim ->
                    parsedId[dim] == order."$dim"
                }
            }
        }
    }

    List<Order> getAllOrders() {
        return orders
    }


    //------------------------
    // Implementation
    //------------------------
    private List<Order> generateOrders() {
        List<Order> ret = new ArrayList<Order>(ORDERS_COUNT)
        List<String> symbols = marketService.getAllSymbols() as List<String>
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
            Instant time = mktData.day.atTime(LocalTime.of(hour, min)).toInstant(ZoneOffset.ofHours(-5))
            long quantity = randInt(300, 10000) * (dir == 'Sell' ? -1 : 1)
            double price = randDouble(mktData.low, mktData.high).round(2)
            long mktVal = (quantity * price).round()

            ret << new Order(
                    id: "order-${i}",
                    instrument: marketService.getInstrument(symbol),
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

        return bySymbol.collect { symbol, ordersForSymbol ->
            Order first = ordersForSymbol.first()
            double endPx = marketService.getMarketData(symbol).last().close

            long endQty = ordersForSymbol.sum { it.quantity } as long
            long netCashflow = ordersForSymbol.sum { -it.mktVal } as long

            // Crude P&L calc.
            long mktVal = (endQty * endPx).round()
            long pnl = netCashflow + mktVal

            new RawPosition(
                    instrument: marketService.getInstrument(symbol),
                    model : first.model,
                    fund  : first.fund,
                    trader: first.trader,
                    mktVal: mktVal,
                    pnl   : pnl
            )
        }
    }

    // Generate grouped, hierarchical position roll-ups for a list of one or more dimensions.
    private List<Position> getPositions(List<String> dims, List<RawPosition> positions = rawPositions, String id = 'root') {

        String dim = dims.first()
        Map<String, List<RawPosition>> byDimVal = positions.groupBy { it."$dim" }

        List<String> childDims = dims.tail()
        return byDimVal.collect { dimVal, members ->

            String posId = id + ">>${dim}:${dimVal}"

            // Recurse to create children for this node if additional dimensions remain.
            // Use these children to calc metrics, bottom up, if possible.
            List<Position> children = childDims ? getPositions(childDims, members, posId) : null
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

    void clearCaches() {
        super.clearCaches()

    }
}
