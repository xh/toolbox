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

                // Derived fields, added to give the column-chooser demo a richer set of columns to
                // organize into groups and to hide/show via the optional Column Library. Values are
                // deterministic (hashed off the rep's name) so they stay stable across reloads.
                it.email = "${it.firstName}.${it.lastName}@sales.xh.io".toLowerCase()
                it.region = REGIONS_BY_STATE.getOrDefault(it.state as String, 'Territories')

                int hash = Math.abs("${it.firstName}${it.lastName}".hashCode())
                it.tenure = 1 + (hash % 18)
                it.commissionRate = (2 + (hash % 4)) / 100d
                it.commission = Math.round((it.actualGross as double) * (it.commissionRate as double))
            }
        } catch (Exception e) {
            logError('Failure loading mock data', e)
        }


        return ret
    }

    // US Census regions, keyed by full state name as it appears in the mock data. Territories and
    // any unmatched value fall through to a 'Territories' bucket (see getOrDefault above).
    private static final Map<String, String> REGIONS_BY_STATE = [
        // Northeast
        'Connecticut'         : 'Northeast',
        'Maine'               : 'Northeast',
        'Massachusetts'       : 'Northeast',
        'New Hampshire'       : 'Northeast',
        'Rhode Island'        : 'Northeast',
        'Vermont'             : 'Northeast',
        'New Jersey'          : 'Northeast',
        'New York'            : 'Northeast',
        'Pennsylvania'        : 'Northeast',
        // Midwest
        'Illinois'            : 'Midwest',
        'Indiana'             : 'Midwest',
        'Michigan'            : 'Midwest',
        'Ohio'                : 'Midwest',
        'Wisconsin'           : 'Midwest',
        'Iowa'                : 'Midwest',
        'Kansas'              : 'Midwest',
        'Minnesota'           : 'Midwest',
        'Missouri'            : 'Midwest',
        'Nebraska'            : 'Midwest',
        'North Dakota'        : 'Midwest',
        'South Dakota'        : 'Midwest',
        // South
        'Delaware'            : 'South',
        'Florida'             : 'South',
        'Georgia'             : 'South',
        'Maryland'            : 'South',
        'North Carolina'      : 'South',
        'South Carolina'      : 'South',
        'Virginia'            : 'South',
        'West Virginia'       : 'South',
        'District Of Columbia': 'South',
        'Alabama'             : 'South',
        'Kentucky'            : 'South',
        'Mississippi'         : 'South',
        'Tennessee'           : 'South',
        'Arkansas'            : 'South',
        'Louisiana'           : 'South',
        'Oklahoma'            : 'South',
        'Texas'               : 'South',
        // West
        'Arizona'             : 'West',
        'Colorado'            : 'West',
        'Idaho'               : 'West',
        'Montana'             : 'West',
        'Nevada'              : 'West',
        'New Mexico'          : 'West',
        'Utah'                : 'West',
        'Wyoming'             : 'West',
        'Alaska'              : 'West',
        'California'          : 'West',
        'Hawaii'              : 'West',
        'Oregon'              : 'West',
        'Washington'          : 'West'
    ]

    void clearCaches() {
        super.clearCaches()
        sales = loadSalesFromFile()
    }
}
