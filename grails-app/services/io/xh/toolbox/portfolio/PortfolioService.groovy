package io.xh.toolbox.portfolio

import io.xh.hoist.BaseService

import java.time.*
import java.util.concurrent.ConcurrentHashMap

import static io.xh.toolbox.portfolio.Utils.*
import static java.time.DayOfWeek.SATURDAY
import static java.time.DayOfWeek.SUNDAY
import static io.xh.hoist.util.DateTimeUtils.MINUTES

class PortfolioService extends BaseService {

    private final int INSTRUMENT_COUNT = 500
    private final int ORDERS_COUNT = 20000

    private final List SECTORS = ['Financials', 'Healthcare', 'Real Estate', 'Technology', 'Consumer Products', 'Manufacturing', 'Energy', 'Other', 'Utilities']
    private final List REGIONS = ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac']

    private final List MODELS = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul']
    private final List FUNDS = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay']
    private final List TRADERS = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn', 'Robert Greer', 'HedgeSys', 'Susan Major']

    private PortfolioDataSet data

    def configService

    void init() {
        // data = generateData()
        createTimer(
                runFn: this.&loadData,
                interval: 'newsRefreshMins',
                intervalUnits: MINUTES
        )
        super.init()
    }

    PortfolioDataSet getData() {
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
    private void loadData() {
        if (!data) {
            data = generateData()
        } else {
            changeData()
        }

    }

    private PortfolioDataSet generateData() {
        def instruments = generateInstruments(),
            marketPrices = generatePrices(instruments),
            orders = generateOrders(instruments, marketPrices),
            rawPositions = calculateRawPositions(instruments, marketPrices, orders)

        return new PortfolioDataSet(
                instruments: instruments,
                marketPrices: marketPrices,
                orders: orders,
                rawPositions: rawPositions
        )
    }

    private void changeData() {
        Long numToChange = (15 * data.instruments.size() / 100).round() as Long
        Set<Instrument> changed = new HashSet<Instrument>()
        while (changed.size() < numToChange) {
            Instrument instToChange = sample(data.instruments)
            if (changed.contains(instToChange)) continue
            else {
                changed.add(instToChange)
                String symbol = instToChange.symbol
                List<MarketPrice> pricesForSymbol = data.marketPrices[symbol]
                MarketPrice lastMktPrice = pricesForSymbol.last()
                double oldClose = lastMktPrice.close
                double newClose = preturbPrice(oldClose)

                lastMktPrice.setClose(newClose)
                if (newClose < lastMktPrice.low) lastMktPrice.setLow(newClose)
                if (newClose > lastMktPrice.high) lastMktPrice.setHigh(newClose)


            }
        }
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

    private Map<String, List<MarketPrice>> generatePrices(Map<String, Instrument> instruments) {
        Map<String, List<MarketPrice>> ret = new ConcurrentHashMap(INSTRUMENT_COUNT)
        List<LocalDate> tradingDays = generateTradingDays()
        instruments.keySet().each {
            ret[it] = generateTimeSeries(tradingDays)
        }
        return ret
    }

    private List<MarketPrice> generateTimeSeries(List<LocalDate> tradingDays) {
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
            double close = (Math.random() * (high - low)) + low

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

    private List<LocalDate> generateTradingDays() {
        LocalDate today = LocalDate.now()
        LocalDate tradingDay = LocalDate.of(today.getYear() - 1, 1, 1)

        List<LocalDate> ret = []

        while (tradingDay <= today) {
            DayOfWeek dow = tradingDay.getDayOfWeek()
            if (dow != SATURDAY && dow != SUNDAY) ret << tradingDay
            tradingDay = tradingDay.plusDays(1)
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
    private List<Order> generateOrders(Map<String, Instrument> instruments, Map<String, List<MarketPrice>> marketPrices) {
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
            MarketPrice mktData = sample(marketPrices[symbol])
            Instant time = mktData.day.atTime(LocalTime.of(hour, min)).toInstant(ZoneOffset.ofHours(-5))
            long quantity = randInt(300, 10001) * (dir == 'Sell' ? -1 : 1)
            double price = randDouble(mktData.low, mktData.high).round(2)
            long mktVal = (quantity * price).round()

            ret << new Order(
                    id: "order-${i}",
                    instrument: instruments[symbol],
                    dir: dir,
                    quantity: quantity,
                    price: price,
                    mktVal: mktVal,
                    time: time,
                    model: model,
                    fund: fund,
                    trader: trader,
                    commission: Math.abs(mktVal * 0.0002),
                    confidence: randInt(0, 1001)
            )
        }

        return ret.sort { it.time }
    }

    // Calculate lowest-level leaf positions with P&L.
    private List<RawPosition> calculateRawPositions(
            Map<String, Instrument> instruments,
            Map<String, List<MarketPrice>> marketPrices,
            List<Order> orders
    ) {
        Map<String, List<Order>> byKey = orders.groupBy { it.key }

        return byKey.collect { key, ordersForKey ->
            Order first = ordersForKey.first()
            String symbol = first.symbol
            double endPx = marketPrices[symbol].last().close

            long endQty = ordersForKey.sum { it.quantity } as long
            long netCashflow = ordersForKey.sum { -it.mktVal } as long

            // Crude P&L calc.
            long mktVal = (endQty * endPx).round()
            long pnl = netCashflow + mktVal

            new RawPosition(
                    instrument: instruments[symbol],
                    model: first.model,
                    fund: first.fund,
                    trader: first.trader,
                    mktVal: mktVal,
                    pnl: pnl
            )
        }
    }

    void clearCaches() {
        this.data = generateData()
        super.clearCaches()
    }
}
