import {HoistModel, PlainObject} from '@xh/hoist/core';
import {bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {times} from 'lodash';

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

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.numOptions,
            run: () => (this.bigOptions = times(this.numOptions, i => `option: ${i}`)),
            fireImmediately: true
        });
    }
}
