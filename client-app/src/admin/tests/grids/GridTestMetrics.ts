import {observable, makeObservable, action} from '@xh/hoist/mobx';
import {mean, take, head} from 'lodash';

export class GridTestMetrics {
    @observable.ref updateTimes;
    @observable.ref loadTimes;

    get loadTime() {
        return head(this.loadTimes) ?? null;
    }
    get avgLoadTime() {
        return mean(this.loadTimes);
    }

    get updateTime() {
        return head(this.updateTimes) ?? null;
    }
    get avgUpdateTime() {
        return mean(this.updateTimes);
    }

    constructor() {
        this.clear();
        makeObservable(this);
    }

    @action
    clear() {
        this.updateTimes = [];
        this.loadTimes = [];
    }

    @action
    runAsLoad(fn) {
        this.loadTimes.unshift(this.runTimed(fn));
        this.loadTimes = take(this.loadTimes, 10);
        this.updateTimes = [];
    }

    @action
    runAsUpdate(fn) {
        this.updateTimes.unshift(this.runTimed(fn));
        this.updateTimes = take(this.updateTimes, 10);
    }

    runTimed(fn) {
        const loadStart = Date.now();
        fn();
        return Date.now() - loadStart;
    }
}
