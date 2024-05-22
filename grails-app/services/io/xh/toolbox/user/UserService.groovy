package io.xh.toolbox.user

import io.xh.hoist.email.EmailService
import grails.gorm.transactions.ReadOnly
import grails.gorm.transactions.Transactional
import io.xh.hoist.user.BaseUserService
import io.xh.hoist.util.Utils
import io.xh.toolbox.security.TokenValidationResult

class UserService extends BaseUserService {

    EmailService emailService

    @ReadOnly
    List<User> list(boolean activeOnly) {
        return activeOnly ? User.findAllByEnabled(true) : User.list()
    }

    @ReadOnly
    User find(String username) {
        return User.findByEmail(username)
    }

    /**
     * Given (successful) output of ID token validation, looks up / creates a Toolbox User and
     * ensures the minimal set of properties we extract from the token are up-to-date.
     *
     * Note that Toolbox users are keyed by email, and we respect that here. If an existing user
     * changes their email within a source system (Google, Github, etc) used for OAuth, they will
     * get a new user here in Toolbox. Likewise if a user has the same email registered across
     * multiple source systems, they can use any one of them interchangeably to login to their
     * Toolbox user account.
     *
     * A more typical (but complicated) implementation would use the `sub` attribute on the ID
     * token to uniquely identify a social login and allow for a single app user account to be
     * explicitly linked/registered to multiple social providers. That's overkill for Toolbox.
     */
    @Transactional
    User getOrCreateFromTokenResult(TokenValidationResult tokenResult) {
        def email = tokenResult.email,
            name = tokenResult.name,
            profilePicUrl = tokenResult.picture,
            user = User.findByEmail(email)

        if (!user) {
            user = new User(
                email: email,
                name: name,
                profilePicUrl: profilePicUrl
            ).save()
            notifyOnUserCreated(user)
            logInfo('Created new user from JWT', email)
        } else if (user.name != name || user.profilePicUrl != profilePicUrl) {
            user.name = name
            user.profilePicUrl = profilePicUrl
            user = user.save()
        }

        return user
    }

    private void notifyOnUserCreated(User newUser) {
        def to = emailService.parseMailConfig('newUserNotificationRecipients')
        if (to) {
            emailService.sendEmail(
                to: to,
                subject: "New Toolbox user created: ${newUser.username}",
                html: """
                    A new user has signed into Toolbox (${Utils.appEnvironment.toString()}): <br>
                    Email: ${newUser.email}<br>
                    Name: ${newUser.name}<br><br>
                    Sincerely, Toolbox Notification Bot
                """,
                async: true
            )
        }
    }
}
