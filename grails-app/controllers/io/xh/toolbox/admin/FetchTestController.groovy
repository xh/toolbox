package io.xh.toolbox.admin

import grails.converters.JSON
import io.xh.toolbox.BaseController
import io.xh.hoist.security.Access


@Access(['HOIST_ADMIN'])
class FetchTestController extends BaseController {

    def index() {
        def status = params.status,
            statusInt = status.toInteger(),
            responseData = [requestedStatus:  status]

        response.status = statusInt

        switch(status[0]) {
            case '1':
                // not quite right for the 1XX
                // but maybe not worth figuring out right now
                responseData.put('outcome', 'good')
            break
            case '2':
                responseData.put('outcome', 'good')
            break
            case '3':
                response.setHeader('Location', "/fetchTest/redirected?status=${status}")
                responseData.put('outcome', 'redirecting...')
            break
            case '4':
            case '5':
                responseData.put('outcome', 'error - as expected')
            break
        }
        renderJSON(responseData)
    }

    def redirected() {
        def status = params['status']
        def responseData = [
            'outcome': 'redirect complete',
            'requestedStatus':  status
        ]
        renderJSON(responseData)
    }


}