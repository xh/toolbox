import {hspacer, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistModel} from '@xh/hoist/core';
import {creates} from '@xh/hoist/core/modelspec/creates';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtDateTime} from '@xh/hoist/format';
import {fmtNumber} from '@xh/hoist/format/FormatNumber';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable, computed} from '@xh/hoist/mobx';
import {forEachAsync, whileAsync} from '@xh/hoist/utils/async';
import {logDebug} from '@xh/hoist/utils/js';
import {sampleGrid} from '../../../desktop/common';
import {times} from 'lodash';
import {wait} from '@xh/hoist/promise';

/**
 * Test to demonstrate use of {@see whileAsync} and its more common cousin {@see forEachAsync}.
 */
export const asyncLoopPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render() {
        return panel({
            title: 'Run to process x iterations of random work while attempting to interact with the grid',
            icon: Icon.refresh(),
            tbar: tbar(),
            item: sampleGrid({omitGridTools: true})
        });
    }
});

const tbar = hoistCmp.factory(({model}) => {
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
            button({
                text: isPending ? 'Working...' : 'Run',
                disabled: isPending,
                icon: Icon.refresh(),
                intent: 'primary',
                outlined: true,
                onClick: () => wait(0).then(() => model.loadAsync())
            }),
            hspacer(),
            lastRunDuration ? span(`Last run took: ${fmtNumber(lastRunDuration)}ms`) : null
        ]
    });
});

class Model extends HoistModel {
    @bindable iterations = 1000 * 1000;
    @bindable lastRunDuration = null;
    @bindable loopType = 'forEachAsync';

    constructor() {
        super();
        makeObservable(this);
    }

    @computed
    get collection() {
        return times(this.iterations, () => ({}));
    }

    async doLoadAsync(loadSpec) {

        if (loadSpec.loadNumber === 0) return;

        const start = Date.now();
        await wait(0);
        await this.runLoopAsync();
        this.setLastRunDuration(Date.now() - start);
    }

    testFn(obj) {
        obj.ignored = this.genRandomObject();
    }

    async runLoopAsync() {
        const {iterations, collection, loopType} = this,
            options = {debug: loopType};
        let i = 0;
        logDebug([`Looping ${iterations} times with ${loopType}`]);
        switch (loopType) {
            case 'forEachAsync':
                return await forEachAsync(collection, (it) => {
                    this.testFn(it);
                }, options);
            case 'whileAsync':
                return await whileAsync(() => i < iterations, () => {
                    this.testFn(collection[i++]);
                }, options);
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
    }

    genRandomObject() {
        const x = Math.random(),
            y = Math.random(),
            now = new Date(),
            fmtNow = fmtDateTime(now);

        return {x, y, now, fmtNow};
    }
}
