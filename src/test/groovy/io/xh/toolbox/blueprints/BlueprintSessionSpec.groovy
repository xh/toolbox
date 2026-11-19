package io.xh.toolbox.blueprints

import spock.lang.Specification

import java.time.Instant

class BlueprintSessionSpec extends Specification {

    def 'updates diff fresh rows against the rows last sent, by id'() {
        given:
        def session = new BlueprintSession('ch', 'tp', null, [[id: 'a', v: 1], [id: 'b', v: 2], [id: 'c', v: 3]], Instant.now())

        expect:
        session.id == 'ch||tp'
        session.update([[id: 'a', v: 1], [id: 'b', v: 2], [id: 'c', v: 3]]) == null
        session.update([[id: 'a', v: 1], [id: 'b', v: 20], [id: 'd', v: 4]]) == [
            add: [[id: 'd', v: 4]],
            update: [[id: 'b', v: 20]],
            remove: ['c']
        ]
        session.update([[id: 'a', v: 1], [id: 'b', v: 20], [id: 'd', v: 4]]) == null
    }
}
