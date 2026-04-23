package io.xh.toolbox.portfolio

import com.hazelcast.replicatedmap.ReplicatedMap
import io.micrometer.core.instrument.Gauge
import io.micrometer.core.instrument.Timer
import io.xh.hoist.BaseService
import io.xh.hoist.cachedvalue.CachedValue
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.telemetry.metric.MetricsService

import java.time.*

import static io.xh.toolbox.portfolio.Utils.*
import static io.xh.hoist.util.DateTimeUtils.SECONDS
import static java.util.concurrent.TimeUnit.MILLISECONDS


/**
 * Central service for the Portfolio example app's simulated trading data. Generates and caches
 * a complete {@link Portfolio} of randomized instruments, historical prices, orders, and
 * positions, then applies periodic price perturbations on a timer to simulate live market
 * activity.
 *
 * Portfolio data is generated asynchronously after app startup and regenerated daily. Current
 * prices are stored in a replicated map for low-latency access across cluster instances.
 */
class PortfolioService extends BaseService {

    def configService,
        orderGenerationService,
        historicalPriceGenerationService,
        instrumentGenerationService

    MetricsService metricsService

    private CachedValue<Portfolio> _portfolio = createCachedValue(name: 'portfolio', replicate: true)
    private ReplicatedMap<String, MarketPrice> _currentPrices = createReplicatedMap('currentPrices')
    private Timer generationTimer
    private Gauge positionsGauge

    void init() {
        initMetrics()
        createTimer(
            name: 'updateData',
            runFn: this.&updateData,
            primaryOnly: true,
            interval: {config.updateIntervalSecs * SECONDS}
        )
    }

    /** True if portfolio data has been generated and is ready for use. */
    boolean isPortfolioAvailable() {
        _portfolio.get() != null
    }

    Portfolio getPortfolio() {
        def data = _portfolio.get()
        if (!data) throw new DataNotAvailableException()
        return data
    }

    /** Latest simulated market prices, keyed by instrument symbol. */
    Map<String, MarketPrice> getCurrentPrices() {
        _currentPrices
    }

    /** Closing price history for the given symbols, looking back the specified number of days. */
    Map<LocalDate, Double> getClosingPriceHistory(List<String> symbols, int daysBack) {
        def startDate = LocalDate.now().minusDays(daysBack),
            historicalPrices = portfolio.historicalPrices

        return symbols
            .collectEntries { [it, historicalPrices.get(it)] }
            .collectEntries { k, v -> [k, v.findAll { it.day >= startDate }] }
            .collectEntries { k, v -> [k, v.collect { [it.day, it.close] }] }
    }

    //------------------------
    // Implementation
    //------------------------
    private void initMetrics() {
        def registry = metricsService.registry

        positionsGauge = Gauge.builder('toolbox.portfolio.positions', this) {
            (_portfolio.get()?.rawPositions?.size() ?: 0) as double
        }.description('Number of portfolio positions')
            .register(registry)

        generationTimer = Timer.builder('toolbox.portfolio.generationTime')
            .description('Time to generate portfolio')
            .register(registry)
    }

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
        observe()
            .span(name: 'generatePortfolio')
            .logInfo('Generating Portfolio')
            .timer(generationTimer)
            .run {
                def day = LocalDate.now(),
                    instruments = instrumentGenerationService.generateInstruments(),
                    historicalPrices = historicalPriceGenerationService.generateHistoricalPrices(instruments, day),
                    orders = orderGenerationService.generateOrders(instruments, historicalPrices),
                    rawPositions = calculateRawPositions(instruments, orders)

                new Portfolio(
                    day: day,
                    instruments: instruments,
                    historicalPrices: historicalPrices,
                    orders: orders,
                    rawPositions: rawPositions
                )
        }
    }

    private List<RawPosition> calculateRawPositions(Map<String, Instrument> instruments, List<Order> orders) {
        withDebug("Calculating raw positions from ${orders.size()} orders") {
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

    Map getAdminStats() {
        def p = _portfolio.get()
        return [
            config: configForAdminStats('portfolioConfigs'),
            avgGenerationTime: generationTimer.mean(MILLISECONDS),

            portfolioAvailable: portfolioAvailable,
            day: p?.day,
            generatedAt: p?.timeCreated,
            instruments: p?.instruments?.size() ?: 0,
            orders: p?.orders?.size() ?: 0,
            rawPositions: p?.rawPositions?.size() ?: 0,
            currentPrices: _currentPrices.size()
        ]
    }
}
