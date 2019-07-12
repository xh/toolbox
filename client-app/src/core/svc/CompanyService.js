import {HoistService} from '@xh/hoist/core';
import {start} from '@xh/hoist/promise';
import {computed, observable, runInAction} from '@xh/hoist/mobx';
import {companyTrades} from '../data/';
import {shuffle, take, uniqBy} from 'lodash';

@HoistService
export class CompanyService {

    @observable.ref
    allCompanies = [];

    @computed
    get randomCompanies() {
        return take(shuffle(this.allCompanies), 100);
    }

    async initAsync() {
        return start(() => {
            const companies = companyTrades.map(it => {
                return {
                    id: it.id,
                    name: it.company,
                    city: it.city,
                    isActive: it.id % 3 != 0
                };
            });

            runInAction(() => this.allCompanies = uniqBy(companies, 'name'));

        });
    }

    async queryAsync(query) {
        return start(() => {
            if (!query) return this.allCompanies;

            query = query.toUpperCase();
            return this.allCompanies.filter(it => {
                return it.name.toUpperCase().startsWith(query) || it.city.toUpperCase().startsWith(query);
            });
        });
    }

}