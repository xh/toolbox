package io.xh.toolbox.data

import groovy.json.JsonSlurper
import io.xh.hoist.BaseService

class TradeService extends BaseService {

    private Map trades = loadTradesFromFile()

    Map getTrades() {
        return trades
    }

    //------------------------
    // Implementation
    //------------------------

    private Map loadTradesFromFile() {
        def file = new File('grails-app/services/io/xh/toolbox/data/CompanyTrades.json')
        def input = (new JsonSlurper()).parseText(file.text)
        input.each { it ->
            it.profit_loss = Math.round(it.profit_loss * Math.random())
            it.trade_volume = it.trade_volume * 1000000
            it.active = it.trade_volume.toBigInteger() % 6 == 0
        }
        return [
                trades : input,
                summary: [
                        id          : 'summary',
                        profit_loss : input.sum { it.profit_loss },
                        trade_volume: input.sum { it.trade_volume }
                ]
        ]
    }

    void clearCaches() {
        super.clearCaches()
        trades = loadTradesFromFile()
    }
}

