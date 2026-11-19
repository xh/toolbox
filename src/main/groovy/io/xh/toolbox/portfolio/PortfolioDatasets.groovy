package io.xh.toolbox.portfolio

import java.time.Instant
import java.time.LocalDate

import static io.xh.toolbox.portfolio.InstrumentType.Bond
import static io.xh.toolbox.portfolio.InstrumentType.Option

/**
 * Rows for the portfolio Data Catalog's datasets, computed from one consistent view of a
 * {@link Portfolio}, its current prices and the time. Row keys are the catalog's field names.
 *
 * A date resolves to the last trading day on or before it. The last trading day is the live
 * day: it prices from the current prices and holds only orders whose time has passed.
 */
class PortfolioDatasets {

    static final int VOL_WINDOW = 60

    final Portfolio portfolio
    final Map<String, MarketPrice> currentPrices
    final Instant now

    private final Map<LocalDate, Integer> dayIndex
    private final Map<String, Double> volCache = [:]

    PortfolioDatasets(Portfolio portfolio, Map<String, MarketPrice> currentPrices, Instant now) {
        this.portfolio = portfolio
        this.currentPrices = new HashMap(currentPrices)
        this.now = now
        dayIndex = portfolio.tradingDays.withIndex().collectEntries { day, idx -> [day, idx] }
    }

    LocalDate getLiveDay() {
        portfolio.tradingDays.last()
    }

    /** The last trading day on or before the given date, or null if before all history. */
    LocalDate resolveDay(LocalDate date) {
        List<LocalDate> days = portfolio.tradingDays
        int idx = Collections.binarySearch(days, date)
        if (idx < 0) idx = -idx - 2
        return idx >= 0 ? days[idx] : null
    }

    boolean isLivePositions(LocalDate asOf) {
        resolveDay(asOf) == liveDay
    }

    boolean isLiveOrders(LocalDate asOf) {
        asOf == liveDay
    }

    /** Close on a trading day, or the current price on the live day. Null for a null day. */
    Double priceOn(String symbol, LocalDate day) {
        if (day == null) return null
        if (day == liveDay && currentPrices[symbol]) return currentPrices[symbol].close
        Integer idx = dayIndex[day]
        return idx != null ? portfolio.historicalPrices[symbol]?.getAt(idx)?.close : null
    }

    //------------------------
    // Datasets
    //------------------------
    /** One row per position held at the close of asOf, optionally for one fund. */
    List<Map> positions(LocalDate asOf, String fund = null) {
        LocalDate day = resolveDay(asOf)
        if (!day) return []

        LocalDate prevDay = resolveDay(day.minusDays(1)),
            mtdBase = resolveDay(day.withDayOfMonth(1).minusDays(1)),
            ytdBase = resolveDay(day.withDayOfYear(1).minusDays(1))

        Map<String, Holding> holdings = [:]
        for (Order o : liveOrders(day)) {
            if (o.day > day) break
            if (fund && o.fund != fund) continue

            String key = [o.fund, o.strategy, o.book, o.trader, o.model, o.symbol].join('|')
            Holding h = holdings[key]
            if (!h) h = holdings[key] = new Holding(id: key, order: o)
            h.add(Holding.END, o)
            if (prevDay && o.day <= prevDay) h.add(Holding.PREV, o)
            if (mtdBase && o.day <= mtdBase) h.add(Holding.MTD, o)
            if (ytdBase && o.day <= ytdBase) h.add(Holding.YTD, o)
        }

        List<Map> rows = holdings.values().collect { positionRow(it, day, [prevDay, mtdBase, ytdBase]) }
        addPctNav(rows)
        return rows
    }

    /** One row per order on asOf, optionally for one fund. */
    List<Map> orders(LocalDate asOf, String fund = null) {
        liveOrders(asOf)
            .findAll { it.day == asOf && (!fund || it.fund == fund) }
            .collect { orderRow(it) }
    }

    //------------------------
    // Parameterized fields
    //------------------------
    /** Price return over [start, end], signed by the row's direction. */
    Double returnFor(Map row, LocalDate start, LocalDate end) {
        Double pxStart = priceOn(row.symbol as String, resolveDay(start)),
            pxEnd = priceOn(row.symbol as String, resolveDay(end))
        if (!pxStart || pxEnd == null) return null
        double sign = (row.quantity ?: 0) < 0 ? -1 : 1
        return sign * (pxEnd / pxStart - 1)
    }

    /** P&L if equities move by shock: beta-adjusted, plus convexity on options. */
    Long shockedPnlFor(Map row, double shock) {
        if (row.instrumentType == Option.name()) {
            double delta = row.delta as double,
                gamma = row.gamma as double
            return Math.round(delta * shock + 0.5 * gamma * (shock / 0.01) * shock)
        }
        return Math.round((row.betaAdjExposure as double) * shock)
    }

    //------------------------
    // Implementation
    //------------------------
    // Orders through the live day's current time, in time order.
    private List<Order> liveOrders(LocalDate day) {
        List<Order> orders = portfolio.orders
        if (day != liveDay) return orders
        return orders.findAll { it.time <= now }
    }

