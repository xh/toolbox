package io.xh.toolbox.admin

import grails.converters.JSON
import io.xh.toolbox.BaseController
import io.xh.hoist.security.Access



@Access(['HOIST_ADMIN'])
class FetchTestController extends BaseController {

    def index() {
        def status = params['status'],
            statusInt = status.toInteger(),
            responseData = ['requestedStatus':  status]

        switch(status[0]) {
            case '1':
                // not quite right for the 1XX
                // but maybe not worth figuring out right now
                response.setStatus(statusInt)
                responseData.put('outcome', 'good')
                render responseData as JSON
            break
            case '2':
                response.setStatus(statusInt)
                responseData.put('outcome', 'good')
                render responseData as JSON
            break
            case '3':
                response.setStatus(statusInt)
                response.setHeader('Location', "/fetchTest/redirected?status=${status}")
                responseData.put('outcome', 'redirecting...')
                render responseData as JSON
            break
            case '4':
            case '5':
                response.setStatus(statusInt)
                responseData.put('outcome', 'error - as expected')
                render responseData as JSON
            break
        }
    }

    def redirected() {
        def status = params['status']
        def responseData = [
            'outcome': 'redirect complete',
            'requestedStatus':  status
        ]
        render responseData as JSON
    }


}