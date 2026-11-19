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

    private static final Map<String, Closure<List<Map>>> DATASETS = [
        positions: { PortfolioDatasets ds, Map p -> ds.positions(p.asOf, p.fund) },
        orders   : { PortfolioDatasets ds, Map p -> ds.orders(p.asOf, p.fund) },
        prices   : { PortfolioDatasets ds, Map p ->
            if (!ds.portfolio.instruments[p.symbol]) throw new BlueprintRequestException("Unknown symbol '${p.symbol}'")
            ds.prices(p.symbol, p.start, p.end)
        },
        hypotheticalPortfolio: { PortfolioDatasets ds, Map p -> ds.hypotheticalPortfolio(parseHoldings(ds, p.portfolio), p.asOf) }
    ]

    private static final Map<String, Closure<Boolean>> LIVE = [
        positions: { PortfolioDatasets ds, Map p -> ds.isLivePositions(p.asOf) },
        orders   : { PortfolioDatasets ds, Map p -> ds.isLiveOrders(p.asOf) },
        prices   : { PortfolioDatasets ds, Map p -> ds.isLivePrices(p.start, p.end) },
        hypotheticalPortfolio: { PortfolioDatasets ds, Map p -> ds.isLivePositions(p.asOf) }
    ]

    private static final Map<String, Closure> PARAM_FIELDS = [
        'return'  : { PortfolioDatasets ds, Map row, Map p -> ds.returnFor(row, p.start, p.end) },
        shockedPnl: { PortfolioDatasets ds, Map row, Map p -> ds.shockedPnlFor(row, p.shock as double) }
    ]

    Map getCatalogJson() {
        catalog.json
    }

    /** Each fund as {name, aum}, with AUM in USD. */
    List<Map> getFunds() {
        currentDatasets().funds()
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

    /** Rows for a request. Portfolio datasets compute from ds, or from the current portfolio. */
    List<Map> getRows(BlueprintRequest req, PortfolioDatasets ds = null) {
        List<Map> rows
        if (isPortfolioDataset(req.dataset)) {
            ds = ds ?: currentDatasets()
            rows = DATASETS[req.dataset](ds, req.params)
        } else {
            rows = weatherRows(req.dataset, req.params.city as String, req.params.units as String)
        }

        req.instances.each { inst ->
            Closure fn = PARAM_FIELDS[inst.field]
            rows.each { it[inst.name] = fn(ds, it, inst.params) }
        }

        if (req.filter) rows = rows.findAll(req.filter.testFn)

        List<String> keep = ['id'] + req.fields + req.instances*.name
        return rows.collect { row -> keep.collectEntries { [it, row[it]] } }
    }

    /** True if a request's rows can still change. */
    boolean isLive(BlueprintRequest req, PortfolioDatasets ds = null) {
        isPortfolioDataset(req.dataset) && LIVE[req.dataset](ds ?: currentDatasets(), req.params)
    }

    //------------------------
    // Implementation
    //------------------------
    private List<Map> weatherRows(String dataset, String city, String units) {
        boolean forecast = dataset == 'weather'
        if (weatherService.configured) {
            return forecast ?
                OpenWeatherRows.forecast(city, weatherService.getForecast(city, units), appZoneId) :
                [OpenWeatherRows.current(city, weatherService.getCurrentWeather(city, units))]
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
