package io.xh.toolbox.data

import io.xh.hoist.BaseService

import java.time.DayOfWeek

class PortfolioService extends BaseService {

    private def models = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul']
    private def sectors = ['Financials', 'Healthcare', 'Real Estate', 'Technology', 'Consumer Products', 'Manufacturing', 'Energy', 'Other', 'Utilities']
    private def funds = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay']
    private def regions = ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac']
    private def traders = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn', 'Robert Greer', 'HedgeSys', 'Susan Major']

    private List<Date> tradingDays = generateTradingDays()

    private final def INITIAL_ORDERS = 20000
    private final def INITIAL_SYMBOLS = 500

    private final def random = new Random()

    //------------------------
    // Implementation
    //------------------------

    private List<Date> generateTradingDays() {
        Date tradingDay = new Date(2018, 1, 2)
        Date today = new Date()

        List<Date> ret = []
        tradingDay.upto(today) { date ->
            def dayOfWeek = date.toDayOfWeek()
            if (dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY) {
                ret << date
            }
        }

        return ret
    }

    String generateSymbol() {
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
