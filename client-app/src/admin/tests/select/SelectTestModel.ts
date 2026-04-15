import {HoistModel, PlainObject} from '@xh/hoist/core';
import {bindable, observable} from '@xh/hoist/mobx';
import {times} from 'lodash';

export class SelectTestModel extends HoistModel {
    @bindable accessor selectValue: string;

    @bindable accessor creatableValue: string;

    @bindable accessor asyncValue: number;

    @bindable accessor asyncCreatableValue: number;

    @bindable accessor groupedValue: string;

    @bindable.ref accessor objectValue: PlainObject;

    @bindable accessor bigValue: number;

    @bindable accessor numOptions = 1000;

    @observable accessor bigOptions;

    @bindable accessor asyncCreatableValue2: number;

    @bindable.ref accessor objectValue2: PlainObject;

    @bindable.ref accessor enableMultiLeftIcon: string[];

    @bindable.ref accessor enableMultiMenuOpen: string[];

    constructor() {
        super();
        this.addReaction({
            track: () => this.numOptions,
            run: () => (this.bigOptions = times(this.numOptions, i => `option: ${i}`)),
            fireImmediately: true
        });
    }
}
