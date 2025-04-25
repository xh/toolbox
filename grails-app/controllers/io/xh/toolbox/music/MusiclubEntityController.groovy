package io.xh.toolbox.music

import grails.validation.ValidationException
import io.xh.hoist.RestController
import io.xh.hoist.security.Access

@Access(['MANAGE_MUSIC_CLUB_MEETING'])
class MusiclubEntityController extends RestController {

    static restTarget = MbEntity

    def create() {
        MbEntity.withTransaction {
            def data = parseRequestJSON().data
            preprocessSubmit(data)

            def obj = MbEntity.newInstance(data)
            doCreate(obj, data)
            noteChange(obj, 'CREATE')
            renderJSON(data: obj.formatForAdminJSON())
        }
    }

    def read() {
        MbEntity.withTransaction {
            def ret = params.id ? [MbEntity.get(params.id)] : MbEntity.list()
            renderJSON(data: ret*.formatForAdminJSON())
        }
    }


    def update() {
        MbEntity.withTransaction {
            def data = parseRequestJSON().data
            preprocessSubmit(data)

            def obj = MbEntity.get(data.id)
            try {
                doUpdate(obj, data)
                noteChange(obj, 'UPDATE')
                renderJSON(data: obj.formatForAdminJSON())
            } catch (ValidationException ex) {
                obj.discard()
                throw ex
            }
        }
    }


}
