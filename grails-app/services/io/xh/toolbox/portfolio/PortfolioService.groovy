package io.xh.toolbox.portfolio

import com.hazelcast.replicatedmap.ReplicatedMap
import io.xh.hoist.BaseService
import io.xh.hoist.cache.CachedValue
import io.xh.hoist.exception.DataNotAvailableException

import java.time.*

import static io.xh.toolbox.portfolio.Utils.*
import static io.xh.hoist.util.DateTimeUtils.SECONDS

class PortfolioService extends BaseService {

    def configService,
        orderGenerationService,
        historicalPriceGenerationService,
        instrumentGenerationService

    private CachedValue<Portfolio> _portfolio = new CachedValue(name: 'portfolio', svc: this)
    private ReplicatedMap<String, MarketPrice> _currentPrices = getReplicatedMap('currentPrices')

    void init() {
        createTimer(
            primaryOnly: true,
            runFn: this.&updateData,
            interval: {config.updateIntervalSecs * SECONDS},
            runImmediatelyAndBlock: true
        )
        _portfolio.ensureAvailable()
    }

    Portfolio getPortfolio() {
        def data = _portfolio.get()
        if (!data) throw new DataNotAvailableException()
        return data
    }

    Map<String, MarketPrice> getCurrentPrices() {
        _currentPrices
    }

    Map<LocalDate, Double> getClosingPriceHistory(List<String> symbols, int daysBack) {
        def startDate = LocalDate.now().minusDays(daysBack),
            historicalPrices = portfolio.historicalPrices

        return symbols
            .collectEntries { [it, historicalPrices.get(it)] }
            .collectEntries { k, v -> [k, v.findAll { it.day >= startDate }] }
            .collectEntries { k, v -> [k, v.collect { [it.day, it.close] }] }
    }

    //----------------
    // Implementation
    //-----------------
    private void updateData(boolean force = false) {
        // 1) Populate/update main data, if needed, to initialize or roll day
        def portfolio = _portfolio.get(),
            today = LocalDate.now()
        if (portfolio?.day != today || force) {
            def newData = generatePortfolio()
            def newPrices = newData.historicalPrices.collectEntries { symbol, prices -> [symbol, prices.last()]}
            _portfolio.set(newData)
            _currentPrices.clear();
            _currentPrices.putAll(newPrices)
            return
        }


        // 2) ...Otherwise, this is just a pricing perturbation to be applied.
        // TODO: skip this if no clients are actually listening to save on simulation costs?
        def pctInstruments = config.updatePctInstruments,
            pctPriceRange = config.updatePctPriceRange

        Long numToChange = Math.round((pctInstruments * currentPrices.size() / 100))

        Map<String, MarketPrice> newPrices = [:]
        def symbols = currentPrices.keySet() as List<String>
        while (newPrices.size() < numToChange) {
            def symbol = sample(symbols)
            if (!newPrices[symbol]) {
                newPrices[symbol] = currentPrices[symbol].perturb(pctPriceRange)
            }
        }
        currentPrices.putAll(newPrices)

    }

    private Portfolio generatePortfolio() {
        def day = LocalDate.now(),
            instruments = instrumentGenerationService.generateInstruments(),
            historicalPrices = historicalPriceGenerationService.generateHistoricalPrices(instruments, day),
            orders = orderGenerationService.generateOrders(instruments, historicalPrices),
            rawPositions = calculateRawPositions(instruments, orders)

        return new Portfolio(
            day: day,
            instruments: instruments,
            historicalPrices: historicalPrices,
            orders: orders,
            rawPositions: rawPositions
        )
    }

    private List<RawPosition> calculateRawPositions(Map<String, Instrument> instruments, List<Order> orders) {
        Map<String, List<Order>> byKey = orders.groupBy { it.key }

        return byKey.collect { key, ordersForKey ->
            Order first = ordersForKey.first()
            String symbol = first.symbol
            long endQty = ordersForKey.sum { it.quantity } as long
            long cost = ordersForKey.sum { it.cost } as long

            return new RawPosition(
                    instrument: instruments[symbol],
                    model: first.model,
                    fund: first.fund,
                    trader: first.trader,
                    cost: cost,
                    endQty: endQty
            )
        }
    }

    private Map getConfig() {
        configService.getMap('portfolioConfigs')
    }

    void clearCaches() {
        if (isPrimary) {
            updateData(true)
        }
        super.clearCaches()
    }

    Map getAdminStats() {[
        config: configForAdminStats('portfolioConfigs')
    ]}
}
