package io.xh.toolbox.blueprints

import io.xh.hoist.json.JSONParser
import spock.lang.Shared
import spock.lang.Specification

import java.time.LocalDate

class BlueprintCatalogSpec extends Specification {

    @Shared
    BlueprintCatalog catalog = new BlueprintCatalog(
        JSONParser.parseObject(getClass().getResourceAsStream('/blueprints/portfolio.json'))
    )

    def 'dataset fields resolve shared fields by name and keep their own'() {
        when:
        def fields = catalog.fieldsFor('positions')

        then:
        fields.sector.isDimension
        fields.pnlDay.kind == 'pnl'
        fields['return'].params.start.type == 'localDate'
        fields.shockedPnl.params.shock.required
        catalog.fieldsFor('orders').dir.isDimension
    }

    def 'every dataset declares a key of its own fields'() {
        given:
        def merged = BlueprintCatalog.merge('Toolbox', ['portfolio', 'weather'].collect {
            JSONParser.parseObject(getClass().getResourceAsStream("/blueprints/${it}.json"))
        })

        expect:
        merged.datasets.every { name, ds -> ds.key && merged.fieldsFor(name).keySet().containsAll(ds.key) }
    }

    def 'a valid request resolves params and field instances to their types'() {
        when:
        def req = catalog.parseRequest(
            dataset: 'positions',
            params: [asOf: '2026-11-18', fund: 'Oak Mount'],
            fields: ['sector', 'mktVal', [name: 'retYtd', field: 'return', params: [start: '2026-01-01', end: '2026-11-18']]],
            groupBy: [['sector']],
            filter: [field: 'retYtd', op: '>', value: 0]
        )

        then:
        req.params == [asOf: LocalDate.of(2026, 11, 18), fund: 'Oak Mount']
        req.fields == ['sector', 'mktVal']
        req.instances*.name == ['retYtd']
        req.instances[0].params == [start: LocalDate.of(2026, 1, 1), end: LocalDate.of(2026, 11, 18)]
        req.filter.allFields == ['retYtd']
    }

    def "each catalog's modelAccess carries onto its own datasets, which may set their own"() {
        when:
        def merged = BlueprintCatalog.merge('X', [
            [version: 1, modelAccess: 'rows', datasets: [a: [fields: []], b: [modelAccess: 'none', fields: []]]],
            [version: 1, datasets: [c: [fields: []]]]
        ])

        then:
        !merged.json.containsKey('modelAccess')
        merged.datasets.a.modelAccess == 'rows'
        merged.datasets.b.modelAccess == 'none'
        !merged.datasets.c.containsKey('modelAccess')
    }

    def 'the demo catalogs open their rows to the model, except trader names'() {
        given:
        def merged = BlueprintCatalog.merge('Toolbox', ['portfolio', 'weather'].collect {
            JSONParser.parseObject(getClass().getResourceAsStream("/blueprints/${it}.json"))
        })

        expect:
        merged.datasets.every { name, ds -> ds.modelAccess == 'rows' }
        merged.fieldsFor('positions').trader.modelAccess == 'schema'
    }

    def 'catalogs merge into one, and a shared name fails loudly'() {
        given:
        def weather = JSONParser.parseObject(getClass().getResourceAsStream('/blueprints/weather.json'))

        when:
        def merged = BlueprintCatalog.merge('Toolbox', [catalog.json, weather])

        then:
        merged.json.label == 'Toolbox'
        merged.datasets.keySet() as List == ['positions', 'fundSummary', 'pnlHistory', 'pnlBySector', 'orders', 'prices', 'hypotheticalPortfolio', 'weather', 'currentWeather']
        merged.fieldsFor('weather').temp.kind == 'temperature'
        merged.fieldsFor('positions').mktVal.kind == 'marketValue'
        merged.json.kinds.keySet().containsAll(['pnl', 'temperature'])

        when:
        BlueprintCatalog.merge('X', [catalog.json, [version: 1, fields: [[name: 'sector', type: 'string']]]])

        then:
        def e = thrown(IllegalStateException)
        e.message == "Catalogs both define fields 'sector'"

        when:
        BlueprintCatalog.merge('X', [catalog.json, [version: 1, kinds: [pnl: [base: 'number']]]])

        then:
        e = thrown(IllegalStateException)
        e.message == "Catalogs both define kinds 'pnl'"

        when:
        BlueprintCatalog.merge('X', [catalog.json, [version: 2]])

        then:
        thrown(IllegalStateException)
    }

    def 'a param with options must take one of them'() {
        given:
        def weather = new BlueprintCatalog(JSONParser.parseObject(getClass().getResourceAsStream('/blueprints/weather.json')))

        expect:
        weather.parseRequest(dataset: 'weather', params: [city: 'London', units: 'metric'], fields: ['temp']).params.units == 'metric'

        when:
        weather.parseRequest(dataset: 'weather', params: [city: 'London', units: 'kelvin'], fields: ['temp'])

        then:
        def e = thrown(BlueprintRequestException)
        e.message == "Parameter 'units' of dataset 'weather' must be one of imperial, metric, got 'kelvin'"
    }

