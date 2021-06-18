import {HoistModel, managed} from '@xh/hoist/core';
import {FormModel, lengthIs, required} from '@xh/hoist/cmp/form';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {movies} from '../../core/data';

export class FormPageModel extends HoistModel {

    @bindable minimal;
    @bindable readonly;

    constructor() {
        super();
        makeObservable(this);
    }

    @managed
    formModel = new FormModel({
        fields: [
            {name: 'name', rules: [required, lengthIs({min: 8})]},
            {name: 'movie', rules: [required]},
            {name: 'salary'},
            {name: 'date', rules: [required]},
            {name: 'included'},
            {name: 'enabled'},
            {name: 'buttonGroup', initialValue: 'button2'},
            {name: 'notes'},
            {name: 'searchQuery', displayName: 'Search'}
        ]
    });

    movies = movies;
}