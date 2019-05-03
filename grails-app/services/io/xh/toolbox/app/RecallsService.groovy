package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSON

class RecallsService extends BaseService {

    def configService

    /*
        FDA Drug Recall API notes:
        -   `_exists_:field` is useful for openfda;
            _exists_ is true for *empty object*
     */


    List fetchRecalls(String searchQuery) {
        def host = configService.getString('recallsHost'),
            url = !searchQuery ?
                new URL("https://$host/drug/enforcement.json?search=_exists_:openfda&sort=recall_initiation_date:desc&limit=99") :
                new URL("https://$host/drug/enforcement.json?search=($searchQuery)+AND+_exists_:openfda&sort=recall_initiation_date:desc&limit=99")


        def connection = url.openConnection()
        if (connection.responseCode == 404) {
            return []
        } else {
            return JSON.parse(connection.getInputStream(), 'UTF-8').results
        }

    }


}
