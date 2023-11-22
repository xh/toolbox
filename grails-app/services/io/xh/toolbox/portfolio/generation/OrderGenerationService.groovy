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

class OrderGenerationService extends BaseService {

    def configService

    List<Order> generateOrders(
            Map<String, Instrument> instruments,
            Map<String, List<MarketPrice>> historicalPrices
    ) {
        def orderCount = config.orderCount
        List<Order> ret = new ArrayList<Order>(orderCount)
        List<String> symbols = instruments.keySet() as List<String>
        orderCount.times { i ->

            // Get random attributes
            def symbol = sample(symbols),
                fund = sample(FUNDS),
                model = sample(MODELS),
                trader = sample(TRADERS),
                dir = sample(['Sell', 'Buy']),
                hour = randInt(9, 16),
                min = randInt(0, 59)

            // Calc 2nd order, partially random attributes
            MarketPrice mktData = sample(historicalPrices[symbol])
            Instant time = mktData.day.atTime(LocalTime.of(hour, min)).toInstant(ZoneOffset.ofHours(-5))
            Long quantity = randInt(300, 10001) * (dir == 'Sell' ? -1 : 1)
            Double price = randDouble(mktData.low, mktData.high).round(2)
            Long cost = (quantity * price).round()

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

    private Map getConfig() {
        configService.getMap('portfolioConfigs')
    }

    Map getAdminStats() {[
        config: configForAdminStats('portfolioConfigs')
    ]}
}
