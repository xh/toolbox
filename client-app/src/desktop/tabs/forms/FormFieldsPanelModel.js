import {inRange} from 'lodash';
import {HoistModel} from '@xh/hoist/core';
import {computed, setter, observable} from '@xh/hoist/mobx';
import {companies, movies, usStates} from '../../../data';

@HoistModel()
export class FormFieldsPanelModel {
    @setter @observable active = null;
    @setter @observable age = null;
    @setter @observable company = null;
    @setter @observable size = null;
    @setter @observable email = null;
    @setter @observable movie = null;
    @setter @observable password = null;
    @setter @observable travelDistance = this.getRandomFrom(0, 100);
    @setter @observable salaryRange = [this.getRandomFrom(50, 70), this.getRandomFrom(110, 150)].map(val => val * 1000);
    @setter @observable state = null;
    @setter @observable user = null;
    @setter @observable verify = null;
    @setter @observable startDate = null;

    @setter @observable red = this.getRandomFrom(0, 255);
    @setter @observable green = this.getRandomFrom(0, 255);
    @setter @observable blue = this.getRandomFrom(0, 255);

    usStates = usStates;
    movies = movies;
    companies = companies;

    @computed
    get profileColor() {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    }

    @computed
    get isValid() {
        return this.validateColors() && this.validateEmail();
    }

    isFieldValid(label) {
        if (label.startsWith('Profile')) {
            return this.validateColors();
        } else if (label.startsWith('E-Mail')) {
            return this.validateEmail();
        }
        return true;
    }

    validateColors() {
        if ([this.red, this.blue, this.green].some(it => !inRange(it, 0, 256))) {
            return false;
        }
        return true;
    }

    validateEmail() {
        const email = this.email,
            reg = /\S+@\S+\.\S+/;
        return email == null || reg.test(email);
    }

    getRandomFrom(min, max) {
        return parseInt(Math.random() * (max - min) + min, 10);
    }

    getDisplayValue = (v) => {
        if (v == null || v == '') return '\u00a0';

        if (v == this.salaryRange) {
            v = v.map(it => `${it / 1000}k`)
            return v.join('-');
        }

        const val = v.toString();
        return val.length > 20 ? val.substring(0, 18) + '...' : val;
    }


    queryCompanies(value) {
        if (!value) return Promise.resolve([]);

        // could also be a server side fetch passed the query value
        const opts = companies.map(it => {
            if (it.company.startsWith(value.toUpperCase())) return it.company;
            if (it.sector && it.sector.startsWith(value.toLowerCase())) return it.company;
        }).filter(it => !!it).sort();

        return Promise.resolve(opts);
    }


}