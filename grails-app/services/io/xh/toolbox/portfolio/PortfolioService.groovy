package io.xh.toolbox.portfolio

import groovy.util.logging.Slf4j
import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache

import java.time.*

import static io.xh.toolbox.portfolio.Utils.*
import static io.xh.hoist.util.DateTimeUtils.SECONDS
import static io.xh.hoist.util.DateTimeUtils.DAYS
import static java.util.Collections.EMPTY_MAP

@Slf4j
class PortfolioService extends BaseService {


    private Cache<LocalDate, PortfolioDataSet> dataSets = new Cache(svc: this, expireTime: 1 * DAYS )

    def configService,
        tradingDayService,
        orderGenerationService,
        historicalPriceGenerationService,
        instrumentGenerationService

    void init() {
        this.getData()
        createTimer(
                runFn: this.&generateIntradayPrices,
                interval: {config.updateIntervalSecs},
                intervalUnits: SECONDS,
                delay: true
        )
        super.init()
    }

    PortfolioDataSet getData() {
        LocalDate currentDay = tradingDayService.currentDay()
        dataSets.getOrCreate(currentDay) {
            generateData(currentDay)
        }
    }

    //----------------
    // Implementation
    //-----------------
    private PortfolioDataSet generateData(LocalDate day) {
        def instruments = instrumentGenerationService.generateInstruments(),
            historicalPrices = historicalPriceGenerationService.generateHistoricalPrices(instruments, day),
            orders = orderGenerationService.generateOrders(instruments, historicalPrices),
            rawPositions = calculateRawPositions(instruments, historicalPrices, orders)

        return new PortfolioDataSet(
                day: day,
                instruments: instruments,
                historicalPrices: historicalPrices,
                intradayPrices: EMPTY_MAP,
                orders: orders,
                rawPositions: rawPositions
        )
    }

    private void generateIntradayPrices() {
        // Get current day portfolio from cache.  If it exists, perturb it, and put it back in the cache
        def data = dataSets.get(tradingDayService.currentDay())
        if (data) {
            withDebug("Perturbing prices for ${data.day}") {
                data = perturbIntradayPrices(data)
                dataSets.put(data.day, data)
            }
        }
    }

    private List<RawPosition> calculateRawPositions(
            Map<String, Instrument> instruments,
            Map<String, List<MarketPrice>> historicalPrices,
            List<Order> orders
    ) {
        Map<String, List<Order>> byKey = orders.groupBy { it.key }

        return byKey.collect { key, ordersForKey ->
            Order first = ordersForKey.first()
            String symbol = first.symbol
            double endPx = historicalPrices[symbol].last().close

            long endQty = ordersForKey.sum { it.quantity } as long
            long cost = ordersForKey.sum { it.cost } as long

            return new RawPosition(
                    instrument: instruments[symbol],
                    model: first.model,
                    fund: first.fund,
                    trader: first.trader,
                    cost: cost,
                    endQty: endQty,
                    endPx: endPx
            )
        }
    }

    private PortfolioDataSet perturbIntradayPrices(PortfolioDataSet oldData) {
        def pctInstruments = config.updatePctInstruments,
            pctPriceRange = config.updatePctPriceRange

        Long numToChange = Math.round((pctInstruments * oldData.instruments.size() / 100))

        Map<String, MarketPrice> newPrices = [:]
        def allInstruments = oldData.instruments.values() as List<Instrument>
        while (newPrices.size() < numToChange) {
            def instrument = sample(allInstruments),
                symbol = instrument.symbol

            if (!newPrices[symbol]) {
                def oldPrice = oldData.intradayPrices[symbol] ?: oldData.historicalPrices[symbol].last()
                newPrices[symbol] = oldPrice.perturb(pctPriceRange)
            }
        }

        Map<String, MarketPrice> newIntradayPrices = new HashMap(oldData.intradayPrices)
        newIntradayPrices.putAll(newPrices)

        List<RawPosition> newRawPositions = oldData.rawPositions.collect { pos ->
            def newPrice = newPrices[pos.instrument.symbol]
            return newPrice ? pos.repricePosition(newPrice.close) : pos
        }

        log.debug("Perturbed ${numToChange} instruments' pricing")

        return new PortfolioDataSet(
                day: oldData.day,
                instruments: oldData.instruments,
                historicalPrices: oldData.historicalPrices,
                orders: oldData.orders,
                intradayPrices: newIntradayPrices,
                rawPositions: newRawPositions
        )
    }


    private Map getConfig() {
        configService.getMap('portfolioConfigs')
    }

    void clearCaches() {
        dataSets.clear()
        super.clearCaches()
    }
}
