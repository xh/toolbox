package io.xh.toolbox.admin

import grails.validation.ValidationException
import io.xh.hoist.RestController
import io.xh.hoist.security.Access
import io.xh.toolbox.roadmap.Phase
import org.grails.web.json.JSONObject

@Access(['HOIST_ADMIN'])
class PhaseRestController extends RestController {

    static restTarget = Phase
    static trackChanges = true
    def create() {
        def data = request.JSON.data
        preprocessSubmit(data as JSONObject)

        def obj = restTargetVal.newInstance(data)
        try {
            doCreate(obj, data)
            noteChange(obj, 'CREATE')
            renderJSON(success:true, data:obj)
        } catch (ValidationException ex) {
            response.status = 400
            renderJSON(success:false, message:ex.message)
        }
    }

    def update() {
        def data = request.JSON.data
        preprocessSubmit(data as JSONObject)

        def obj = restTargetVal.get(data.id)
        try {
            doUpdate(obj, data)
            noteChange(obj, 'UPDATE')
            renderJSON(success:true, data:obj)
        } catch (ValidationException ex) {
            obj.discard()
            response.status = 400
            renderJSON(success:false, message:ex.message)
        }
    }
    protected void preprocessSubmit(JSONObject submit) {
        submit.lastUpdatedBy = username
    }
}
