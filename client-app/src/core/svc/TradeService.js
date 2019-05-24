import {HoistService} from '@xh/hoist/core';
import {companyTrades} from '../data/';
import {cloneDeep, sumBy} from 'lodash';

@HoistService
export class TradeService {

    generateTrades(includeSummary) {
        const trades = cloneDeep(companyTrades);

        trades.forEach(it => {
            it.profit_loss = Math.round(it.profit_loss * Math.random());
            it.trade_volume = it.trade_volume * 1000000;
            it.active = it.trade_volume % 6 == 0;
        });

        if (includeSummary) {
            trades.push({
                id: 'summary',
                profit_loss: sumBy(trades, 'profit_loss'),
                trade_volume: sumBy(trades, 'trade_volume')
            });
        }

        return trades;
    }

}