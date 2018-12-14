import {FormModel, required, lengthIs} from '@xh/hoist/cmp/form';
import {movies} from '../../core/data';

@FormModel
export class FormPageModel {

    formModel = new FormModel({
        fields: [{
            name: 'name',
            rules: [required, lengthIs({min: 8})]
        }, {
            name: 'movie',
            rules: [required]
        },
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