import {HoistService} from '@xh/hoist/core';
import {start} from '@xh/hoist/promise';
import {computed, observable, runInAction} from '@xh/hoist/mobx';
import {companyTrades} from '../data/';
import {shuffle, take, uniqBy} from 'lodash';

@HoistService()
export class CompanyService {

    @observable.ref
    allCompanies = [];

    @computed
    get randomCompanies() {
        return take(shuffle(this.allCompanies), 100);
    }

    initAsync() {
        return start(() => {
            const companies = companyTrades.map(it => ({name: it.company, city: it.city}));
            runInAction(() => this.allCompanies = uniqBy(companies, 'name'));
        });
    }

    queryAsync(query) {
        return start(() => {
            if (!query) return [];

            query = query.toUpperCase();
            return this.allCompanies.filter(it => {
                return it.name.toUpperCase().startsWith(query) || it.city.toUpperCase().startsWith(query);
            });
        });
    }

}