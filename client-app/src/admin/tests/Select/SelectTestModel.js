import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {times} from 'lodash';

export class SelectTestModel extends HoistModel {
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

    @bindable
    asyncCreatableValue2;

    @bindable.ref
    objectValue2

    @bindable.ref
    enableMultiLeftIcon
    
    @bindable.ref
    enableMultiMenuOpen

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.numOptions,
            run: () => this.setBigOptions(times(this.numOptions, i => `option: ${i}`)),
            fireImmediately: true
        });
    }
}