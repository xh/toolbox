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
            {name: 'searchQuery', displayName: 'Search'}
        ]
    });

    async queryCustomersAsync(query) {
        const results = await XH.fetchJson({url: 'customer', params: {query}});
        return results.map(it => {
            const value = it.id,
                label = it.company;
            return {value, label};
        });
    }
}
