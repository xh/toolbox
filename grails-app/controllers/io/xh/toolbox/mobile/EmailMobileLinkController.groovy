package io.xh.toolbox.mobile

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

import javax.mail.AuthenticationFailedException


@Access(['APP_READER'])
class EmailMobileLinkController extends BaseController {

    def emailService

    /**
     * Sends an email with the link to the Toolbox Mobile Site to the currently logged in user.
     */
    def send() {
        try {
            emailService.sendEmail([
                    to: user.email,
                    subject: 'Your Link to the Toolbox Mobile Site',
                    html: """
                        Click <a href="https://toolbox-dev.xh.io/mobile">here</a> from your mobile device to launch the 
                        Toolbox Mobile Site.
                    """
            ])
            renderJSON([email: user.email, success: true])
        } catch(Exception e) {
            logErrorCompact('Something went wrong.', e)
            renderJSON([email: user.email, success: false])
        }
    }
}
