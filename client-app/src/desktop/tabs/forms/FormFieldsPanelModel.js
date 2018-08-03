import {inRange} from 'lodash';
import {HoistModel} from '@xh/hoist/core';
import {observable, computed, action} from '@xh/hoist/mobx';
import {usStates} from '../../../core/data';
import {movies} from '../../../core/data';

@HoistModel()
export class FormFieldsPanelModel {
    @observable active = null;
    @observable age = null;
    @observable company = null;
    @observable email = null;
    @observable movie = null;
    @observable password = null;
    @observable profileCompletion = this.getRandomFrom(0, 100);
    @observable salaryRange = [this.getRandomFrom(50, 70), this.getRandomFrom(110, 150)].map(val => val * 1000);
    @observable state = null;
    @observable user = null;
    @observable verify = null;
    @observable startDate = null;

    @observable red = this.getRandomFrom(0, 255);
    @observable green = this.getRandomFrom(0, 255);
    @observable blue = this.getRandomFrom(0, 255);

    usStates = usStates;
    movies = movies;

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

    getDisplayValue(v) {
        if (v == null || v == '') return '\u00a0';
        else return v.toString();
    }

    //---------------------
    // Form field setters
    //---------------------
    @action
    setActive(active) {
        this.active = active;
    }

    @action
    setAge(age) {
        this.age = age;
    }

    @action
    setCompany(company) {
        this.company = company;
    }

    @action
    setEmail(email) {
        this.email = email;
    }

    @action
    setMovie(movie) {
        this.movie = movie;
    }

    @action
    setPassword(password) {
        this.password = password;
    }

    @action
    setProfileCompletion(profileCompletion) {
        this.profileCompletion = profileCompletion;
    }

    @action
    setSalaryRange(salaryRange) {
        this.salaryRange = salaryRange;
    }

    @action
    setState(state) {
        this.state = state;
    }

    @action
    setUser(user) {
        this.user = user;
    }

    @action
    setVerify(verify) {
        this.verify = verify;
    }

    @action
    setStartDate(startDate) {
        this.startDate = startDate;
    }

    @action
    setRed(red) {
        this.red = red;
    }

    @action
    setGreen(green) {
        this.green = green;
    }

    @action
    setBlue(blue) {
        this.blue = blue;
    }

}