import {HoistService} from '@xh/hoist/core';
import {start} from '@xh/hoist/promise';
import {computed, observable, runInAction} from '@xh/hoist/mobx';
import {companyTrades} from '../data/';
import {cloneDeep, shuffle, take} from 'lodash';

@HoistService()
export class TradeService {

    @observable.ref
    allTrades = [];

    @computed
    get randomCompanies() {
        const companyData = this.allTrades.map(it => ({name: it.company, city: it.city}));
        return take(shuffle(companyData), 100);
    }

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