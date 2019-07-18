package io.xh.toolbox.data

import io.xh.hoist.BaseService

class PortfolioService extends BaseService {

    //-----------------------------------------
    // Constants for synthetic data generation
    //-----------------------------------------
    private final List models = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul']
    private final List sectors = ['Financials', 'Healthcare', 'Real Estate', 'Technology', 'Consumer Products', 'Manufacturing', 'Energy', 'Other', 'Utilities']
    private final List funds = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay']
    private final List regions = ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac']
    private final List traders = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn', 'Robert Greer', 'HedgeSys', 'Susan Major']

    private final Long INITIAL_ORDERS = 20000


    private final def random = new Random()


    /**
     * Return a portfolio of hierarchically grouped positions for the selected dimension(s).
     * @param dims - field names for dimensions on which to group.
     */
    List<Map> getPortfolio(Collection<String> dims, boolean includeSummary = false) {

        List positions = getPositions(dims)

        return !includeSummary ? positions : [
                [
                        id      : 'summary',
                        name    : 'Total',
                        pnl     : positions.sum {it.pnl},
                        mktVal  : positions.sum {it.mktVal},
                        children: positions
                ]
        ]
    }


    /**
     * Return a single grouped position, uniquely identified by drilldown ID.
     * @param positionId - ID installed on each position returned by `getPortfolio()`.
     */
    Map getPositionAsync(String positionId) {

        Map parsedId = parsePositionId(positionId)
        List dims = parsedId.keySet()
        List dimVals = parsedId.values()

        List positions = getPositions(dims)
        Map ret = null

        dimVals.each {dimVal ->
            ret = positions.find {it.name == dimVal}
            if (ret.children) positions = ret.children
        }

        return ret
    }


    List<Map> getOrdersAsync(String positionId) {
        orders.findAll {it.positionId == positionId}
    }


    //------------------------
    // Implementation
    //------------------------

    private Map getRandomPositionForPortfolio() {
        String symbol = sample(symbols)
        Map ret = [
                symbol: symbol,
                sector: getSector(symbol),
                model : sample(models),
                fund  : sample(funds),
                region: sample(regions),
                trader: sample(traders)
        ]

        // Generate unique key for leaf-level grouping within calculateRawPositions.
        ret.id = values(ret).join('||')
        return ret
    }

    // Calculate lowest-level leaf positions with P&L.
    private List<Map> calculateRawPositions() {
        Map byPosId = orders.groupBy { it.posId }
        List<Map> positions = []

        byPosId.each { id, ordersForId ->
            Map first = ordersForId.first()
            String symbol = first.symbol
            double endPx = getMktData(symbol).last().close

            def endQty = 0
            def netCashflow = 0

            ordersForId = ordersForId.sort {
                it.time
            }
            ordersForId.each {
                endQty += it.quantity
                netCashflow -= it.mktVal
            }

            // Crude P&L calc.
            double endMktVal = endQty * endPx
            double pnl = netCashflow + endMktVal

            positions << [
                    symbol: symbol,
                    sector: first.sector,
                    model : first.model,
                    fund  : first.fund,
                    region: first.region,
                    trader: first.trader,
                    mktVal: endMktVal,
                    pnl   : pnl
            ]
        }

        return positions
    }

    // Generate grouped, hierarchical position rollups for a list of one or more dimensions.
    private List<Map> getPositions(List<String> dims, List<Map> positions = rawPositions, String id = 'root') {
        List<String> dimsC = dims.collect()  // Avoid mutating our input array.

        const dim = dims.shift(),
                byDimVal = groupBy(positions, it = > it[dim]),
                ret = []

        forOwn(byDimVal, (members, dimVal) = > {
            const groupPos = {
                // Generate a drilldown ID that encodes the path to this row.
                id:
                id + ` >> $ { dim } : $ { dimVal } `,
                name:
                dimVal ,
                pnl:
                sumBy(members, 'pnl') ,
                mktVal:
                sumBy(members, 'mktVal')
            }

            // Recurse to create children for this node if additional dimensions remain.
            if (dims.length) {
                groupPos.children = this.getPositions(dims, members, groupPos.id)
            }

            ret.push(groupPos)
        })

        return ret
    }

    private String generateSymbol() {
        String ret = ""
        int n = randInt(1, 5)
        def letters = ('A'..'Z')
        n.times {
            ret += sample(letters)
        }
        return ret
    }

    private def randInt(int lower, int upper) {
        return random.nextInt(upper - lower) + lower
    }

    private def sample(List list) {
        def i = random.nextInt(list.size())
        return list[i]
    }

    private String getSector(String symbol) {
        return instData.symbol.sector
    }

    void clearCaches() {
        super.clearCaches()

    }
}
