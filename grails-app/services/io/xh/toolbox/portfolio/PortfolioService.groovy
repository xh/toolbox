package io.xh.toolbox.portfolio

import groovy.util.logging.Slf4j
import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache

import java.time.*
import java.util.concurrent.ConcurrentHashMap

import static io.xh.toolbox.portfolio.Utils.*
import static java.time.DayOfWeek.SATURDAY
import static java.time.DayOfWeek.SUNDAY
import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static java.util.Collections.EMPTY_MAP

@Slf4j
class PortfolioService extends BaseService {

    private final int INSTRUMENT_COUNT = 5
    private final int ORDERS_COUNT = 200

    private final List SECTORS = ['Financials', 'Healthcare', 'Real Estate', 'Technology', 'Consumer Products', 'Manufacturing', 'Energy', 'Other', 'Utilities']
    private final List REGIONS = ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac']

    private final List MODELS = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul']
    private final List FUNDS = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay']
    private final List TRADERS = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn', 'Robert Greer', 'HedgeSys', 'Susan Major']


    private Cache<LocalDate, PortfolioDataSet> dataSets = new Cache(svc:this)

    void init() {
        createTimer(
                runFn: this.&generateIntradayPrices,
                interval: 1 * MINUTES
        )
        super.init()
    }

    PortfolioDataSet getData() {
        LocalDate today = LocalDate.now()
        def data = dataSets.getOrCreate(today) {
            generateData(today)
        }
        return data
    }

    Map getLookups() {
        [
                sectors: SECTORS,
                regions: REGIONS,
                models : MODELS,
                funds  : FUNDS,
                traders: TRADERS
        ]
    }

    //----------------
    // Implementation
    //-----------------
    void generateIntradayPrices() {
        // Get current day portfolio from cache.  If it exists, perturb it, and put it back in the cache
        try {
            log.info('Entering generateIntradayPrices')
            def today = LocalDate.now()
            def data = dataSets.get(today)
            if (data) {
                data = perturbIntradayPrices(data, today)
                dataSets.put(data.day, data)
            }
        } catch (Exception e) {
            log.error('Failed in generateIntradayPrices', e)
        }

    }


    private PortfolioDataSet generateData(LocalDate day) {
        def instruments = generateInstruments(),
            historicalPrices = generateHistoricalPrices(instruments, day),
            orders = generateOrders(instruments, historicalPrices),
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


    //-------------------
    // Markets Generation
    //-------------------
    private Map<String, Instrument> generateInstruments() {
        Map<String, Instrument> ret = new ConcurrentHashMap(INSTRUMENT_COUNT)
        while (ret.size() < INSTRUMENT_COUNT) {
            String symbol = generateSymbol()
            if (!ret[symbol]) {
                ret[symbol] = new Instrument(
                        symbol: symbol,
                        sector: sample(SECTORS),
                        region: sample(REGIONS)
                )
            }
        }
        return ret
    }

    private Map<String, List<MarketPrice>> generateHistoricalPrices(
            Map<String, Instrument> instruments,
            LocalDate day
    ) {
        List<LocalDate> tradingDays = generateHistoricalTradingDays(day)
        return instruments.keySet().collectEntries {
            [it, generatePriceSeries(tradingDays)]
        }
    }

    private List<MarketPrice> generatePriceSeries(List<LocalDate> tradingDays) {
        Set<Integer> spikeDayIdxs = []
        List<MarketPrice> ret = []

        // Give some random number of days a spike in trading volume to make that chart interesting.
        int nSpikes = randInt(0, 30)
        nSpikes.times {
            spikeDayIdxs += randInt(0, tradingDays.size())
        }

        // Set a seed price and generate a series from there.
        double startPx = randDouble(10, 100)
        tradingDays.eachWithIndex { tradingDay, idx ->
            boolean bigDown = Math.random() > 0.95  // Allow for a few bigger swings.
            boolean bigUp = Math.random() > 0.95
            double pctDown = randDouble(0, (bigDown ? 0.1 : 0.02))
            double pctUp = randDouble(0, (bigUp ? 0.1 : 0.025))  // We can rig the game here...
            double open = startPx
            double high = startPx + (pctUp * startPx)
            double low = startPx - (pctDown * startPx)
            double close = randDouble(low, high)

            int maxVol
            if (spikeDayIdxs.find { it == idx }) {
                maxVol = 200
            } else if (spikeDayIdxs.find { it == (idx - 1) } || spikeDayIdxs.find { it == (idx + 1) }) {
                maxVol = 150
            } else {
                maxVol = 100
            }

            ret << new MarketPrice(
                    day: tradingDay,
                    high: high.round(2),
                    low: low.round(2),
                    open: open.round(2),
                    close: close.round(2),
                    volume: randInt(80, maxVol) * 1000
            )
            startPx = close
        }

        return ret
    }

    private List<LocalDate> generateHistoricalTradingDays(LocalDate currDay) {
        List<LocalDate> ret = []

        LocalDate day = LocalDate.of(currDay.getYear() - 1, 1, 1)
        while (day <= currDay) {
            DayOfWeek dow = day.getDayOfWeek()
            if (dow != SATURDAY && dow != SUNDAY) ret << day
            day = day.plusDays(1)
        }

        return ret
    }

    private String generateSymbol() {
        def ret = '',
            n = randInt(1, 6),
            letters = ('A'..'Z') as List<Character>
        n.times {
            ret += sample(letters)
        }
        return ret
    }


    //------------------------
    // Portfolio Generation
    //------------------------
    private List<Order> generateOrders(Map<String, Instrument> instruments,
                                       Map<String, List<MarketPrice>> historicalPrices
    ) {
        List<Order> ret = new ArrayList<Order>(ORDERS_COUNT)
        List<String> symbols = instruments.keySet() as List<String>
        ORDERS_COUNT.times { i ->

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

    // Calculate lowest-level leaf positions with P&L.
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


    //-------------------------
    // Perturb intraday prices
    //------------------------
    private PortfolioDataSet perturbIntradayPrices(PortfolioDataSet oldData, LocalDate today) {
        def pctToChange = 100
        def perturbPctRange = 10

        Long numToChange = Math.round((pctToChange * oldData.instruments.size() / 100))

        Map<String, MarketPrice> newPrices = [:]
        def allInstruments = oldData.instruments.values() as List<Instrument>
        while (newPrices.size() < numToChange) {
            def instrument = sample(allInstruments),
                symbol = instrument.symbol

            if (!newPrices.containsKey(symbol)) {
                def oldPrice = oldData.intradayPrices[symbol] ?: oldData.historicalPrices[symbol].last()
                newPrices[symbol] = oldPrice.perturb(perturbPctRange)
            }
        }

        Map<String, MarketPrice> newIntradayPrices = new HashMap(oldData.intradayPrices)
        newIntradayPrices.putAll(newPrices)


        // Use the new current prices to update the raw positions' mktVal and pnl values,
        // according to the method used in generateTimeSeries.
        List<RawPosition> newRawPositions = oldData.rawPositions.collect { pos ->
            def newPrice = newPrices[pos.instrument.symbol]
            return newPrice ? pos.repricePosition(newPrice.close) : pos
        }

        return new PortfolioDataSet(
                day: today,
                instruments: oldData.instruments,
                historicalPrices: oldData.historicalPrices,
                intradayPrices: newIntradayPrices,
                orders: oldData.orders,
                rawPositions: newRawPositions
        )
    }


    void clearCaches() {
        dataSets.clear()
        super.clearCaches()
    }
}
