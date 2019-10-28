import {HoistModel, managed} from '@xh/hoist/core';
import {FormModel, required, lengthIs} from '@xh/hoist/cmp/form';
import {bindable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import moment from 'moment';

import {movies} from '../../core/data';

@HoistModel
export class FormPageModel {

    @bindable minimal;
    @bindable readonly;

    @managed
    formModel = new FormModel({
        fields: [
            {name: 'name', rules: [required, lengthIs({min: 8})]},
            {name: 'movie', rules: [required]},
            {name: 'salary'},
            {name: 'date', initialValue: moment().toDate(), rules: [required]},
            {name: 'localDate', initialValue: LocalDate.today()},
            {name: 'included'},
            {name: 'enabled'},
            {name: 'buttonGroup', initialValue: 'button2'},
            {name: 'notes'},
            {name: 'searchQuery', displayName: 'Search'}
        ]
    });

    movies = movies;
}