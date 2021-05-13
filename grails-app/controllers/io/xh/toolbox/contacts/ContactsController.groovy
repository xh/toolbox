package io.xh.toolbox.contacts

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['APP_READER'])
class ContactsController extends BaseController {

    def configService

    def index() {
        renderJSON(configService.getList('contacts'))
    }
}
