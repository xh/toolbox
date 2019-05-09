package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSON

class RecallsService extends BaseService {

    def configService

    List fetchRecalls(String searchQuery) {
        def host = configService.getString('recallsHost'),
            url = !searchQuery ?
                // `_exists_:openfda` ensures all search hits includes a nested openfda object that contains essential data for frontend
                new URL("https://$host/drug/enforcement.json?search=_exists_:openfda&sort=recall_initiation_date:desc&limit=99") :
                new URL("https://$host/drug/enforcement.json?search=($searchQuery)+AND+_exists_:openfda&sort=recall_initiation_date:desc&limit=99")

        def connection = url.openConnection(),
            inputStream = null
        try {
            if (connection.responseCode == 404) {
                return []
            } else {
                inputStream = connection.getInputStream()
                return JSON.parse(inputStream, 'UTF-8').results
            }
        } finally {
            inputStream?.close()
        }

    }


}
