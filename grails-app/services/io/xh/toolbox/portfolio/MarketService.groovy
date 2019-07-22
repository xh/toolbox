package io.xh.toolbox.portfolio

import io.xh.hoist.BaseService

import java.time.DayOfWeek
import java.time.LocalDate
import java.util.concurrent.ConcurrentHashMap

import static Utils.*
import static java.time.DayOfWeek.SATURDAY
import static java.time.DayOfWeek.SUNDAY

class MarketService extends BaseService {

    private final int SYMBOL_COUNT = 500

    // Map of instrument symbol to time-series of market activity
    private Map<String, List<MarketPrice>> marketData = generateData()

    Set<String> getAllSymbols() {
        return marketData.keySet()
    }

    List<MarketPrice> getMarketData(String symbol) {
        return marketData[symbol]
    }

    //---------------
    // Implementation
    //---------------
    private Map<String, List<MarketPrice>> generateData() {
        Map<String, List<MarketPrice>> ret = new ConcurrentHashMap(SYMBOL_COUNT)
        List<LocalDate> tradingDays = generateTradingDays()
        def symbolsGenerated = 0
        while (symbolsGenerated < SYMBOL_COUNT) {
            String symbol = generateSymbol()
            if (!ret[symbol]) {
                ret[symbol] = generateTimeSeries(tradingDays)
                symbolsGenerated += 1
            }
        }
        return ret
    }

    private List<MarketPrice> generateTimeSeries(List<LocalDate> tradingDays) {
        Set<Integer> spikeDayIdxs = []
        List<MarketPrice> ret = []

        // Give some random number of days a spike in trading volume to make that chart interesting.
        int nSpikes = randInt(0, 30)
        nSpikes.times {
            spikeDayIdxs += randInt(0, tradingDays.size())
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

            ret << new MarketPrice([
                    day   : tradingDay,
                    high  : high.round(2),
                    low   : low.round(2),
                    open  : open.round(2),
                    close : close.round(2),
                    volume: randInt(80, maxVol) * 1000
            ])
            startPx = close
        }

        return ret
    }

    private static List<LocalDate> generateTradingDays() {
        LocalDate today = LocalDate.now()
        LocalDate tradingDay = LocalDate.of(today.getYear() - 2, 1, 1)

        List<LocalDate> ret = []

        while (tradingDay <= today) {
            DayOfWeek dow = tradingDay.getDayOfWeek()
            if (dow != SATURDAY && dow != SUNDAY) ret << tradingDay
            tradingDay = tradingDay.plusDays(1)
        }

        return ret
    }

    private static String generateSymbol() {
        def ret = '',
            n = randInt(1, 5),
            letters = ('A'..'Z') as List<Character>
        n.times {
            ret += sample(letters)
        }
        return ret
    }

    void clearCaches() {
        super.clearCaches()

    }
}
