package io.xh.toolbox.portfolio.generation

import io.xh.hoist.BaseService
import io.xh.toolbox.portfolio.Instrument
import io.xh.toolbox.portfolio.MarketPrice
import io.xh.toolbox.portfolio.Order

import java.time.Instant
import java.time.LocalTime
import java.time.ZoneOffset

import static io.xh.toolbox.portfolio.Utils.randDouble
import static io.xh.toolbox.portfolio.Utils.randInt
import static io.xh.toolbox.portfolio.Utils.sample
import static io.xh.toolbox.portfolio.Lookups.*

/**
 * Generates a randomized set of mock {@link Order} objects distributed across the provided
 * instruments and their historical price data. Orders are assigned random funds, models,
 * traders, and execution times, then sorted chronologically. The number of orders is
 * controlled by the {@code portfolioConfigs.orderCount} config.
 */
class OrderGenerationService extends BaseService {

    def configService

    private static final ZoneOffset EST = ZoneOffset.ofHours(-5)
    private static final List<String> DIRS = ['Sell', 'Buy']

    /** Generate a chronologically sorted list of orders across the given instruments. */
    List<Order> generateOrders(
            Map<String, Instrument> instruments,
            Map<String, List<MarketPrice>> historicalPrices
    ) {
        withSpan(
            name: 'generateOrders',
            logDebug: "Generating ${config.orderCount} orders"
        ) {
            def orderCount = config.orderCount
            List<Order> ret = new ArrayList<Order>(orderCount)
            List<String> symbols = instruments.keySet() as List<String>

            for (int i = 0; i < orderCount; i++) {
                def symbol = sample(symbols),
                    fund = sample(FUNDS),
                    model = sample(MODELS),
                    trader = sample(TRADERS),
                    dir = sample(DIRS)

                MarketPrice mktData = sample(historicalPrices[symbol])
                Instant time = mktData.day.atTime(LocalTime.of(randInt(9, 16), randInt(0, 59))).toInstant(EST)
                long quantity = randInt(300, 10001) * (dir == 'Sell' ? -1 : 1)
                double price = randDouble(mktData.low, mktData.high).round(2)
                long cost = Math.round(quantity * price)

                ret << new Order(
                        id: "order-${i}",
                        instrument: instruments[symbol],
                        dir: dir,
                        quantity: quantity,
                        price: price,
                        cost: cost,
                        time: time,
                        model: model,
                        fund: fund,
                        trader: trader,
                        commission: Math.abs(cost * 0.0002),
                        confidence: randInt(0, 1001)
                )
            }

            return ret.sort { it.time }
        }
    }

    private Map getConfig() {
        configService.getMap('portfolioConfigs')
    }

    Map getAdminStats() {[
        config: configForAdminStats('portfolioConfigs')
    ]}

}
