package io.xh.toolbox.portfolio.generation

import io.xh.hoist.BaseService
import io.xh.toolbox.portfolio.Instrument
import io.xh.toolbox.portfolio.MarketPrice
import io.xh.toolbox.portfolio.Utils

import java.time.LocalDate

import static io.xh.toolbox.portfolio.Utils.randDouble
import static io.xh.toolbox.portfolio.Utils.randInt

/**
 * Generates simulated historical {@link MarketPrice} data for a set of instruments. Produces
 * a daily OHLCV series for each instrument spanning from the start of the previous year through
 * the given day, with randomized price walks and occasional volume spikes.
 */
class HistoricalPriceGenerationService extends BaseService {

    def tradingDayService

    /** Generate a daily price series for each instrument, keyed by symbol. */
    Map<String, List<MarketPrice>> generateHistoricalPrices(
            Map<String, Instrument> instruments,
            LocalDate day
    ) {
        withSpan(
            name: 'generateHistoricalPrices',
            logDebug: "Generating historical prices for ${instruments.size()} instruments"
        ) {
            List<LocalDate> tradingDays = tradingDayService.historicalDays(day)
            return instruments.keySet().collectEntries {
                [it, generatePriceSeries(tradingDays)]
            }
        }
    }

    /**
     * Generate a price series for a single instrument across the given trading days. Walks a
     * random starting price forward with daily perturbations, occasional larger swings (~5%
     * chance), and volume spikes on randomly selected days.
     *
     * Uses primitive arrays for spike day lookups and a direct {@link Random} reference to
     * minimize Groovy dispatch overhead in this high-iteration inner loop (~300 days per
     * instrument, 500 instruments = ~150k total iterations).
     */
    private List<MarketPrice> generatePriceSeries(List<LocalDate> tradingDays) {
        int dayCount = tradingDays.size()

        // Pre-compute spike days and their neighbors as boolean arrays for O(1) lookup,
        // replacing the original Set.find{} which was O(n) per check.
        boolean[] isSpike = new boolean[dayCount]
        boolean[] nearSpike = new boolean[dayCount]
        int nSpikes = randInt(0, 30)
        nSpikes.times {
            int spikeIdx = randInt(0, dayCount)
            isSpike[spikeIdx] = true
            if (spikeIdx > 0) nearSpike[spikeIdx - 1] = true
            if (spikeIdx < dayCount - 1) nearSpike[spikeIdx + 1] = true
        }

        List<MarketPrice> ret = new ArrayList<>(dayCount)
        Random rng = Utils.random
        double startPx = randDouble(10, 100)
        for (int idx = 0; idx < dayCount; idx++) {
            boolean bigDown = rng.nextDouble() > 0.95  // ~5% chance of a larger swing down
            boolean bigUp = rng.nextDouble() > 0.95
            double pctDown = rng.nextDouble() * (bigDown ? 0.1 : 0.02)
            double pctUp = rng.nextDouble() * (bigUp ? 0.1 : 0.025)
            double open = startPx
            double high = startPx + (pctUp * startPx)
            double low = startPx - (pctDown * startPx)
            double close = low + rng.nextDouble() * (high - low)

            int maxVol = isSpike[idx] ? 200 : nearSpike[idx] ? 150 : 100

            ret << new MarketPrice(
                    day: tradingDays[idx],
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
