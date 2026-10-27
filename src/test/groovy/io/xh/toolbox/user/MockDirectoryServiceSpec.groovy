package io.xh.toolbox.user

import grails.testing.services.ServiceUnitTest
import io.xh.hoist.test.HoistUnitTest
import spock.lang.Specification

/** Tests {@link MockDirectoryService} over the `mockDirectoryGroups` soft config. */
class MockDirectoryServiceSpec extends Specification implements ServiceUnitTest<MockDirectoryService>, HoistUnitTest {

    def setup() {
        testConfigService.set('mockDirectoryGroups', [
            devs : ['dave@example.com', 'erin@example.com'],
            admins: ['alice@example.com'],
        ])
    }

    def 'is always enabled, so the Roles UI stays live without a real directory'() {
        expect:
        service.enabled
        service.directoryGroupsDescription
    }

    def 'resolves configured groups, treats unknown names as empty, and simulates one failure'() {
        when:
        def result = service.loadUsersForDirectoryGroups(['devs', 'unknown', 'sim_error'] as Set, strict)

        then:
        result.devs.success
        result.devs.value == ['dave@example.com', 'erin@example.com'] as Set
        result.unknown.success
        result.unknown.value.isEmpty()
        !result.sim_error.success
        result.sim_error.error.contains('simulated error')

        where:
        strict << [true, false]
    }

    def 'describes groups by name and searches them case-insensitively'() {
        expect:
        service.describeDirectoryGroups(['devs', 'sim_error'] as Set).devs.value == [displayName: 'devs']
        !service.describeDirectoryGroups(['sim_error'] as Set).sim_error.success
        service.searchDirectoryGroups('DEV') == [[id: 'devs', displayName: 'devs']]
        service.searchDirectoryGroups('zzz').isEmpty()
    }

    def 'works with no config at all'() {
        given:
        testConfigService.remove('mockDirectoryGroups')

        expect:
        service.loadUsersForDirectoryGroups(['devs'] as Set, false).devs.value.isEmpty()
        service.searchDirectoryGroups('d').isEmpty()
        service.adminStats.groupCount == 0
    }
}
