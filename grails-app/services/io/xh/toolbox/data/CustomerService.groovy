package io.xh.toolbox.data

import groovy.json.JsonSlurper
import io.xh.hoist.BaseService

class CustomerService extends BaseService {

    private List<Map> allCustomers = loadCustomersFromFile()

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
        def file = new File("grails-app/services/io/xh/toolbox/data/CompanyTrades.json")
        def ret = (new JsonSlurper()).parseText(file.text)
        ret.each { it ->
            it.isActive = (it.id % 3 != 0)
        }
        return ret.unique { it.company }
    }

    void clearCaches() {
        super.clearCaches()
        allCustomers = loadCustomersFromFile()
    }

}
