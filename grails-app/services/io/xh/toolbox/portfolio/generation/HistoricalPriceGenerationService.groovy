package io.xh.toolbox.portfolio.generation

import io.xh.hoist.BaseService
import io.xh.toolbox.portfolio.Instrument
import io.xh.toolbox.portfolio.MarketPrice

import java.time.LocalDate

import static io.xh.toolbox.portfolio.Utils.randDouble
import static io.xh.toolbox.portfolio.Utils.randInt

class HistoricalPriceGenerationService extends BaseService {

    def tradingDayService

    Map<String, List<MarketPrice>> generateHistoricalPrices(
            Map<String, Instrument> instruments,
            LocalDate day
    ) {
        List<LocalDate> tradingDays = tradingDayService.historicalDays(day)
        return instruments.keySet().collectEntries {
            [it, generatePriceSeries(tradingDays)]
        }
    }

    private List<MarketPrice> generatePriceSeries(List<LocalDate> tradingDays) {
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
            double close = randDouble(low, high)

            int maxVol
            if (spikeDayIdxs.find { it == idx }) {
                maxVol = 200
            } else if (spikeDayIdxs.find { it == (idx - 1) } || spikeDayIdxs.find { it == (idx + 1) }) {
                maxVol = 150
            } else {
                maxVol = 100
            }

            ret << new MarketPrice(
                    day: tradingDay,
                    high: high.round(2),
                    low: low.round(2),
                    open: open.round(2),
                    close: close.round(2),
                    volume: randInt(80, maxVol) * 1000
            )
            startPx = close
        }

        return ret
    }

}
