package io.xh.toolbox.blueprints

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSONParser
import io.xh.hoist.json.JSONSerializer
import io.xh.toolbox.portfolio.PortfolioDatasets
import io.xh.toolbox.weather.OpenWeatherRows
import io.xh.toolbox.weather.WeatherDatasets

import java.time.Instant

import static io.xh.hoist.util.DateTimeUtils.appZoneId
import static io.xh.toolbox.portfolio.Lookups.FUNDS

/**
 * Serves Toolbox's Data Catalog, which merges the portfolio and weather catalogs, and answers
 * Blueprints data requests against it. Portfolio data comes from the simulated portfolio. Weather
 * comes from OpenWeatherMap when `weatherApiKey` is configured, and is seeded otherwise. Rows hold
 * the requested fields plus a stable `id`.
 */
class BlueprintDataService extends BaseService {

    def portfolioService,
        weatherService

    private BlueprintCatalog catalog = BlueprintCatalog.merge(
        'Toolbox',
        ['portfolio', 'weather'].collect { JSONParser.parseObject(getClass().getResourceAsStream("/blueprints/${it}.json")) }
    )

    private static final List<String> WEATHER_DATASETS = ['weather', 'currentWeather']

    // The most rows a wide request may return, by dataset, with what to do past the cap.
    static final Map<String, Integer> MAX_ROWS = [prices: 25_000, pnlHistory: 75_000, pnlBySector: 75_000]
    private static final Map<String, String> CAP_ADVICE = [
        prices    : 'Rows are symbols times trading days: name a symbol, filter by symbol, or shorten the window.',
        pnlHistory: 'Rows are holdings times trading days: name a fund, filter by sector or symbol, or shorten the window.',
        pnlBySector: 'Rows are sectors times trading days: name a fund, or shorten the window.'
    ]
    Map<String, Integer> maxRows = new HashMap(MAX_ROWS)

    // Each takes the requested fields, so a dataset computes its costly fields only when asked for.
    private static final Map<String, Closure<List<Map>>> DATASETS = [
        positions  : { PortfolioDatasets ds, Map p, Set<String> fields -> ds.positions(p.asOf, p.fund, fields) },
        fundSummary: { PortfolioDatasets ds, Map p, Set<String> fields -> ds.fundSummary(p.asOf, p.fund, fields) },
        orders     : { PortfolioDatasets ds, Map p, Set<String> fields -> ds.orders(p.asOf, p.fund) },
        prices     : { PortfolioDatasets ds, Map p, Set<String> fields ->
            if (p.symbol && !ds.portfolio.instruments[p.symbol]) throw new BlueprintRequestException("Unknown symbol '${p.symbol}'")
            ds.prices(p.symbol, p.start, p.end)
        },
        hypotheticalPortfolio: { PortfolioDatasets ds, Map p, Set<String> fields -> ds.hypotheticalPortfolio(parseHoldings(ds, p.portfolio), p.asOf) },
        pnlHistory : { PortfolioDatasets ds, Map p, Set<String> fields -> ds.pnlHistory(p.asOf, p.start, p.fund) },
        pnlBySector: { PortfolioDatasets ds, Map p, Set<String> fields -> ds.pnlBySector(p.asOf, p.start, p.fund) }
    ]

    private static final Map<String, Closure<Boolean>> LIVE = [
        positions  : { PortfolioDatasets ds, Map p -> ds.isLivePositions(p.asOf) },
        fundSummary: { PortfolioDatasets ds, Map p -> ds.isLivePositions(p.asOf) },
        orders     : { PortfolioDatasets ds, Map p -> ds.isLiveOrders(p.asOf) },
        prices   : { PortfolioDatasets ds, Map p -> ds.isLivePrices(p.start, p.end) },
        hypotheticalPortfolio: { PortfolioDatasets ds, Map p -> ds.isLivePositions(p.asOf) },
        pnlHistory : { PortfolioDatasets ds, Map p -> ds.isLivePositions(p.asOf) },
        pnlBySector: { PortfolioDatasets ds, Map p -> ds.isLivePositions(p.asOf) }
    ]

    private static final Map<String, Closure> PARAM_FIELDS = [
        'return'  : { PortfolioDatasets ds, Map row, Map p -> ds.returnFor(row, p.start, p.end) },
        shockedPnl: { PortfolioDatasets ds, Map row, Map p -> ds.shockedPnlFor(row, p.shock as double) }
    ]

    // Group values of the measures that roll up on the server, by catalog field.
    private static final Map<String, Closure> SERVER_AGGREGATORS = [
        var95   : { PortfolioDatasets ds, List<Map> rows, Map ctx, Map p -> ds.groupVar(rows, ctx.asOf, PortfolioDatasets.Z95) },
        var99   : { PortfolioDatasets ds, List<Map> rows, Map ctx, Map p -> ds.groupVar(rows, ctx.asOf, PortfolioDatasets.Z99) },
        pctNav  : { PortfolioDatasets ds, List<Map> rows, Map ctx, Map p -> PortfolioDatasets.groupPctNav(rows, ctx.navs) },
        'return': { PortfolioDatasets ds, List<Map> rows, Map ctx, Map p -> ds.groupReturn(rows, p.start, p.end) }
    ]

    Map getCatalogJson() {
        catalog.json
    }

    /** Each fund as {name, aum}, with AUM in USD. */
    List<Map> getFunds() {
        currentDatasets().funds()
    }

    /** Every symbol hypotheticalPortfolio can price, as {symbol, name, sector}, by symbol. */
    List<Map> getSymbols() {
        currentDatasets().symbols()
    }

