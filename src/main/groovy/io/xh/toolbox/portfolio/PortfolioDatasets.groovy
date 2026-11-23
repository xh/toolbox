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
    /** Points in a position's series, and in a fund's. */
    static final int POSITION_SERIES = 30, FUND_SERIES = 60
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
    /**
     * One row per position held at the close of asOf, optionally for one fund.
     *
     * @param series the series fields to compute - `closeHistory` and `pnlHistory` - which are left
     *      out unless named, as they are costly
     */
    List<Map> positions(LocalDate asOf, String fund = null, Collection<String> series = []) {
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
        if ('closeHistory' in series) {
            List<LocalDate> days = lastDays(day, POSITION_SERIES)
            Map<String, List<Double>> closes = [:]
            rows.each { row ->
                row.closeHistory = closes.computeIfAbsent(row.symbol as String) { String symbol -> closeSeries(symbol, days) }
            }
        }
        if ('pnlHistory' in series) {
            Map<String, long[]> pnl = pnlOverDays(baselineAndDays(day, POSITION_SERIES), fund)
            rows.each { it.pnlHistory = dailyChanges(pnl[it.id as String]) }
        }
        return rows
    }

    /**
     * One row per fund with positions at the close of asOf, optionally for one fund: its manager
     * and style, its NAV at the prior close, its P&L summed from its positions, and, when named in `series`, its trend over
     * the last {@link #FUND_SERIES} days - daily P&L, cumulative P&L over the window, and the
     * cumulative P&L's drawdown below its running peak.
     */
    List<Map> fundSummary(LocalDate asOf, String fund = null, Collection<String> series = []) {
        LocalDate day = resolveDay(asOf)
        if (!day) return []

        List<Map> positions = positions(asOf, fund)
        Map<String, Double> navs = navsByFund(positions)
        boolean withSeries = series.any { it in ['pnlHistory', 'cumPnlHistory', 'drawdownHistory'] }
        Map<String, long[]> byFund = withSeries ? sumByFund(pnlOverDays(baselineAndDays(day, FUND_SERIES), fund)) : [:]

        return positions.groupBy { it.fund }.collect { String f, List<Map> rows ->
            Map ret = [
                id     : f,
                fund   : f,
                manager: Lookups.FUND_PROFILES[f]?.manager,
                style  : Lookups.FUND_PROFILES[f]?.style,
                nav    : Math.round(navs[f] ?: 0d),
                pnlDay : rows.sum { it.pnlDay } as long,
                pnlMtd : rows.sum { it.pnlMtd } as long,
                pnlYtd : rows.sum { it.pnlYtd } as long
            ]
            if (withSeries) {
                List<Long> daily = dailyChanges(byFund[f])
                long cum = 0, peak = 0
                List<Long> cumPnl = [], drawdown = []
                daily.each {
                    cum += it
                    peak = Math.max(peak, cum)
                    cumPnl << cum
                    drawdown << cum - peak
                }
                ret += [pnlHistory: daily, cumPnlHistory: cumPnl, drawdownHistory: drawdown]
            }
            return ret
        }
    }

    /**
     * One row per trading day, fund, strategy and symbol from `start` through asOf, optionally for one
     * fund: the day's P&L, and the cumulative P&L since the window began. The default window is the
     * last {@link #POSITION_SERIES} days. Built from the same totals as the positions' and funds'
     * series, so it sums to them. A day on which a holding had no P&L and none to date is left out.
     */
    List<Map> pnlHistory(LocalDate asOf, LocalDate start = null, String fund = null) {
        pnlByDay(asOf, start, fund, true)
    }

    /** As {@link #pnlHistory}, one row per trading day, fund, strategy and sector. */
    List<Map> pnlBySector(LocalDate asOf, LocalDate start = null, String fund = null) {
        pnlByDay(asOf, start, fund, false)
    }

    private List<Map> pnlByDay(LocalDate asOf, LocalDate start, String fund, boolean bySymbol) {
        LocalDate day = resolveDay(asOf)
        if (!day) return []
        int end = dayIndex[day],
            first = start ? firstIndexOnOrAfter(start) : Math.max(0, end - POSITION_SERIES + 1)
        if (first > end) return []

        List<LocalDate> days = baselineAndDays(day, end - first + 1)
        Map<List<String>, long[]> byGroup = [:]
        pnlOverDays(days, fund).each { String key, long[] totals ->
            List<String> parts = key.split('\\|') as List<String>
            String symbol = parts[5], sector = portfolio.instruments[symbol]?.sector
            long[] sum = byGroup.computeIfAbsent([parts[0], parts[1], sector, bySymbol ? symbol : null]) { new long[totals.length] }
            for (int i = 0; i < totals.length; i++) sum[i] += totals[i]
        }

        List<Map> ret = []
        byGroup.each { List<String> group, long[] totals ->
            String f = group[0], strategy = group[1], sector = group[2], symbol = group[3]
            for (int i = 1; i < totals.length; i++) {
                long pnlDay = totals[i] - totals[i - 1], cumPnl = totals[i] - totals[0]
                if (!pnlDay && !cumPnl) continue
                String d = days[i].toString()
                Map row = [id: null, day: d, fund: f, strategy: strategy, sector: sector]
                if (bySymbol) row.symbol = symbol
                row.id = (bySymbol ? [d, f, strategy, symbol] : [d, f, strategy, sector]).join('|')
                ret << row + [pnlDay: pnlDay, cumPnl: cumPnl]
            }
        }
        return ret
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

    /**
     * One row per symbol and trading day in [start, end], by symbol then day, with the live day at
     * current prices. A null symbol means every symbol.
     */
    List<Map> prices(String symbol, LocalDate start, LocalDate end) {
        List<String> symbols = symbol ? [symbol] : portfolio.historicalPrices.keySet().sort()
        symbols.collectMany { String s ->
            (portfolio.historicalPrices[s] ?: [])
                .findAll { it.day >= start && it.day <= end }
                .collect { MarketPrice hist ->
                    MarketPrice p = hist.day == liveDay && currentPrices[s] ? currentPrices[s] : hist
                    [
                        id    : "$s|${hist.day}".toString(),
                        symbol: s,
                        day   : hist.day.toString(),
                        open  : p.open,
                        high  : p.high,
                        low   : p.low,
                        close : p.close,
                        volume: p.volume
                    ]
                }
        }
    }

    /** Every instrument, which hypotheticalPortfolio can price, as {symbol, name, sector}, by symbol. */
    List<Map> symbols() {
        portfolio.instruments.values()
            .sort { it.symbol }
            .collect { [symbol: it.symbol, name: it.name, sector: it.sector] }
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
    // Series
    //------------------------
    // The last n trading days through day, oldest first - fewer near the start of history.
    private List<LocalDate> lastDays(LocalDate day, int n) {
        int end = dayIndex[day]
        portfolio.tradingDays.subList(Math.max(0, end - n + 1), end + 1)
    }

    // The last n trading days through day, after the day before them as a baseline. The baseline
    // is null when the window starts with history, before which every P&L is 0.
    private List<LocalDate> baselineAndDays(LocalDate day, int n) {
        int end = dayIndex[day], start = end - n
        return start >= 0 ? portfolio.tradingDays.subList(start, end + 1) : [null] + portfolio.tradingDays.subList(0, end + 1)
    }

    private int firstIndexOnOrAfter(LocalDate date) {
        int idx = Collections.binarySearch(portfolio.tradingDays, date)
        return idx >= 0 ? idx : -idx - 1
    }

    private List<Double> closeSeries(String symbol, List<LocalDate> days) {
        int dp = portfolio.instruments[symbol].type == InstrumentType.FX ? 4 : 2
        days.collect { priceOn(symbol, it)?.round(dp) }
    }

    // Each position's total P&L - market value less cost - at the close of each day, by position
    // key, with the rounding of positionRow, so the last daily change equals pnlDay.
    @CompileStatic
    private Map<String, long[]> pnlOverDays(List<LocalDate> days, String fund) {
        Map<String, double[]> closes = [:]
        Map<String, Running> running = [:]
        List<Order> orders = liveOrders(days.last())
        int next = 0
        for (int i = 0; i < days.size(); i++) {
            LocalDate day = days[i]
            if (day == null) continue
            for (; next < orders.size() && orders[next].day <= day; next++) {
                Order o = orders[next]
                if (fund && o.fund != fund) continue
                String key = [o.fund, o.strategy, o.book, o.trader, o.model, o.symbol].join('|')
                Running r = running[key]
                if (!r) r = running[key] = new Running(
                    closes: closes.computeIfAbsent(o.symbol) { String symbol -> days.collect { priceOn(symbol, it) ?: 0d } as double[] },
                    multiplier: o.instrument.multiplier,
                    totals: new long[days.size()]
                )
                r.qty += o.quantity
                r.cost += o.cost
            }
            for (Running r : running.values()) {
                r.totals[i] = Math.round(r.qty * r.closes[i] * r.multiplier) - r.cost
            }
        }
        return running.collectEntries { key, r -> [key, r.totals] } as Map<String, long[]>
    }

    // Totals of position P&L series by fund - the first part of each position key.
    @CompileStatic
    private static Map<String, long[]> sumByFund(Map<String, long[]> byPosition) {
        Map<String, long[]> ret = [:]
        byPosition.each { String key, long[] totals ->
            long[] sum = ret.computeIfAbsent(key.substring(0, key.indexOf('|'))) { new long[totals.length] }
            for (int i = 0; i < totals.length; i++) sum[i] += totals[i]
        }
        return ret
    }

    // Day over day changes of a P&L series, which starts with its baseline.
    private static List<Long> dailyChanges(long[] totals) {
        (1..<totals.length).collect { totals[it] - totals[it - 1] }
    }

    private static class Running {
        double[] closes
        int multiplier
        long qty, cost
        long[] totals
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
