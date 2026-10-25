package io.xh.toolbox.user

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import io.xh.hoist.test.HoistUnitTest
import io.xh.toolbox.security.TokenValidationResult
import spock.lang.Specification

/** Tests {@link UserService} against an in-memory {@link User} table. */
class UserServiceSpec extends Specification implements ServiceUnitTest<UserService>, DataTest, HoistUnitTest {

    Class[] getDomainClassesToMock() { [User] }

    def setup() {
        new User(email: 'alice@example.com', name: 'Alice', password: 'pw').save(flush: true, failOnError: true)
        new User(email: 'bob@example.com', name: 'Bob', enabled: false).save(flush: true, failOnError: true)
    }

    def 'users are keyed by email and listed with or without disabled accounts'() {
        expect:
        service.find('alice@example.com').name == 'Alice'
        service.find('nobody@example.com') == null
        service.list(false)*.email.toSet() == ['alice@example.com', 'bob@example.com'] as Set
        service.list(true)*.email == ['alice@example.com']
    }

    def 'a first login from an ID token creates the user and notifies the configured recipients'() {
        given:
        testConfigService.set('newUserNotificationRecipients', 'admins@example.com')

        when:
        def user = service.getOrCreateFromTokenResult(new TokenValidationResult(email: 'carol@example.com', name: 'Carol', picture: 'http://pic'))

        then:
        user.id != null
        user.username == 'carol@example.com'
        user.profilePicUrl == 'http://pic'
        User.count() == 3

        and:
        with(testEmailService.lastSent) {
            to == ['admins@example.com']
            subject == 'New Toolbox user created: carol@example.com'
            html.contains('carol@example.com')
            async == true
        }
    }

    def 'no notification is sent when no recipients are configured'() {
        when:
        service.getOrCreateFromTokenResult(new TokenValidationResult(email: 'carol@example.com', name: 'Carol'))

        then:
        User.count() == 3
        testEmailService.sent.isEmpty()
    }

    def 'a returning user is updated from the token only when something changed'() {
        when:
        def unchanged = service.getOrCreateFromTokenResult(new TokenValidationResult(email: 'alice@example.com', name: 'Alice'))

        then:
        unchanged.name == 'Alice'
        User.count() == 2

        when:
        def updated = service.getOrCreateFromTokenResult(new TokenValidationResult(email: 'alice@example.com', name: 'Alice Smith', picture: 'http://new'))

        then:
        updated.name == 'Alice Smith'
        updated.profilePicUrl == 'http://new'
        User.count() == 2
        testEmailService.sent.isEmpty()
    }

    def 'passwords are stored encrypted and checked, never for OAuth-only users'() {
        expect:
        service.find('alice@example.com').password != 'pw'
        service.find('alice@example.com').checkPassword('pw')
        !service.find('alice@example.com').checkPassword('wrong')
        !service.find('bob@example.com').checkPassword('')
    }
}
