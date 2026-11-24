package io.xh.toolbox.blueprints

import spock.lang.Specification

import java.time.Instant

class BlueprintSessionSpec extends Specification {

    private static BlueprintResult result(List<Map> rows, List<Map> aggregates = null) {
        new BlueprintResult(rows: rows, aggregates: aggregates)
    }

    private static BlueprintSession session(List<Map> rows, List<Map> aggregates = null, List groupBy = []) {
        new BlueprintSession('ch', 'tp', 'ann', new BlueprintRequest(groupBy: groupBy), result(rows, aggregates), Instant.now())
    }

    def 'updates diff fresh rows against the rows last sent, by id'() {
        given:
        def s = session([[id: 'a', v: 1], [id: 'b', v: 2], [id: 'c', v: 3]])

        expect:
        s.id == 'ch||tp'
        s.update(result([[id: 'a', v: 1], [id: 'b', v: 2], [id: 'c', v: 3]])) == null
        s.update(result([[id: 'a', v: 1], [id: 'b', v: 20], [id: 'd', v: 4]])) == [
            add: [[id: 'd', v: 4]],
            update: [[id: 'b', v: 20]],
            remove: ['c']
        ]
        s.update(result([[id: 'a', v: 1], [id: 'b', v: 20], [id: 'd', v: 4]])) == null
    }

    def 'updates carry the aggregates that changed, new groups included, with the row changes'() {
        given:
        def rows = [[id: 'a', v: 1]]
        def s = session(rows, [[dims: [:], values: [var95: 10]], [dims: [fund: 'X'], values: [var95: 10]]], [[], ['fund']])

        expect: 'unchanged'
        s.update(result(rows, [[dims: [:], values: [var95: 10]], [dims: [fund: 'X'], values: [var95: 10]]])) == null

        and: 'an aggregate changes with no row change'
        s.update(result(rows, [[dims: [:], values: [var95: 12]], [dims: [fund: 'X'], values: [var95: 10]], [dims: [fund: 'Y'], values: [var95: 2]]])) == [
            add: [], update: [], remove: [],
            aggregates: [[dims: [:], values: [var95: 12]], [dims: [fund: 'Y'], values: [var95: 2]]]
        ]

        and: 'rows and aggregates in one message'
        s.update(result([[id: 'a', v: 2]], [[dims: [:], values: [var95: 13]], [dims: [fund: 'X'], values: [var95: 10]], [dims: [fund: 'Y'], values: [var95: 2]]])) == [
            add: [], update: [[id: 'a', v: 2]], remove: [],
            aggregates: [[dims: [:], values: [var95: 13]]]
        ]
    }

    def 'added sets join the pushes, with their values as the baseline'() {
        given:
        def s = session([[id: 'a', v: 1]], [[dims: [:], values: [var95: 10]]], [[]])

        when:
        s.addSets([['fund'], []], [[dims: [fund: 'X'], values: [var95: 4]]])

        then:
        s.sets == [[], ['fund']]
        s.update(result([[id: 'a', v: 1]], [[dims: [:], values: [var95: 10]], [dims: [fund: 'X'], values: [var95: 4]]])) == null
    }
}
