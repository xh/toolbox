package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.exception.HttpException
import io.xh.hoist.http.JSONClient
import org.apache.hc.client5.http.classic.methods.HttpGet
import static org.apache.hc.core5.http.HttpStatus.SC_OK

class RecallsService extends BaseService {

    def configService

    Integer lastResponseCode
    private JSONClient _jsonClient

    List fetchRecalls(String searchQuery) {
        def host = configService.getString('recallsHost'),
            uri = !searchQuery ?
                // `_exists_:openfda` ensures all search hits includes a nested openfda object that contains essential data for frontend
                "https://$host/drug/enforcement.json?search=_exists_:openfda&sort=recall_initiation_date:desc&limit=99" :
                "https://$host/drug/enforcement.json?search=($searchQuery)+AND+_exists_:openfda&sort=recall_initiation_date:desc&limit=99"

        try {
            def response = client.executeAsMap(new HttpGet(uri))
            lastResponseCode = SC_OK
            return response.results ?: []
        } catch (HttpException e) {
            lastResponseCode = e.statusCode
            if (e.statusCode == 404) return []
            throw e
        } catch (Exception e) {
            lastResponseCode = null
            throw e
        }
    }


    //------------------------
    // Implementation
    //------------------------
    private JSONClient getClient() {
        _jsonClient = _jsonClient ?: new JSONClient()
    }

    void clearCaches() {
        _jsonClient = null
        super.clearCaches()
    }

    Map getAdminStats() {[
        config: configForAdminStats('recallsHost'),
        lastResponseCode: lastResponseCode
    ]}
}
