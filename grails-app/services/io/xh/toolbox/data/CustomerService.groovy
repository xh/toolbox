package io.xh.toolbox.data

import groovy.json.JsonSlurper
import io.xh.hoist.BaseService

class CustomerService extends BaseService {

    private List<Map> allCustomers = loadCustomersFromFile()

    List<Map> queryCustomers(String query) {
        if (!query) return allCustomers

        def q = query.toUpperCase()
        return allCustomers.findAll {
            it.name.toUpperCase().startsWith(q) || it.city.toUpperCase().startsWith(q)
        }
    }

    //------------------------
    // Implementation
    //------------------------

    private List<Map> loadCustomersFromFile() {
        def file = new File("grails-app/services/io/xh/toolbox/data/CompanyTrades.json")
        def input = (new JsonSlurper()).parseText(file.text)
        def ret = input.collect {
            [
                    id      : it.id,
                    name    : it.company,
                    city    : it.city,
                    isActive: (it.id % 3 != 0)
            ]
        }
        return ret.unique { it.name }
    }

    void clearCaches() {
        super.clearCaches()
        allCustomers = loadCustomersFromFile()
    }

}
