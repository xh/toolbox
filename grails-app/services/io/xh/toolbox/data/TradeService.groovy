package io.xh.toolbox.data

import groovy.util.logging.Slf4j
import io.xh.hoist.BaseService
import io.xh.hoist.json.JSONParser

import java.time.LocalDate

@Slf4j
class TradeService extends BaseService {

    private Map trades

    void init() {
        trades = loadTradesFromFile()
        super.init()
    }

    Map getTrades() {
        return trades
    }


    //------------------------
    // Implementation
    //------------------------
    private Map loadTradesFromFile() {
        def ret = [:]
        try {
            def mockData = applicationContext.getResource('classpath:MockTradesData.json'),
                trades = JSONParser.parseArray(mockData.inputStream),
                dateRange = 30

            trades.each {it ->
                it.profit_loss = Math.round(it.profit_loss * Math.random())
                it.trade_volume = it.trade_volume * 1000000
                it.active = it.trade_volume.toBigInteger() % 6 == 0
                it.trade_date = LocalDate.now().minusDays(Math.round(dateRange * Math.random()))
            }

            ret = [
                trades: trades,
                summary: [
                    id          : 'summary',
                    profit_loss : trades.sum { it.profit_loss },
                    trade_volume: trades.sum { it.trade_volume }
                ]
            ]
        } catch (Exception e) {
            log.error("Failure loading mock data | ${e.message}")
        }

        return ret
    }

    void clearCaches() {
        super.clearCaches()
        trades = loadTradesFromFile()
    }
}

