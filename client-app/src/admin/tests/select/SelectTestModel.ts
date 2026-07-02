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

    // ID value + generateOptionFn example, pre-populated to verify label (not raw id) on mount
    @bindable
    idNotInOpts: number = 99;

    constructor() {
        super();
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
}
