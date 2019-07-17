package io.xh.toolbox.data

import io.xh.hoist.BaseService

import java.time.LocalDate

import static java.time.DayOfWeek.SATURDAY
import static java.time.DayOfWeek.SUNDAY

class InstrumentService extends BaseService {

    //-----------------------------------------
    // Constants for synthetic data generation
    //-----------------------------------------
    private final Long INITIAL_SYMBOLS = 500

    private List<LocalDate> tradingDays


    private final def random = new Random()


    List<Map> getHistoricalData(String symbol) {
        List<Map> mktData = getMktData(symbol)
        return mktData.collect {
            [it.day.toEpochDay(), it.open, it.high, it.low, it.close]
        }
    }


    //---------------
    // Implementation
    //---------------
    private List<Map> generateTimeSeries() {
        List<LocalDate> tradingDays = this.tradingDays
        Set<Integer> spikeDayIdxs = []
        List<Map> ret = []

        // Give some random number of days a spike in trading volume to make that chart interesting.
        int nSpikes = randInt(0, 30)
        nSpikes.times {
            spikeDayIdxs += randInt(0, tradingDays.length())
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

            ret << [
                    day   : tradingDay,
                    high  : Math.round(high, 2),
                    low   : Math.round(low, 2),
                    open  : Math.round(open, 2),
                    close : Math.round(close, 2),
                    volume: randInt(80, maxVol) * 1000
            ]
            startPx = close
        }

        return ret
    }


    private List<LocalDate> generateTradingDays() {
        LocalDate today = LocalDate.now()
        LocalDate tradingDay = LocalDate.of(today.getYear() - 2, 0, 0)

        List<LocalDate> ret = []
        tradingDay.upto(today) {date ->
            def dayOfWeek = date.getDayOfWeek()
            if (dayOfWeek != SATURDAY && dayOfWeek != SUNDAY) {
                ret << date
            }
        }
        return ret
    }




    private getMktData(String symbol) {
        return instData.symbol.mktData
    }

    private String getSector(String symbol) {
        return instData.symbol.sector
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


    private double randDouble(Number lower, Number upper) {
        return random.nextDouble(upper - lower) + lower
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
