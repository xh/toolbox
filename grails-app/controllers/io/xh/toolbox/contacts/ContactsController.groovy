package io.xh.toolbox.contacts

import io.xh.hoist.config.AppConfig
import io.xh.hoist.exception.NotAuthorizedException
import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

import static io.xh.hoist.json.JSONSerializer.serializePretty


@Access(['APP_READER'])
class ContactsController extends BaseController {

    def configService

    def index() {
        renderJSON(getContacts())
    }

    def update(String id) {
        if (!user.isHoistAdmin) throw new NotAuthorizedException()

        def config = AppConfig.findByName('contacts'),
            contacts = getContacts(),
            patch = request.JSON as Map,
            contactToUpdate = contacts.find{it.id == id}

        if (!contactToUpdate) throw new RuntimeException("Contact ID ${id} not found")

        contactToUpdate.putAll(patch)
        config.value = serializePretty(contacts)
        config.save()

        renderJSON(contacts)
    }

    private List<Map> getContacts() {
        configService.getList('contacts')
    }
}
