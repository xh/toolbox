package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.http.JSONClient
import org.apache.http.client.methods.HttpGet

class RecallsService extends BaseService {

    def configService
    private JSONClient _jsonClient

    List fetchRecalls(String searchQuery) {
        def host = configService.getString('recallsHost'),
            uri = !searchQuery ?
                // `_exists_:openfda` ensures all search hits includes a nested openfda object that contains essential data for frontend
                "https://$host/drug/enforcement.json?search=_exists_:openfda&sort=recall_initiation_date:desc&limit=99" :
                "https://$host/drug/enforcement.json?search=($searchQuery)+AND+_exists_:openfda&sort=recall_initiation_date:desc&limit=99"

        def results
        try {
            def response = client.executeAsJSONObject(new HttpGet(uri))
            results = response.results || []
        } catch (e) {
            // TODO - this is unfortunate, and ideally something we could extract in a structured way from the exception thrown out of JSONClient.
            if (e.message.endsWith('404')) {
                results = []
            } else {
                throw e
            }
        }

        return results
    }


    //------------------------
    // Implementation
    //------------------------
    private JSONClient getClient() {
        if (!_jsonClient) {
            _jsonClient = new JSONClient()
        }
        return _jsonClient
    }

    void clearCaches() {
        _jsonClient = null
        super.clearCaches()
    }

}
