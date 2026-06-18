package io.xh.toolbox.contact

import grails.gorm.transactions.Transactional
import io.xh.hoist.config.AppConfig
import io.xh.hoist.exception.NotAuthorizedException
import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

import static io.xh.hoist.json.JSONSerializer.serializePretty


@AccessAll
class ContactsController extends BaseController {

    def configService

    def index() {
        renderJSON(getContacts())
    }
    /**
     * Updates the requested contact with any new values provided in the request body.
     *
     * NOTE - this is a very unusual use of the Hoist config system and would NOT be recommended
     * a production application. Configs are typically only modified interactive by users via the
     * Hoist admin console. Here we are storing example contact records in a config for convenience
     * (mainly to avoid setting up GORM objects and their DB tables). This code patches that config
     * in place, allowing the Contacts example app to demo data updates.
     */
    @Transactional
    def update(String id) {
        if (!user.isHoistAdmin) throw new NotAuthorizedException()

        def config = AppConfig.findByName('contacts'),
            contacts = getContacts(),
            patch = parseRequestJSON(safeEncode: true),
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
