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

    // ID value + lookupFn examples, pre-populated to verify label (not raw id) on mount
    @bindable
    idNotInOpts: number = 99;

    @bindable
    idQueryLookup: number = 3;

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.numOptions,
            run: () => (this.bigOptions = times(this.numOptions, i => `option: ${i}`)),
            fireImmediately: true
        });
    }

    // All of the records to power the select option and lookupFn.
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
