package io.xh.toolbox.portfolio

import groovy.transform.CompileStatic
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
    static final double Z95 = 1.645, Z99 = 2.326
    static final double FALLBACK_VOL = 0.02
    static final double HYPOTHETICAL_NOTIONAL = 100_000_000

    final Portfolio portfolio
    final Map<String, MarketPrice> currentPrices
    final Instant now

    private final Map<LocalDate, Integer> dayIndex
    private final Map<LocalDate, Map<String, double[]>> returnsCache = [:]
    // A group's P&L deviation, shared by its VaR at each confidence. Keyed by the group's row list.
    private final Map<List<Map>, Double> groupPnlStdev = new IdentityHashMap()

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

    boolean isLivePrices(LocalDate start, LocalDate end) {
        start <= liveDay && end >= liveDay
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

    /**
     * One row per holding of a hypothetical portfolio at the close of asOf, sized as weight times
     * {@link #HYPOTHETICAL_NOTIONAL}. Holdings are [symbol, weight] pairs of known symbols.
     */
    List<Map> hypotheticalPortfolio(List<List> holdings, LocalDate asOf) {
        LocalDate day = resolveDay(asOf)
        if (!day) return []

        return holdings.collect { String symbol, Number weight ->
            Instrument inst = portfolio.instruments[symbol]
            double mktVal = weight * HYPOTHETICAL_NOTIONAL,
                qty = mktVal / (priceOn(symbol, day) * inst.multiplier)
            Map row = [id: symbol, *: holdingFields(inst, qty, day)]
            row.mktVal = Math.round(mktVal)
            row.weight = weight.doubleValue()
            return row
        }
    }

    /** One row per trading day in [start, end] for a symbol, with the live day at current prices. */
    List<Map> prices(String symbol, LocalDate start, LocalDate end) {
        (portfolio.historicalPrices[symbol] ?: [])
            .findAll { it.day >= start && it.day <= end }
            .collect { MarketPrice hist ->
                MarketPrice p = hist.day == liveDay && currentPrices[symbol] ? currentPrices[symbol] : hist
                [
                    id    : "$symbol|${hist.day}".toString(),
                    symbol: symbol,
                    day   : hist.day.toString(),
                    open  : p.open,
                    high  : p.high,
                    low   : p.low,
                    close : p.close,
                    volume: p.volume
                ]
            }
    }

    /** Each fund with its AUM for the live day: the prior-close NAV that pctNav weighs positions against. */
    List<Map> funds() {
        Map<String, Double> navs = navsByFund(positions(liveDay))
        return Lookups.FUNDS.collect { [name: it, aum: Math.round(navs[it] ?: 0d)] }
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
    // Group values for measures that roll up on the server
    //------------------------
    /**
     * One-day VaR of a group of position rows: z times the standard deviation of the group's
     * daily P&L over the trailing window, from each row's net exposure and its returns. For a
     * single row this is the row's own VaR.
     */
    Long groupVar(List<Map> rows, LocalDate asOf, double z) {
        LocalDate day = resolveDay(asOf)
        if (!day || !rows) return null
        Double sd = groupPnlStdev.computeIfAbsent(rows) { pnlStdev(rows, day) }
        return Math.round(z * sd)
    }

    /** Return over [start, end] of a group: its P&L over the window per unit of gross value at the start. */
    Double groupReturn(List<Map> rows, LocalDate start, LocalDate end) {
        LocalDate startDay = resolveDay(start), endDay = resolveDay(end)
        double pnl = 0, gross = 0
        Map<String, List<Double>> pxs = [:]
        rows.each { row ->
            String symbol = row.symbol
            List<Double> px = pxs.computeIfAbsent(symbol) { [priceOn(symbol, startDay), priceOn(symbol, endDay)] }
            Double pxStart = px[0], pxEnd = px[1]
            if (!pxStart || pxEnd == null) return
            double units = (row.quantity as double) * portfolio.instruments[symbol].multiplier
            pnl += units * (pxEnd - pxStart)
            gross += Math.abs(units * pxStart)
        }
        return gross ? pnl / gross : null
    }

    /** Weight of a group against the combined NAV of the funds its rows belong to. */
    static Double groupPctNav(List<Map> rows, Map<String, Double> navs) {
        double nav = (rows*.fund.unique().sum { navs[it] ?: 0d } ?: 0d) as double
        return nav ? rows.sum(0L) { it.mktVal as long } / nav : null
    }

    /**
     * NAV of each fund in a set of position rows: half the fund's gross market value at the prior
     * close, so it holds through the day. A fund with no prior close has none.
     */
    static Map<String, Double> navsByFund(List<Map> rows) {
        rows
            .groupBy { it.fund }
            .collectEntries { fund, fundRows -> [fund, fundRows.sum { Math.abs(it.priorCloseMktVal as long) } / 2d] }
            .findAll { fund, nav -> nav }
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
        Map ret = [
            id      : h.id,
            fund    : h.order.fund,
            strategy: h.order.strategy,
            book    : h.order.book,
            trader  : h.order.trader,
            model   : h.order.model,
            *       : holdingFields(inst, h.qty[Holding.END], day)
        ]

        long pnl = (ret.mktVal as long) - h.cost[Holding.END]
        List<Long> basePnls = (0..2).collect { int i ->
            Double basePx = priceOn(inst.symbol, baseDays[i])
            basePx == null ? 0L : Math.round(h.qty[i + 1] * basePx * inst.multiplier) - h.cost[i + 1]
        }
        Double priorPx = priceOn(inst.symbol, baseDays[0])
        ret.priorCloseMktVal = priorPx == null ? 0L : Math.round(h.qty[Holding.PREV] * priorPx * inst.multiplier)
        ret.pnlDay = pnl - basePnls[0]
        ret.pnlMtd = pnl - basePnls[1]
        ret.pnlYtd = pnl - basePnls[2]
        return ret
    }

    // Instrument, exposure and risk fields for a quantity held at the close of day.
    private Map holdingFields(Instrument inst, double qty, LocalDate day) {
        String symbol = inst.symbol
        int mult = inst.multiplier
        double px = priceOn(symbol, day) ?: 0d
        long mktVal = Math.round(qty * px * mult)

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
            *              : instrumentFields(inst),
            quantity       : Math.round(qty),
            price          : px,
            mktVal         : mktVal,
            notional       : Math.round(notional),
            grossExposure  : Math.round(Math.abs(netExposure)),
            netExposure    : Math.round(netExposure),
            betaAdjExposure: Math.round(netExposure * inst.beta),
            delta          : delta,
            gamma          : gamma,
            vega           : vega,
            theta          : theta,
            duration       : isBond ? inst.duration : null,
            dv01           : isBond ? Math.round(mktVal * inst.duration * 0.0001) : null,
            yield          : isBond && px ? (inst.coupon * 100 / px).round(5) : null,
            beta           : inst.beta,
            var95          : Math.round(Math.abs(netExposure) * dailyVol * Z95),
            var99          : Math.round(Math.abs(netExposure) * dailyVol * Z99)
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

    private static void addPctNav(List<Map> rows) {
        Map<String, Double> navs = navsByFund(rows)
        rows.each { row ->
            Double nav = navs[row.fund]
            row.pctNav = nav ? (row.mktVal as long) / nav : null
        }
    }

    // Standard deviation of daily log returns over the trailing window ending on day.
    private double vol(String symbol, LocalDate day) {
        double[] rets = returns(symbol, day)
        return rets.length < 2 ? FALLBACK_VOL : stdev(rets)
    }

    // Standard deviation of a group's daily P&L over the trailing window ending on day.
    @CompileStatic
    private double pnlStdev(List<Map> rows, LocalDate day) {
        double[] pnl = null
        double gross = 0
        for (Map row : rows) {
            double exposure = (row.get('netExposure') as Number).doubleValue()
            gross += Math.abs(exposure)
            double[] rets = returns(volSymbol(row), day)
            if (rets.length < 2) continue
            if (pnl == null) pnl = new double[rets.length]
            for (int i = 0; i < rets.length; i++) pnl[i] += exposure * rets[i]
        }
        return pnl == null ? FALLBACK_VOL * gross : stdev(pnl)
    }

    // Daily log returns over the trailing window ending on day. The same length for every symbol.
    private double[] returns(String symbol, LocalDate day) {
        returnsCache.computeIfAbsent(day) { [:] }.computeIfAbsent(symbol) {
            List<MarketPrice> series = portfolio.historicalPrices[symbol]
            int end = dayIndex[day], start = Math.max(1, end - VOL_WINDOW + 1)
            if (!series || end < 2) return new double[0]
            double[] ret = new double[end - start + 1]
            for (int i = start; i <= end; i++) ret[i - start] = Math.log(series[i].close / series[i - 1].close)
            return ret
        }
    }

    @CompileStatic
    private static double stdev(double[] vals) {
        double mean = 0
        for (double v : vals) mean += v
        mean /= vals.length
        double sq = 0
        for (double v : vals) sq += (v - mean) * (v - mean)
        return Math.sqrt(sq / (vals.length - 1))
    }

    @CompileStatic
    private static String volSymbol(Map row) {
        (row.get('instrumentType') == Option.name() ? row.get('underlying') : row.get('symbol')) as String
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
