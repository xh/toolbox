package io.xh.toolbox.portfolio.generation

import io.xh.hoist.BaseService
import io.xh.toolbox.portfolio.Instrument
import java.util.concurrent.ConcurrentHashMap

import static io.xh.toolbox.portfolio.Utils.randInt
import static io.xh.toolbox.portfolio.Utils.sample
import static io.xh.toolbox.portfolio.Lookups.*


class InstrumentGenerationService extends BaseService {

    def configService

    Map<String, Instrument> generateInstruments() {
        def instrumentCount = config.instrumentCount
        Map<String, Instrument> ret = new HashMap(instrumentCount)
        while (ret.size() < instrumentCount) {
            String symbol = generateSymbol()
            if (!ret[symbol]) {
                ret[symbol] = new Instrument(
                        symbol: symbol,
                        sector: sample(SECTORS),
                        region: sample(REGIONS)
                )
            }
        }
        return ret
    }

    private String generateSymbol() {
        def ret = '',
            n = randInt(1, 6),
            letters = ('A'..'Z') as List<Character>
        n.times {
            ret += sample(letters)
        }
        return ret
    }

    private Map getConfig() {
        configService.getMap('portfolioConfigs')
    }

    Map getAdminStats() {[
        config: configForAdminStats('portfolioConfigs')
    ]}
}
