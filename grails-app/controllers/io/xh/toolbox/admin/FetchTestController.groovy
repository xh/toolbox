package io.xh.toolbox.admin

import grails.converters.JSON
import io.xh.toolbox.BaseController
import io.xh.hoist.security.Access



@Access(['HOIST_ADMIN'])
class FetchTestController extends BaseController {

    def index() {
        def status = params['status'],
            statusInt = status.toInteger()

        switch(status[0]) {
            case '1':
            respond(status: statusInt)
                switch(statusInt) {
                    case 100:
                        respond(null, status: statusInt)
                    break
                }
                break;
            case '2':
                respond(status: statusInt)
                def responseData = [
                    'outcome': 'good',
                    'requestedStatus':  status
                ]
                render responseData as JSON
            break
            case '3':
                response.setStatus(statusInt)
                response.setHeader('Location', "/fetchTest/redirected?status=${status}")
                def responseData = [
                    'outcome': 'redirecting...',
                    'requestedStatus':  status
                ]
                render responseData as JSON
            break
            case '4':
            case '5':
                response.setStatus(statusInt)
                def responseData = [
                    'outcome': 'error - as expected',
                    'requestedStatus':  status
                ]
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