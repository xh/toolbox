import {hspacer, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistModel} from '@xh/hoist/core';
import {creates} from '@xh/hoist/core/modelspec/creates';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtDateTime} from '@xh/hoist/format';
import {fmtNumber} from '@xh/hoist/format/FormatNumber';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {whileAsync} from '@xh/hoist/utils/async';
import {logDebug} from '@xh/hoist/utils/js';
import {sampleGrid} from '../../../desktop/common';

/**
 * Test to demonstrate use of {@see whileAsync} and its more common cousin {@see forEachAsync}.
 */
export const asyncLoopPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
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
            switchInput({
                bind: 'runAsync',
                label: 'Use whileAsync',
                labelAlign: 'left'
            }),
            toolbarSep(),
            button({
                text: isPending ? 'Working...' : 'Run',
                disabled: isPending,
                icon: Icon.refresh(),
                intent: 'primary',
                outlined: true,
                onClick: () => model.loadAsync()
            }),
            hspacer(),
            lastRunDuration ? span(`Last run took: ${fmtNumber(lastRunDuration)}ms`) : null
        ]
    });
});

class Model extends HoistModel {
    @bindable runAsync = true;
    @bindable iterations = 1000 * 1000;
    @bindable lastRunDuration = null;

    constructor() {
        super();
        makeObservable(this);
    }

    async doLoadAsync(loadSpec) {
        const start = Date.now();
        if (this.runAsync) {
            await this.runLoopAsync();
        } else {
            this.runLoop();
        }

        this.setLastRunDuration(Date.now() - start);
    }

    async runLoopAsync() {
        const {iterations} = this;
        let runCount = 0,
            ignoredOutput = [];

        logDebug([`Looping ${iterations} times`, `async enabled`]);
        await whileAsync(
            () => runCount < iterations,
            () => {
                runCount++;
                ignoredOutput.push(this.genRandomObject());
            }
        );
    }

    // Async here only to support mask linking above.
    runLoop() {
        const {iterations} = this;
        let runCount = 0,
            ignoredOutput = [];

        logDebug([`Looping ${iterations} times`, `async disabled`]);
        while (runCount < iterations) {
            runCount++;
            ignoredOutput.push(this.genRandomObject());
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
