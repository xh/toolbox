import {HoistModel, PlainObject, XH} from '@xh/hoist/core';
import {action, bindable, observable, makeObservable, runInAction} from '@xh/hoist/mobx';
import {take, times} from 'lodash';

export class SelectTestModel extends HoistModel {
    @bindable
    selectValue: string;

    @bindable
    creatableValue: string;

    @bindable
    asyncValue: number;

    @bindable
    asyncCreatableValue: number;

    @bindable
    groupedValue: string;

    @bindable.ref
    objectValue: PlainObject;

    @bindable
    bigValue: number;

    @bindable
    numOptions = 1000;

    @observable
    bigOptions;

    @bindable
    asyncCreatableValue2: number;

    @bindable.ref
    objectValue2: PlainObject;

    @bindable.ref
    enableMultiLeftIcon: string[];

    @bindable.ref
    enableMultiMenuOpen: string[];

    // ID value + generateOptionFn example, pre-populated to verify label (not raw id) on mount
    @bindable
    idNotInOpts: number = 99;

    // Shape follows perfEnableMulti - a single value, or an array of them.
    @bindable.ref
    perfValue: string | string[];

    @bindable
    perfEnableMulti = false;

    @bindable
    perfEnableCreate = false;

    @bindable
    numPerfOptions = 16000;

    @bindable
    perfLatency = 300;

    // Ms the main thread was blocked following each of the last few async queries - see noteBlock().
    @observable.ref
    blockTimes: number[] = [];

    constructor() {
        super();
        makeObservable(this);

        // Single- and multi-mode values have different shapes - clear on toggle so a value left
        // over from one mode is never handed to the other.
        this.addReaction({
            track: () => this.perfEnableMulti,
            run: () => runInAction(() => (this.perfValue = null))
        });
        this.addReaction({
            track: () => this.numOptions,
            run: () => (this.bigOptions = times(this.numOptions, i => `option: ${i}`)),
            fireImmediately: true
        });
    }

    // All of the records to power the select options and generateOptionFn.
    get employees(): any[] {
        return [
            {id: 1, name: 'Alice Chen', isActive: true},
            {id: 2, name: 'Bob Park', isActive: true},
            {id: 3, name: 'Carol Diaz', isActive: true},
            {id: 4, name: 'Dave Kim', isActive: false},
            {id: 5, name: 'Eve Singh', isActive: true},
            {id: 6, name: 'Fred Rogers', isActive: true},
            {id: 99, name: 'Zara Quinn', isActive: false}
        ];
    }

    // Only active employee records are selectable.
    get selectableEmployees() {
        return this.employees.filter(it => it.isActive);
    }

    // Lookup returns both selectable and not-selectable records.
    lookupEmployeeById(id: number) {
        return this.employees.find(it => it.id === id);
    }

    //------------------------
    // Async merge perf - repro for hoist-react #4589
    //------------------------
    // Type one character (broad match, `numPerfOptions` results), then a second (narrow match, 2
    // results). Both keystrokes blocked the main thread for seconds prior to that fix, the second
    // one on options accumulated by the first rather than on its own 2-row payload.
    async queryPerfOptionsAsync(query: string) {
        const ret = await XH.fetchJson({
            url: 'selectTest/symbols',
            params: {query, count: this.numPerfOptions, latency: this.perfLatency}
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
    // cannot fire until that merge has run - making the delta the block the merge caused. React's
    // own render is not necessarily inside the window, but the trace put it at <1% of the total.
    private noteBlock() {
        const start = performance.now();
        setTimeout(() => {
            const ms = Math.round(performance.now() - start);
            runInAction(() => (this.blockTimes = take([ms, ...this.blockTimes], 5)));
        });
    }
}
