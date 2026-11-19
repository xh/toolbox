package io.xh.toolbox.portfolio.generation

import io.xh.hoist.BaseService
import io.xh.toolbox.portfolio.Instrument
import io.xh.toolbox.portfolio.InstrumentType
import io.xh.toolbox.portfolio.PortfolioConfig

import static io.xh.hoist.util.DateTimeUtils.appDay
import static io.xh.toolbox.portfolio.InstrumentType.*
import static io.xh.toolbox.portfolio.Lookups.*
import static io.xh.toolbox.portfolio.Utils.randDouble
import static io.xh.toolbox.portfolio.Utils.randInt
import static io.xh.toolbox.portfolio.Utils.sample

/**
 * Generates a randomized set of mock {@link Instrument} objects: equities, plus options, futures
 * and bonds on those equities' issuers, plus one FX pair per non-USD currency. The number of
 * instruments is controlled by the {@code portfolioConfigs.instrumentCount} config.
 */
class InstrumentGenerationService extends BaseService {

    String telemetryPrefix = 'toolbox.portfolio'

    def configService

    private static final List<String> MONTHS = ['MAR', 'JUN', 'SEP', 'DEC']
    private static final List<String> ISSUER_SUFFIXES = ['Inc', 'Corp', 'Holdings', 'Group']
    private static final String ALNUM = ('0'..'9').join('') + ('A'..'Z').join('')
    private static final Map<String, String> ISIN_PREFIXES = [
        'United States': 'US', 'Brazil': 'BR', 'India': 'IN', 'China': 'CN', 'Mexico': 'MX',
        'South Africa' : 'ZA', 'Indonesia': 'ID', 'Germany': 'DE', 'France': 'FR', 'Netherlands': 'NL',
        'Italy'        : 'IT', 'Japan': 'JP', 'Australia': 'AU', 'Hong Kong': 'HK', 'Singapore': 'SG'
    ]

    /** Generate a map of unique instruments keyed by symbol. */
    Map<String, Instrument> generateInstruments() {
        observe()
            .span('generateInstruments')
            .logDebug("Generating ${config.instrumentCount} instruments")
            .run {
                Map<String, Instrument> ret = [:]
                List<Instrument> fx = generateFx(),
                    equities = [],
                    derived = []

                int rest = Math.max(config.instrumentCount - fx.size(), 1),
                    nOption = Math.round(rest * 0.15) as int,
                    nFuture = Math.round(rest * 0.05) as int,
                    nBond = Math.round(rest * 0.15) as int,
                    nEquity = Math.max(rest - nOption - nFuture - nBond, 1)

                while (equities.size() < nEquity) {
                    def eq = generateEquity()
                    if (!ret[eq.symbol]) {
                        ret[eq.symbol] = eq
                        equities << eq
                    }
                }

                [(Option): nOption, (Future): nFuture, (Bond): nBond].each { type, n ->
                    int added = 0
                    while (added < n) {
                        def inst = generateDerived(type, sample(equities))
                        if (!ret[inst.symbol]) {
                            ret[inst.symbol] = inst
                            added++
                        }
                    }
                }

                fx.each { ret[it.symbol] = it }
                return ret
            }
    }

    //------------------------
    // Implementation
    //------------------------
    private Instrument generateEquity() {
        String symbol = generateTicker(),
            issuer = "$symbol ${sample(ISSUER_SUFFIXES)}",
            sector = sample(SECTORS),
            region = sample(REGIONS)
        List<String> countryCcy = sample(COUNTRIES[region])
        String cusip = countryCcy[0] == 'United States' ? withCusipCheck(randomAlnum(6) + '10') : null

        return new Instrument(
            symbol: symbol,
            type: Equity,
            sector: sector,
            industry: sample(INDUSTRIES[sector]),
            region: region,
            country: countryCcy[0],
            ccy: countryCcy[1],
            name: issuer,
            issuer: issuer,
            cusip: cusip,
            isin: generateIsin(countryCcy[0], cusip),
            beta: randDouble(0.5, 1.8).round(2)
        )
    }

