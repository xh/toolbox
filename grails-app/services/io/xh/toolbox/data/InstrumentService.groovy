package io.xh.toolbox.data

import io.xh.hoist.BaseService

import java.time.DayOfWeek
import java.time.LocalDate

import static java.time.DayOfWeek.SATURDAY
import static java.time.DayOfWeek.SUNDAY

class InstrumentService extends BaseService {

    //-----------------------------------------
    // Constants for synthetic data generation
    //-----------------------------------------
    private final Long INITIAL_SYMBOLS = 500

    private List<Date> tradingDays


    private final def random = new Random()


    List<Map> getHistoricalData(String symbol) {
        List mktData = getMktData(symbol);
        return []

    }


    //---------------
    // Implementation
    //---------------
    private List<Map> generateTimeSeries(List<>) {
        const tradingDays = this.tradingDays,
                spikeDayIdxs = new Set(),
                ret = [];

        // Give some random number of days a spike in trading volume to make that chart interesting.
        times(random(0, 30), () => spikeDayIdxs.add(random(0, tradingDays.length)));

        // Set a seed price and generate a series from there.
        let startPx = random(10, 100, true);
        tradingDays.forEach((tradingDay, idx) => {
            const bigDown = Math.random() > 0.95,  // Allow for a few bigger swings.
                    bigUp = Math.random() > 0.95,
                    pctDown = random(0, bigDown ? 0.1 : 0.02, true),
                    pctUp = random(0, bigUp ? 0.1 : 0.025, true),  // We can rig the game here...
                    open = startPx,
                    high = startPx + (pctUp * startPx),
                    low = startPx - (pctDown * startPx),
                    close = (Math.random() * (high - low)) + low;

            let maxVol;
            if (spikeDayIdxs.has(idx)) {
                maxVol = 200;
            } else if (spikeDayIdxs.has(idx - 1) || spikeDayIdxs.has(idx + 1)) {
                maxVol = 150;
            } else {
                maxVol = 100;
            }

            ret.push({
                day: tradingDay,
                high: round(high, 2),
                low: round(low, 2),
                open: round(open, 2),
                close: round(close, 2),
                volume: random(80, maxVol) * 1000
            });
            startPx = close;
        });

        return ret;
    }


    private List<LocalDate> generateTradingDays() {
        Date tradingDay = LocalDate.of(2018, 0, 0);
        Date today = LocalDate.now()

        List<Date> ret = []
        tradingDay.upto(today) {date ->
            def dayOfWeek = date.toDayOfWeek()
            if (dayOfWeek != SATURDAY && dayOfWeek != SUNDAY) {
                ret << date
            }
        }
        return ret
    }




    generateSymbol() {
        let ret = '';
        times(random(1, 5), () => ret += sample('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
        return ret;
    }



    private getMktData(String symbol) {
        instData[symbol].mktData
    }

    private String getSector(String symbol) {
        instData[symbol].sector
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
