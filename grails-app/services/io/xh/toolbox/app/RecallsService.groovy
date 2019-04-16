package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSON

class RecallsService extends BaseService {

    def configService

    List fetchRecalls() {
        def host = configService.getString('recallsHost')

        log.info(host)
        def url = new URL("https://$host/drug/enforcement.json?search=losartan&sort=recall_initiation_date:desc&limit=10"),
            response = JSON.parse(url.openStream(), 'UTF-8')

        log.info(response)
        return response
    }
}