    private Instrument generateDerived(InstrumentType type, Instrument eq) {
        def ret = new Instrument(
            type: type,
            sector: eq.sector,
            industry: eq.industry,
            region: eq.region,
            country: eq.country,
            ccy: eq.ccy
        )
        int year = appDay().year

        switch (type) {
            case Option:
                boolean isCall = randInt(0, 2) == 1
                String expiry = "${sample(MONTHS)}${(year + randInt(0, 2)) % 100}"
                ret.with {
                    symbol = "${eq.symbol} $expiry ${isCall ? 'C' : 'P'}"
                    name = "${eq.issuer} $expiry ${isCall ? 'Call' : 'Put'}"
                    underlying = eq.symbol
                    beta = eq.beta
                    deltaRatio = randDouble(0.2, 0.9).round(3) * (isCall ? 1 : -1)
                    gammaRatio = randDouble(0.01, 0.1).round(4)
                    vegaRatio = randDouble(0.001, 0.004).round(5)
                    thetaRatio = randDouble(0.0002, 0.001).round(5)
                }
                break
            case Future:
                ret.with {
                    String expiry = "${sample(MONTHS)}${(year + randInt(0, 2)) % 100}"
                    symbol = "${eq.symbol} FUT $expiry"
                    name = "${eq.issuer} $expiry Future"
                    underlying = eq.symbol
                    beta = eq.beta
                }
                break
            case Bond:
                int years = randInt(1, 31)
                double cpn = randInt(16, 65) * 0.00125
                String bondCusip = eq.cusip ? withCusipCheck(eq.cusip.take(6) + randomAlnum(2)) : null
                ret.with {
                    symbol = "${eq.symbol} ${(cpn * 100).round(3)} ${year + years}"
                    name = "${eq.issuer} ${(cpn * 100).round(3)}% ${year + years}"
                    issuer = eq.issuer
                    cusip = bondCusip
                    isin = generateIsin(eq.country, bondCusip)
                    beta = randDouble(0.05, 0.3).round(2)
                    coupon = cpn
                    duration = (years * randDouble(0.7, 0.9)).round(2)
                }
                break
        }
        return ret
    }

    private List<Instrument> generateFx() {
        Map<String, List<String>> byCcy = [:]
        COUNTRIES.each { region, countries ->
            countries.each { country, ccy ->
                if (ccy != 'USD' && !byCcy[ccy]) byCcy[ccy] = [region, country]
            }
        }
        return byCcy.collect { ccy, regionCountry ->
            new Instrument(
                symbol: "${ccy}USD",
                name: "$ccy/USD",
                type: FX,
                sector: 'Other',
                industry: 'Currencies',
                region: regionCountry[0],
                country: regionCountry[1],
                ccy: ccy,
                beta: randDouble(0, 0.3).round(2)
            )
        }
    }

    private String generateTicker() {
        def letters = ('A'..'Z') as List<String>
        return (1..randInt(1, 6)).collect { sample(letters) }.join('')
    }

    private String randomAlnum(int n) {
        (1..n).collect { ALNUM[randInt(0, ALNUM.size())] }.join('')
    }

    private String generateIsin(String country, String cusip) {
        String prefix = ISIN_PREFIXES[country]
        return withIsinCheck(prefix + (country == 'United States' ? cusip : randomAlnum(9)))
    }

    /** Append the standard CUSIP check digit to an 8-character base. */
    static String withCusipCheck(String base) {
        int sum = 0
        base.eachWithIndex { String c, int i ->
            int v = ALNUM.indexOf(c)
            if (i % 2 == 1) v *= 2
            sum += v.intdiv(10) + v % 10
        }
        return base + ((10 - sum % 10) % 10)
    }

    /** Append the standard ISIN (Luhn) check digit to an 11-character base. */
    static String withIsinCheck(String base) {
        String digits = base.collect { ALNUM.indexOf(it) as String }.join('')
        int sum = 0
        digits.reverse().eachWithIndex { String c, int i ->
            int v = c as int
            if (i % 2 == 0) v *= 2
            sum += v.intdiv(10) + v % 10
        }
        return base + ((10 - sum % 10) % 10)
    }

    private PortfolioConfig getConfig() {
        configService.getObject(PortfolioConfig)
    }

    Map getAdminStats() {[
        config: configForAdminStats('portfolioConfigs')
    ]}
}
