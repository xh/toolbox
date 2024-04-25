import {hspacer, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistModel, managed, creates} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtDateTime} from '@xh/hoist/format';
import {fmtNumber} from '@xh/hoist/format/FormatNumber';
import {Icon} from '@xh/hoist/icon';
import {bindable, observable, makeObservable, runInAction, computed} from '@xh/hoist/mobx';
import {forEachAsync, Timer, whileAsync} from '@xh/hoist/utils/async';
import {withDebug} from '@xh/hoist/utils/js';
import {sampleGrid} from '../../../desktop/common/grid/SampleGrid';
import {times} from 'lodash';
import {wait} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';

/**
 * Test to demonstrate use of {@see whileAsync} and its more common cousin {@see forEachAsync}.
 */
export const asyncLoopPanel = hoistCmp.factory({
    model: creates(() => AsyncLoopPanelModel),

    render() {
        return panel({
            title: 'Run to process x iterations of random work while attempting to interact with the grid',
            icon: Icon.refresh(),
            tbar: tbar(),
            item: sampleGrid({omitGridTools: true})
        });
    }
});

const tbar = hoistCmp.factory<AsyncLoopPanelModel>(({model}) => {
    const {loadModel, lastRunDuration} = model,
        {isPending} = loadModel;

    return toolbar({
        items: [
            span('Iterations:'),
            numberInput({
                bind: 'iterations',
                width: 100
            }),
            toolbarSep(),
            'Loop Type:',
            select({
                bind: 'loopType',
                options: ['forEach', 'while', 'forEachAsync', 'whileAsync']
            }),
            toolbarSep(),
            toolbarSep(),
            'Auto-Refresh (secs):',
            select({
                bind: 'refreshInterval',
                options: [-1, 5, 10, 30]
            }),
            button({
                text: isPending ? 'Working...' : 'Run',
                disabled: isPending,
                icon: Icon.refresh(),
                intent: 'primary',
                outlined: true,
                onClick: () => wait().then(() => model.loadAsync())
            }),
            hspacer(),
            lastRunDuration
                ? span(`Last run took `, fmtNumber(lastRunDuration, {label: 'ms'}))
                : null
        ]
    });
});

class AsyncLoopPanelModel extends HoistModel {
    @bindable iterations = 1000 * 1000;
    @bindable loopType = 'forEachAsync';
    @bindable refreshInterval = -1;
    @observable lastRunDuration: number = null;

    @managed timer = Timer.create({
        runFn: () => this.refreshAsync(),
        interval: () => this.refreshInterval * SECONDS
    });

    constructor() {
        super();
        makeObservable(this);
    }

    @computed
    get collection() {
        return times(this.iterations, () => ({}));
    }

    override async doLoadAsync(loadSpec) {
        if (loadSpec.loadNumber === 0) return;

        const start = Date.now();
        await wait();
        await this.runLoopAsync();
        runInAction(() => (this.lastRunDuration = Date.now() - start));
    }

    testFn(obj) {
        obj.ignored = this.genRandomObject();
    }

    async runLoopAsync() {
        const {iterations, collection, loopType} = this;

        await withDebug(`Looping ${iterations} times with ${loopType}`, async () => {
            let i = 0;
            switch (loopType) {
                case 'forEachAsync':
                    return forEachAsync(collection, it => {
                        this.testFn(it);
                    });
                case 'whileAsync':
                    return whileAsync(
                        () => i < iterations,
                        () => {
                            this.testFn(collection[i++]);
                        }
                    );
                case 'forEach':
                    collection.forEach(it => {
                        this.testFn(it);
                    });
                    return;
                case 'while':
                    while (i < iterations) {
                        this.testFn(collection[i++]);
                    }
                    return;
            }
        });
    }

    genRandomObject() {
        const x = Math.random(),
            y = Math.random(),
            now = new Date(),
            fmtNow = fmtDateTime(now);

        return {x, y, now, fmtNow};
    }
}
