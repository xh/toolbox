import {HoistModel} from '@xh/hoist/core';
import {action, bindable, observable, makeObservable} from '@xh/hoist/mobx';

export class CollectionsModel extends HoistModel {
    @bindable count = 1000000;

    @observable setTime = this.calcSetTime();
    @observable arrTime = this.calcArrTime();
    @observable objTime = this.calcObjTime();
    @observable mapTime = this.calcMapTime();

    constructor() {
        super();
        makeObservable(this);
    }

    @action
    test() {
        this.setTime = this.calcSetTime();
        this.arrTime = this.calcArrTime();
        this.objTime = this.calcObjTime();
        this.mapTime = this.calcMapTime();
    }

    calcSetTime(): number {
        const {count} = this,
            set = new Set(),
            start = Date.now();
        for (let i = 0; i < count; i++) {
            set.add(i);
        }
        return Date.now() - start;
    }

    calcArrTime(): number {
        const {count} = this,
            arr = [],
            start = Date.now();
        for (let i = 0; i < count; i++) {
            arr.push(i);
        }
        return Date.now() - start;
    }

    calcObjTime(): number {
        const {count} = this,
            obj = {},
            start = Date.now();
        for (let i = 0; i < count; i++) {
            obj[i] = i;
        }
        return Date.now() - start;
    }

    calcMapTime(): number {
        const {count} = this,
            map = new Map(),
            start = Date.now();
        for (let i = 0; i < count; i++) {
            map.set(i, i);
        }
        return Date.now() - start;
    }
}