    def 'groupBy holds sorted, distinct sets of dimensions, and server columns are marked'() {
        when:
        def req = catalog.parseRequest(
            dataset: 'positions',
            params: [asOf: '2026-11-18'],
            fields: ['sector', 'mktVal', 'var95', 'pctNav',
                     [name: 'retYtd', field: 'return', params: [start: '2026-01-01', end: '2026-11-18']],
                     [name: 'down10', field: 'shockedPnl', params: [shock: -0.1]]],
            groupBy: [[], ['sector', 'fund'], ['fund', 'sector'], ['fund']]
        )

        then:
        req.groupBy == [[], ['fund', 'sector'], ['fund']]
        req.serverColumns*.name == ['var95', 'pctNav', 'retYtd']
        req.serverColumns*.field == ['var95', 'pctNav', 'return']
        req.serverColumns[2].params.start == LocalDate.of(2026, 1, 1)
        catalog.parseRequest(dataset: 'orders', params: [asOf: '2026-11-18'], fields: ['dir']).groupBy == []
    }

    def 'groupBy may name only dimensions: #problem'() {
        when:
        catalog.parseRequest(dataset: 'positions', params: [asOf: '2026-11-18'], fields: ['var95'], groupBy: groupBy)

        then:
        def e = thrown(BlueprintRequestException)
        e.message.startsWith(message)

        where:
        problem         | groupBy              || message
        'a measure'     | [['mktVal']]         || "groupBy names 'mktVal', which is not a dimension of dataset 'positions'"
        'unknown field' | [['fund', 'colour']] || "groupBy names 'colour', which is not a dimension of dataset 'positions'"
        'not sets'      | ['fund']             || 'groupBy must be a list of grouping sets'
    }

    def 'a weather city must be one the app offers, so prompts get a select'() {
        given:
        def weather = new BlueprintCatalog(JSONParser.parseObject(getClass().getResourceAsStream('/blueprints/weather.json')))

        expect:
        ['weather', 'currentWeather'].every { weather.datasets[it].params.city.options.values.contains('New York') }
        weather.parseRequest(dataset: 'currentWeather', params: [city: 'Tokyo', units: 'metric'], fields: ['temp']).params.city == 'Tokyo'

        when:
        weather.parseRequest(dataset: 'weather', params: [city: 'Atlantis', units: 'metric'], fields: ['temp'])

        then:
        def e = thrown(BlueprintRequestException)
        e.message.startsWith("Parameter 'city' of dataset 'weather' must be one of Atlanta, Austin")
    }

    def 'wind speeds take their unit from the units param'() {
        given:
        Map weather = JSONParser.parseObject(getClass().getResourceAsStream('/blueprints/weather.json'))

        expect:
        weather.formats.speed.label == [param: 'units', values: [imperial: ' mph', metric: ' m/s']]
        weather.datasets.values().every { it.params.units.options.values.sort() == ['imperial', 'metric'] }
    }

    def 'an optional param may be empty'() {
        expect:
        catalog.parseRequest(dataset: 'orders', params: [asOf: '2026-11-18', fund: ''], fields: ['dir']).params.fund == null
    }

    def 'an invalid request fails with a message that names the problem: #problem'() {
        when:
        catalog.parseRequest(spec)

        then:
        def e = thrown(BlueprintRequestException)
        e.statusCode == 400
        e.message.contains(message)

        where:
        problem                     | spec                                                                              || message
        'unknown dataset'           | [dataset: 'trades']                                                               || "Unknown dataset 'trades'. Datasets: positions, fundSummary, pnlHistory, pnlBySector, orders, prices, hypotheticalPortfolio"
        'missing required param'    | [dataset: 'positions', params: [:]]                                               || "Dataset 'positions' requires parameter 'asOf'"
        'unknown param'             | [dataset: 'positions', params: [asOf: '2026-11-18', book: 'x']]                   || "Unknown parameter 'book' for dataset 'positions'"
        'bad date'                  | [dataset: 'positions', params: [asOf: '11/18/2026']]                              || "Parameter 'asOf' of dataset 'positions' must be a localDate as YYYY-MM-DD, got '11/18/2026'"
        'non-string string param'   | [dataset: 'prices', params: [symbol: ['A'], start: '2026-11-18', end: '2026-11-18']] || "Parameter 'symbol' of dataset 'prices' must be a string, got '[A]'"
        'unknown field'             | positions(['sector', 'pnl'])                                                      || "Unknown field 'pnl' in dataset 'positions'"
        'field not in dataset'      | positions(['orderId'])                                                            || "Unknown field 'orderId' in dataset 'positions'"
        'bare param field'          | positions(['return'])                                                             || "Field 'return' takes parameters"
        'instance of plain field'   | positions([[name: 'mv2', field: 'mktVal']])                                       || "Field instance 'mv2' names 'mktVal', which takes no parameters"
        'instance missing param'    | positions([[name: 'shock10', field: 'shockedPnl', params: [:]]])                  || "Field instance 'shock10' requires parameter 'shock'"
        'instance bad param type'   | positions([[name: 'shock10', field: 'shockedPnl', params: [shock: '-10%']]])      || "Parameter 'shock' of field instance 'shock10' must be a number, got '-10%'"
        'instance shadows a field'  | positions([[name: 'mktVal', field: 'shockedPnl', params: [shock: -0.1]]])         || "Field instance 'mktVal' has the name of a field in dataset 'positions'"
        'duplicate field'           | positions(['sector', 'sector'])                                                   || "Field 'sector' is requested more than once"
        'filter on unknown field'   | positions(['sector']) + [filter: [field: 'colour', op: '=', value: 'red']]        || "Filter names unknown field 'colour' in dataset 'positions'"
        'malformed filter'          | positions(['sector']) + [filter: [field: 'sector', op: 'near', value: 'x']]       || 'Invalid filter'
    }

    private static Map positions(List fields) {
        [dataset: 'positions', params: [asOf: '2026-11-18'], fields: fields]
    }
}
