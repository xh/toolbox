import {HoistModel, Thunkable} from '@xh/hoist/core';
import { action, observable, runInAction } from '@xh/hoist/mobx';
import {executeIfFunction} from '@xh/hoist/utils/js';

export interface LoadTime {
    tag: string;
    took: number;
    start: number;
}

/** Wall-clock timings for the actions this tester drives, kept as the last of each. */
export class LoadTimesModel extends HoistModel {
    @observable.ref accessor fetch: LoadTime = null;
    @observable.ref accessor total: LoadTime = null;

@action
    clearLoadTimes() {
        this.fetch = this.total = null;
    }

    async withFetchTime(tag: Thunkable<string>, fn) {
        const ret = await this.timeAsync(tag, fn);
        runInAction(() => (this.fetch = ret));
    }

    async withLoadTime(tag: Thunkable<string>, fn) {
        const ret = await this.timeAsync(tag, fn);
        runInAction(() => (this.total = ret));
    }

    // Tags can be deferred, for actions that only know what they did once done.
    private async timeAsync(tag: Thunkable<string>, fn): Promise<LoadTime> {
        const start = Date.now();
        await fn();
        return {tag: executeIfFunction(tag), took: Date.now() - start, start};
    }
}
