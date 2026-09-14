import {HoistModel, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {take} from 'lodash';

/**
 * Repro for the O(n²) async option merge fixed in hoist-react #4589, which the mobile
 * `SelectInputModel` carried identically to its desktop counterpart.
 *
 * Mobile `Select` has no multi-select mode, but the bug reproduces without one: the dominant cost
 * in the reported trace was the union de-duping the incoming result against *itself*, which is
 * independent of the current selection.
 */
export class SelectTestPageModel extends HoistModel {
    @bindable value: string = null;

    @bindable numOptions = 16000;

    @bindable latency = 300;

    // Ms the main thread was blocked following each of the last few queries - see noteBlock().
    @observable.ref blockTimes: number[] = [];

    constructor() {
        super();
        makeObservable(this);
    }

    async queryOptionsAsync(query: string) {
        const ret = await XH.fetchJson({
            url: 'selectTest/symbols',
            params: {query, count: this.numOptions, latency: this.latency}
        });
        this.noteBlock();
        return ret;
    }

    @action
    clearBlockTimes() {
        this.blockTimes = [];
    }

    // Time the gap between this query resolving and the next macrotask. Select merges the result
    // into its options in the microtask continuation of `await queryFn`, so a timer queued here
    // cannot fire until that merge has run - making the delta the block the merge caused.
    private noteBlock() {
        const start = performance.now();
        setTimeout(() => {
            const ms = Math.round(performance.now() - start);
            runInAction(() => (this.blockTimes = take([ms, ...this.blockTimes], 5)));
        });
    }
}
