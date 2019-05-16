import {HoistService} from '@xh/hoist/core';
import {DAYS} from '@xh/hoist/utils/datetime';
import {fmtCalendarDate} from '@xh/hoist/format';
import {companyTrades} from '../data/';
import {cloneDeep} from 'lodash';

@HoistService
export class TradeService {

    generateTrades() {
        const trades = cloneDeep(companyTrades),
            dateRange = DAYS * 30;

        trades.forEach(it => {
            it.profit_loss = Math.round(it.profit_loss * Math.random());
            it.trade_volume = it.trade_volume * 1000000;
            it.active = it.trade_volume % 6 == 0;
            it.tradeDate = fmtCalendarDate(new Date(Date.now() - Math.random() * dateRange));
        });

        return trades;
    }

}