    /** Check a request spec against the catalog. */
    BlueprintRequest parseRequest(Map spec) {
        BlueprintRequest ret = catalog.parseRequest(spec)
        if (!DATASETS[ret.dataset] && !(ret.dataset in WEATHER_DATASETS)) throw new BlueprintRequestException("Dataset '${ret.dataset}' is not available yet")

        def fund = ret.params.fund
        if (fund && !(fund in FUNDS)) {
            throw new BlueprintRequestException("Unknown fund '$fund'. Funds: ${FUNDS.join(', ')}")
        }
        return ret
    }

    /** A consistent view of the portfolio as of now, to compute one or more requests from. */
    PortfolioDatasets currentDatasets() {
        new PortfolioDatasets(portfolioService.portfolio, portfolioService.currentPrices, Instant.now())
    }

    /** True for datasets computed from the portfolio, which need a {@link PortfolioDatasets}. */
    boolean isPortfolioDataset(String dataset) {
        DATASETS.containsKey(dataset)
    }

    /**
     * Rows for a request, and its server aggregates for the given grouping sets. Portfolio
     * datasets compute from ds, or from the current portfolio.
     */
    BlueprintResult query(BlueprintRequest req, PortfolioDatasets ds = null, List<List<String>> sets = req.groupBy) {
        List<Map> rows
        Map<String, Double> navs = [:]
        Set<String> requested = (req.fields + req.instances*.field) as Set
        if (isPortfolioDataset(req.dataset)) {
            ds = ds ?: currentDatasets()
            rows = DATASETS[req.dataset](ds, req.params, requested)
            if (req.dataset == 'positions') navs = PortfolioDatasets.navsByFund(rows)
        } else {
            rows = weatherRows(req.dataset, req.params.city as String, req.params.units as String, requested)
        }

        req.instances.each { inst ->
            Closure fn = PARAM_FIELDS[inst.field]
            rows.each { it[inst.name] = fn(ds, it, inst.params) }
        }

        if (req.filter) rows = rows.findAll(req.filter.testFn)
        Integer cap = maxRows[req.dataset]
        if (cap != null && rows.size() > cap) {
            throw new BlueprintRequestException("${req.dataset} would return ${rows.size()} rows, over its limit of $cap. ${CAP_ADVICE[req.dataset]}")
        }

        List<String> keep = ['id'] + req.fields + req.instances*.name
        return new BlueprintResult(
            rows: rows.collect { row -> keep.collectEntries { [it, row[it]] } },
            aggregates: req.serverColumns && sets ? aggregates(req, ds, rows, navs, sets) : null
        )
    }

    List<Map> getRows(BlueprintRequest req, PortfolioDatasets ds = null) {
        query(req, ds).rows
    }

    /** True if a request's rows can still change. */
    boolean isLive(BlueprintRequest req, PortfolioDatasets ds = null) {
        isPortfolioDataset(req.dataset) && LIVE[req.dataset](ds ?: currentDatasets(), req.params)
    }

    //------------------------
    // Implementation
    //------------------------
    // One {dims, values} per group of each set, over the request's filtered leaves.
    private List<Map> aggregates(
        BlueprintRequest req,
        PortfolioDatasets ds,
        List<Map> leaves,
        Map<String, Double> navs,
        List<List<String>> sets
    ) {
        Map ctx = [asOf: req.params.asOf, navs: navs]
        return sets.collectMany { List<String> dims ->
            Map<List, List<Map>> groups = dims ? leaves.groupBy { row -> dims.collect { row[it] } } : [([]): leaves]
            groups.collect { List key, List<Map> rows ->
                [
                    dims  : [dims, key].transpose().collectEntries(),
                    values: req.serverColumns.collectEntries { col ->
                        [col.name, SERVER_AGGREGATORS[col.field](ds, rows, ctx, col.params)]
                    }
                ]
            }
        }
    }

    private List<Map> weatherRows(String dataset, String city, String units, Set<String> fields) {
        boolean forecast = dataset == 'weather'
        if (weatherService.configured) {
            if (forecast) return OpenWeatherRows.forecast(city, weatherService.getForecast(city, units), appZoneId)
            Map row = OpenWeatherRows.current(city, weatherService.getCurrentWeather(city, units))
            if ('tempNext24h' in fields) {
                row.tempNext24h = OpenWeatherRows.tempNext24h(weatherService.getForecast(city, units))
            }
            return [row]
        }
        def seeded = new WeatherDatasets(appZoneId)
        return forecast ? seeded.forecast(city, units, Instant.now()) : [seeded.current(city, units, Instant.now())]
    }

    // A portfolio param, {holdings: [{symbol, weight}]}, as [symbol, weight] pairs.
    private static List<List> parseHoldings(PortfolioDatasets ds, Object portfolio) {
        def holdings = portfolio instanceof Map ? portfolio.holdings : null
        if (!(holdings instanceof List) || !holdings.every { it instanceof Map }) {
            throw new BlueprintRequestException("Parameter 'portfolio' must be {holdings: [{symbol, weight}]}, got ${JSONSerializer.serialize(portfolio)}")
        }

        Set<String> seen = []
        return (holdings as List<Map>).collect { Map h ->
            String symbol = h.symbol
            if (!ds.portfolio.instruments[symbol]) throw new BlueprintRequestException("Unknown symbol '$symbol' in portfolio")
            if (!(h.weight instanceof Number)) throw new BlueprintRequestException("Holding '$symbol' needs a numeric weight, got '${h.weight}'")
            if (!seen.add(symbol)) throw new BlueprintRequestException("Symbol '$symbol' appears more than once in portfolio")
            [symbol, h.weight]
        }
    }
}
