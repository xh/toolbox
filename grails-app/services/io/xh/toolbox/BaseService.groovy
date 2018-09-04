package io.xh.toolbox

import groovy.util.logging.Slf4j

@Slf4j
abstract class BaseService extends io.xh.hoist.BaseService {

    protected final static SEPARATOR = '>>'

    protected final static operatorAliases = [
            eq: '=',
            gt: '>',
            ge: '>=',
            lt: '<',
            le: '<='
    ]

    protected final static propertyAliases = [
            traderName: 't.name',
            traderGroup: 'c.name',
            traderGroupType: 'c.cohort_type',
            instrumentSymbol: 'i.symbol',
            instrumentName: 'i.name',
            instrumentSector: 'i.sector',
            instrumentIndustry: 'i.industry',
            orderType: 'o.order_type',
            dateCreated: 'o.date_created_int',
            status: 'o.status',
            direction: 'o.direction',
            quantity: 'o.quantity'
    ]

    protected static String getNextGroupBy(String drillDownKey, String drillDownPath) {
        def keyParts = drillDownKey ? drillDownKey.split(SEPARATOR).toList() : [],
            pathParts = drillDownPath.split(SEPARATOR).toList(),
            keySize = keyParts.size(),
            pathSize = pathParts.size()

        return (pathSize - 1) >= keySize ? pathParts[keySize] : null
    }

    protected static Map<String, Object> buildFilterMap(String drillDownKey, String drillDownPath) {
        def keyParts = drillDownKey ? drillDownKey.split(SEPARATOR).toList() : [],
            pathParts = drillDownPath.split(SEPARATOR).toList(),
            ret = [:]

        keyParts.eachWithIndex{it, idx ->
            ret[pathParts[idx]] = it
        }

        return ret
    }

}
