package io.xh.toolbox.blueprints

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSONParser
import io.xh.toolbox.portfolio.PortfolioDatasets

import java.time.Instant

import static io.xh.toolbox.portfolio.Lookups.FUNDS

/**
 * Serves the portfolio Data Catalog and answers Blueprints data requests against it, from the
 * simulated portfolio. Rows hold the requested fields plus a stable `id`.
 */
class BlueprintDataService extends BaseService {

    def portfolioService

    private BlueprintCatalog catalog = new BlueprintCatalog(
        JSONParser.parseObject(getClass().getResourceAsStream('/blueprints/portfolio.json'))
    )

    private static final Map<String, Closure<List<Map>>> DATASETS = [
        positions: { PortfolioDatasets ds, Map p -> ds.positions(p.asOf, p.fund) },
        orders   : { PortfolioDatasets ds, Map p -> ds.orders(p.asOf, p.fund) }
    ]

    private static final Map<String, Closure<Boolean>> LIVE = [
        positions: { PortfolioDatasets ds, Map p -> ds.isLivePositions(p.asOf) },
        orders   : { PortfolioDatasets ds, Map p -> ds.isLiveOrders(p.asOf) }
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
        if (!DATASETS[ret.dataset]) throw new BlueprintRequestException("Dataset '${ret.dataset}' is not available yet")

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

    List<Map> getRows(BlueprintRequest req, PortfolioDatasets ds = currentDatasets()) {
        List<Map> rows = DATASETS[req.dataset](ds, req.params)

        req.instances.each { inst ->
            Closure fn = PARAM_FIELDS[inst.field]
            rows.each { it[inst.name] = fn(ds, it, inst.params) }
        }

        if (req.filter) rows = rows.findAll(req.filter.testFn)

        List<String> keep = ['id'] + req.fields + req.instances*.name
        return rows.collect { row -> keep.collectEntries { [it, row[it]] } }
    }

    /** True if a request's rows can still change. */
    boolean isLive(BlueprintRequest req, PortfolioDatasets ds = currentDatasets()) {
        LIVE[req.dataset](ds, req.params)
    }
}
