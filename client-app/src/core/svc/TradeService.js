import {HoistService} from '@xh/hoist/core';
import {start} from '@xh/hoist/promise';
import {observable, runInAction} from '@xh/hoist/mobx';
import {companyTrades} from '../data/';
import {cloneDeep} from 'lodash';

@HoistService()
export class TradeService {

    @observable.ref
    allTrades = [];

    initAsync() {
        return start(() => {
            const trades = cloneDeep(companyTrades);

            trades.forEach(it => {
                it.trade_volume = it.trade_volume * 1000000;
                it.active = it.trade_volume % 6 == 0;
            });

            runInAction(() => this.allTrades = trades);
        });
    }

}