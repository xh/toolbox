import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {lengthIs, required} from '@xh/hoist/data';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {movies} from '../../core/data';

export class FormPageModel extends HoistModel {
    @bindable minimal: boolean;
    @bindable readonly: boolean;
    readonly movies: PlainObject[] = movies;

    constructor() {
        super();
        makeObservable(this);
    }

    @managed
    formModel: FormModel = new FormModel({
        fields: [
            {name: 'name', rules: [required, lengthIs({min: 8})]},
            {name: 'customer', rules: [required]},
            {name: 'movie', rules: [required]},
            {
                name: 'salary',
                rules: [
                    ({value}) =>
                        value < 10_000 ? {severity: 'warning', message: 'Salary seems low.'} : null
                ]
            },
            {name: 'percentage'},
            {
                name: 'date',
                rules: [
                    required,
                    ({value}) =>
                        value && !value.isWeekday
                            ? {severity: 'info', message: 'Selected date falls on a weekend.'}
                            : null
                ]
            },
            {name: 'enabled'},
            {name: 'buttonGroup', initialValue: 'button2'},
            {name: 'notes'},
            {name: 'searchQuery', displayName: 'Search'},
            {name: 'employeeId', displayName: 'Employee (using ID)', initialValue: 99},
            {name: 'customerId', displayName: 'Customer (using ID)', initialValue: 6} // Multiples of 3 are inactive.
        ]
    });

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

    // Only some of the employee records are selectable.
    get selectableEmployees() {
        return this.employees.filter(it => it.isActive);
    }

    // Lookup returns both selectable and not-selectable records.
    lookupEmployeeById(id: number) {
        return this.employees.find(it => it.id === id);
    }

    async queryCustomersAsync(query) {
        const results = await XH.fetchJson({
            url: 'customer',
            params: {query, activeOnly: true}
        });
        return results.map(it => {
            const value = it.id,
                label = it.company;
            return {value, label};
        });
    }

    async lookupCustomerByIdAsync(id) {
        const result = await XH.fetchJson({url: 'customer', params: {id}});
        return {value: result.id, label: result.company};
    }
}
