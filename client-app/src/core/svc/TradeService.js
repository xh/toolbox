import {HoistService} from '@xh/hoist/core';
import {companyTrades} from '../data/';
import {cloneDeep} from 'lodash';

@HoistService
export class TradeService {

    generateTrades() {
        const trades = cloneDeep(companyTrades);

        trades.forEach(it => {
            it.profit_loss = Math.round(it.profit_loss * Math.random());
            it.trade_volume = it.trade_volume * 1000000;
            it.active = it.trade_volume % 6 == 0;
        });
        return trades;
    }

}