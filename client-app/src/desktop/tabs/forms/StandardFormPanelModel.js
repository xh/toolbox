import {inRange} from 'lodash';
import {HoistModel} from '@xh/hoist/core';
import {computed, setter, observable} from '@xh/hoist/mobx';
import {usStates} from '../../../data';

@HoistModel()
export class StandardFormPanelModel {
    @setter @observable state = null;
    @setter @observable user = null;
    @setter @observable password = null;
    @setter @observable verify = null;
    @setter @observable red = this.getRandomFrom(0, 255);
    @setter @observable green = this.getRandomFrom(0, 255);
    @setter @observable blue = this.getRandomFrom(0, 255);
    @setter @observable age = null;
    @setter @observable email = null;
    @setter @observable company = null;
    @setter @observable active = null;

    options = usStates;

    @computed
    get profileColor() {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    }

    @computed
    get isValid() {
        this.validateColors();
    }

    isFieldValid(label) {
        if (label == 'Profile Color: ') {
            return this.validateColors();
        }
        return true;
    }

    validateColors() {
        if ([this.red, this.blue, this.green].some(it => !inRange(it, 0, 256))) {
            return false;
        }
        return true;
    }

    getRandomFrom(min, max) {
        return parseInt(Math.random() * (max - min) + min, 10);
    }

}