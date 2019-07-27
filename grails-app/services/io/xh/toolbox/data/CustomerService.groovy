package io.xh.toolbox.data

import groovy.json.JsonSlurper
import groovy.util.logging.Slf4j
import io.xh.hoist.BaseService

@Slf4j
class CustomerService extends BaseService {

    private List<Map> allCustomers

    void init() {
        allCustomers = loadCustomersFromFile()
        super.init()
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
            ret = new JsonSlurper().parse(mockData.inputStream)
            ret.each{it -> it.isActive = (it.id % 3 != 0)}
            ret = ret.unique{it.company}
        } catch (Exception e) {
            log.error("Failure loading mock data | ${e.message}")
        }

        return ret
    }

    void clearCaches() {
        super.clearCaches()
        allCustomers = loadCustomersFromFile()
    }

}
