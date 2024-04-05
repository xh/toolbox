package io.xh.toolbox.data

import io.xh.hoist.BaseService
import io.xh.hoist.json.JSONParser

class SalesService extends BaseService {

    private List<Map> sales

    void init() {
        sales = loadSalesFromFile()
    }

    List<Map> getSales() {
        return sales
    }


    //------------------------
    // Implementation
    //------------------------
    private List<Map> loadSalesFromFile() {
        def ret = []
        try {
            def mockData = applicationContext.getResource('classpath:MockSalesData.json')
            ret = JSONParser.parseArray(mockData.inputStream)

            ret.each { it ->
                it.salary = Math.round(it.salary / 100) * 100
                it.retain = (it.actualGross > it.projectedGross) || (it.salary < 90000)
            }
        } catch (Exception e) {
            logError('Failure loading mock data', e)
        }


        return ret
    }

    void clearCaches() {
        super.clearCaches()
        sales = loadSalesFromFile()
    }
}