    private Map positionRow(Holding h, LocalDate day, List<LocalDate> baseDays) {
        Instrument inst = h.order.instrument
        String symbol = inst.symbol
        int mult = inst.multiplier
        double px = priceOn(symbol, day) ?: 0d,
            qty = h.qty[Holding.END]

        long mktVal = Math.round(qty * px * mult)
        long pnl = mktVal - h.cost[Holding.END]
        List<Long> basePnls = (0..2).collect { int i ->
            Double basePx = priceOn(symbol, baseDays[i])
            basePx == null ? 0L : Math.round(h.qty[i + 1] * basePx * mult) - h.cost[i + 1]
        }

        Long delta = null, gamma = null, vega = null, theta = null
        double netExposure = mktVal,
            notional = Math.abs(mktVal)
        String volSymbol = symbol

        if (inst.type == Option) {
            double undNotional = qty * mult * (priceOn(inst.underlying, day) ?: 0d)
            delta = Math.round(undNotional * inst.deltaRatio)
            gamma = Math.round(undNotional * inst.gammaRatio * 0.01)
            vega = Math.round(undNotional * inst.vegaRatio)
            theta = -Math.round(undNotional * inst.thetaRatio)
            netExposure = delta
            notional = Math.abs(undNotional)
            volSymbol = inst.underlying
        }

        boolean isBond = inst.type == Bond
        double dailyVol = vol(volSymbol, day)

        return [
            id             : h.id,
            fund           : h.order.fund,
            strategy       : h.order.strategy,
            book           : h.order.book,
            trader         : h.order.trader,
            model          : h.order.model,
            *              : instrumentFields(inst),
            quantity       : qty as long,
            price          : px,
            mktVal         : mktVal,
            notional       : Math.round(notional),
            grossExposure  : Math.round(Math.abs(netExposure)),
            netExposure    : Math.round(netExposure),
            betaAdjExposure: Math.round(netExposure * inst.beta),
            pnlDay         : pnl - basePnls[0],
            pnlMtd         : pnl - basePnls[1],
            pnlYtd         : pnl - basePnls[2],
            delta          : delta,
            gamma          : gamma,
            vega           : vega,
            theta          : theta,
            duration       : isBond ? inst.duration : null,
            dv01           : isBond ? Math.round(mktVal * inst.duration * 0.0001) : null,
            yield          : isBond && px ? (inst.coupon * 100 / px).round(5) : null,
            beta           : inst.beta,
            var95          : Math.round(Math.abs(netExposure) * dailyVol * 1.645),
            var99          : Math.round(Math.abs(netExposure) * dailyVol * 2.326)
        ]
    }

    private Map orderRow(Order o) {
        Instrument inst = o.instrument
        return [
            id        : o.id,
            orderId   : o.id,
            fund      : o.fund,
            strategy  : o.strategy,
            book      : o.book,
            trader    : o.trader,
            model     : o.model,
            *         : instrumentFields(inst),
            dir       : o.dir,
            quantity  : o.quantity,
            price     : o.price,
            mktVal    : o.mktVal,
            commission: o.commission,
            confidence: o.confidence,
            time      : o.time.toEpochMilli()
        ]
    }

    private static Map instrumentFields(Instrument inst) {
        [
            assetClass    : inst.assetClass,
            instrumentType: inst.instrumentType,
            sector        : inst.sector,
            industry      : inst.industry,
            region        : inst.region,
            country       : inst.country,
            ccy           : inst.ccy,
            symbol        : inst.symbol,
            issuer        : inst.issuer,
            underlying    : inst.underlying,
            isin          : inst.isin,
            cusip         : inst.cusip
        ]
    }

    // Weight in the fund, against a NAV of half the fund's gross market value.
    private static void addPctNav(List<Map> rows) {
        Map<String, Double> navs = rows
            .groupBy { it.fund }
            .collectEntries { fund, fundRows -> [fund, fundRows.sum { Math.abs(it.mktVal as long) } / 2d] }
        rows.each { row ->
            double nav = navs[row.fund]
            row.pctNav = nav ? (row.mktVal as long) / nav : null
        }
    }

    // Standard deviation of daily log returns over the trailing window ending on day.
    private double vol(String symbol, LocalDate day) {
        volCache.computeIfAbsent("$symbol|$day".toString()) {
            List<MarketPrice> series = portfolio.historicalPrices[symbol]
            int end = dayIndex[day], start = Math.max(1, end - VOL_WINDOW + 1)
            if (!series || end < 2) return 0.02d
            List<Double> rets = (start..end).collect { Math.log(series[it].close / series[it - 1].close) }
            double mean = rets.sum() / rets.size()
            return Math.sqrt(rets.sum { (it - mean) ** 2 } / (rets.size() - 1))
        }
    }

    private static class Holding {
        static final int END = 0, PREV = 1, MTD = 2, YTD = 3

        String id
        Order order
        long[] qty = new long[4]
        long[] cost = new long[4]

        void add(int bucket, Order o) {
            qty[bucket] += o.quantity
            cost[bucket] += o.cost
        }
    }
}
