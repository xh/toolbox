package io.xh.toolbox.portfolio

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.test.HoistUnitTest
import io.xh.toolbox.portfolio.generation.InstrumentGenerationService
import spock.lang.Specification

import static io.xh.toolbox.portfolio.InstrumentType.*
import static io.xh.toolbox.portfolio.Lookups.*

class InstrumentGenerationServiceSpec extends Specification implements ServiceUnitTest<InstrumentGenerationService>, HoistUnitTest {

    def 'check digits match real CUSIPs and ISINs'() {
        expect:
        InstrumentGenerationService.withCusipCheck('03783310') == '037833100'
        InstrumentGenerationService.withIsinCheck('US037833100') == 'US0378331005'
        InstrumentGenerationService.withIsinCheck('DE000BAY001') == 'DE000BAY0017'
    }

    def 'instruments cover every type, with consistent hierarchies and identifiers'() {
        given:
        useAppTimeZone('UTC')
        testConfigService
            .registerTypedConfig('portfolioConfigs', PortfolioConfig)
            .set('portfolioConfigs', [instrumentCount: 300])

        when:
        Map<String, Instrument> all = service.generateInstruments()
        def byType = all.values().groupBy { it.type }

        then:
        all.size() == 300
        byType.keySet() == InstrumentType.values() as Set
        all.every { sym, i -> i.symbol == sym && i.assetClass == i.type.assetClass }
        all.values().every { i ->
            i.type == FX ?
                i.industry == 'Currencies' :
                i.industry in INDUSTRIES[i.sector]
        }
        all.values().every { i -> [i.country, i.ccy] in COUNTRIES[i.region] }

        and: 'options and futures sit on an equity'
        (byType[Option] + byType[Future]).every { all[it.underlying]?.type == Equity }
        byType[Option].every { it.deltaRatio && it.gammaRatio && it.vegaRatio && it.thetaRatio }
        (all.values() - byType[Option]).every { it.deltaRatio == null }
        (byType[Equity] + byType[Bond] + byType[FX]).every { it.underlying == null }

        and: 'bonds share an equity issuer and carry duration and coupon'
        def issuers = byType[Equity]*.issuer as Set
        byType[Bond].every { it.issuer in issuers && it.duration > 0 && it.coupon > 0 }
        (all.values() - byType[Bond]).every { it.duration == null && it.coupon == null }

        and: 'ISINs on equities and bonds, CUSIPs on US ones only'
        (byType[Equity] + byType[Bond]).every { it.isin ==~ /[A-Z]{2}[0-9A-Z]{9}\d/ }
        all.values().every { (it.cusip != null) == (it.country == 'United States' && it.type in [Equity, Bond]) }
        all.values().findAll { it.cusip }.every { it.isin == InstrumentGenerationService.withIsinCheck('US' + it.cusip) }
        byType[FX].every { it.isin == null && it.symbol == "${it.ccy}USD" }

        and: 'names follow from the issuer, or the pair for FX'
        byType[Equity].every { it.name == it.issuer }
        byType[Bond].every { it.name ==~ /${java.util.regex.Pattern.quote(it.issuer)} [\d.]+% \d{4}/ }
        byType[Option].every { it.name.startsWith(all[it.underlying].issuer) && it.name ==~ /.* [A-Z]{3}\d\d (Call|Put)/ }
        byType[Future].every { it.name.startsWith(all[it.underlying].issuer) && it.name.endsWith(' Future') }
        byType[FX].every { it.name == "${it.ccy}/USD" }
    }
}
