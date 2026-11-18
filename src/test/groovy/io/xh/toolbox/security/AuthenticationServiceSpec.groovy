package io.xh.toolbox.security

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import grails.testing.web.GrailsWebUnitTest
import io.xh.hoist.test.HoistUnitTest
import io.xh.toolbox.user.User
import io.xh.toolbox.user.UserService
import spock.lang.Specification

/**
 * Tests forms-based login in {@link AuthenticationService} within a mock web request. Toolbox's
 * own {@link UserService} is registered so that the authenticated user resolves through it.
 */
class AuthenticationServiceSpec extends Specification implements ServiceUnitTest<AuthenticationService>, DataTest, GrailsWebUnitTest, HoistUnitTest {

    Class[] getDomainClassesToMock() { [User] }

    Closure doWithSpring() {{ ->
        userService(UserService) { bean -> bean.autowire = 'byName' }
    }}

    def setup() {
        new User(email: 'alice@example.com', name: 'Alice', password: 'pw').save(flush: true, failOnError: true)
        new User(email: 'bob@example.com', name: 'Bob', password: 'pw', enabled: false).save(flush: true, failOnError: true)
    }

    def 'a valid password logs the user in for the session'() {
        expect:
        service.login(request, 'alice@example.com', 'pw')
        identityService.username == 'alice@example.com'
        identityService.user.displayName == 'Alice'
    }

    def 'login is refused for #reason'() {
        expect:
        !service.login(request, username, password)
        identityService.username == null

        where:
        reason               | username            | password
        'a wrong password'   | 'alice@example.com' | 'nope'
        'a disabled account' | 'bob@example.com'   | 'pw'
        'an unknown user'    | 'carol@example.com' | 'pw'
    }

    def 'logout always completes, leaving session cleanup to IdentityService'() {
        expect:
        service.logout()
    }

    def 'the GitHub webhook endpoint is whitelisted'() {
        expect:
        service.whitelistURIs.contains('/gitHub/webhookTrigger')
    }
}
