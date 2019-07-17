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

    void clearCaches() {
        super.clearCaches()

    }
}
