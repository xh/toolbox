package io.xh.toolbox.data

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSONParser

class CustomerService extends BaseService {

    private List<Map> allCustomers

    void init() {
        allCustomers = loadCustomersFromFile()
    }

    List<Map> queryCustomers(String query) {
        if (!query) return allCustomers

        def q = query.toUpperCase()
        return allCustomers.findAll {
            it.company.toUpperCase().startsWith(q) || it.city.toUpperCase().startsWith(q)
        }
    }


    //------------------------
    // Implementation
    //------------------------
    private List<Map> loadCustomersFromFile() {
        def ret = []
        try {
            def mockData = applicationContext.getResource('classpath:MockTradesData.json')
            ret = JSONParser.parseArray(mockData.inputStream)
            ret.each{it -> it.isActive = (it.id % 3 != 0)}
            ret = ret.unique{it.company}
        } catch (Exception e) {
            logError('Failure loading mock data', e)
        }

        return ret
    }

    void clearCaches() {
        allCustomers = loadCustomersFromFile()
        super.clearCaches()
    }

}
