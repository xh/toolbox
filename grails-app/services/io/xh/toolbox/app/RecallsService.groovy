package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSON

class RecallsService extends BaseService {

    /*
        FDA Drug Recall API notes:
        -   `_exists_:field` is useful for openfda;
            _exists_ is true for *empty object*
     */



    List fetchRecalls() {
        def host = configService.getString('recallsHost')

        def url = new URL("https://api.fda.gov/drug/enforcement.json?search=_exists_:openfda&sort=recall_initiation_date:desc&limit=99"),
            response = JSON.parse(url.openStream(), 'UTF-8')

        return response.results
    }

    List fetchSearch(drugName) {
        def host = configService.getString('recallsHost'),
            url = new URL("https://api.fda.gov/drug/enforcement.json?search=" +
                    "openfda.generic_name:${drugName}+openfda.brand_name:${drugName}&sort=recall_initiation_date:desc&limit=99"),
            connection = url.openConnection()

        if (connection.responseCode == 404) {
            return [];
        } else {
            return JSON.parse(connection.getInputStream(), 'UTF-8').results
        }
    }

    def configService
}
