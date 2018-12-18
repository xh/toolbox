import {HoistModel} from '@xh/hoist/core';
import {FormModel, required, lengthIs} from '@xh/hoist/cmp/form';
import {bindable} from '@xh/hoist/mobx';
import {movies} from '../../core/data';

@HoistModel
export class FormPageModel {

    @bindable minimal;
    @bindable readonly;

    formModel = new FormModel({
        fields: [
            {name: 'name', rules: [required, lengthIs({min: 8})]},
            {name: 'movie', rules: [required]},
            {name: 'salary'},
            {name: 'included'},
            {name: 'enabled'},
            {name: 'buttonGroup', initialValue: 'button2'},
            {name: 'notes'},
            {name: 'searchQuery', displayName: 'Search'}
        ]
    });

    movies = movies;
}