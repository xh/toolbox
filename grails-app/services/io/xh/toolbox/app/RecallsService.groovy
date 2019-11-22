package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSON

class RecallsService extends BaseService {

    def configService

    //last time we tried to fetch data, did we successfully connect to the server?
    def connectedSuccessfully;
    //last HTTP code from the server
    def lastResponseCode;
    //have we tried to fetch data so far in the lifetime of the server?
    def doneFetch = false;

    List fetchRecalls(String searchQuery) {
        connectedSuccessfully = true;
        doneFetch = true;

        def host = configService.getString('recallsHost'),
            url = !searchQuery ?
                // `_exists_:openfda` ensures all search hits includes a nested openfda object that contains essential data for frontend
                new URL("https://$host/drug/enforcement.json?search=_exists_:openfda&sort=recall_initiation_date:desc&limit=99") :
                new URL("https://$host/drug/enforcement.json?search=($searchQuery)+AND+_exists_:openfda&sort=recall_initiation_date:desc&limit=99")

        def connection = url.openConnection(),
            inputStream = null
        try {
            lastResponseCode = connection.responseCode
            if (connection.responseCode == 404) {
                return []
            } else {
                inputStream = connection.getInputStream()
                return JSON.parse(inputStream, 'UTF-8').results
            }
        } catch (IOException e) {
            //we got an exception, so our connection was not successful.
            connectedSuccessfully = false;
            return []
        } finally {
            inputStream?.close()
        }
    }
}
