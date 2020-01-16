import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {times} from 'lodash';

@HoistModel
export class SelectTestModel {
    @bindable
    selectValue;
    @bindable
    creatableValue;
    @bindable
    asyncValue;
    @bindable
    asyncCreatableValue;
    @bindable
    groupedValue;
    @bindable.ref
    objectValue
    @bindable
    bigValue;
    @bindable
    numOptions = 1000;
    @bindable
    bigOptions;

    constructor() {
        this.addReaction({
            track: () => this.numOptions,
            run: () => this.setBigOptions(times(this.numOptions, i => `option: ${i}`)),
            fireImmediately: true
        });
    }
}