package io.xh.toolbox.data

import groovy.json.JsonSlurper
import io.xh.hoist.BaseService

class SalesService extends BaseService {

    private List<Map> sales = loadSalesFromFile()

    List<Map> getSales() {
        return sales
    }

    //------------------------
    // Implementation
    //------------------------

    private List<Map> loadSalesFromFile() {
        def file = new File('grails-app/services/io/xh/toolbox/data/SalesFigures.json')
        def ret = (new JsonSlurper()).parseText(file.text)
        ret.each { it ->
            it.salary = Math.round(it.salary / 100) * 100
            it.retain = (it.actualGross > it.projectedGross) || (it.salary < 90000)
        }
        return ret
    }

    void clearCaches() {
        super.clearCaches()
        sales = loadSalesFromFile()
    }
}
